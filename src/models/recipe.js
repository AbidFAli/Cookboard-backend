const mongoose = require("mongoose");
const { ingredientSchema } = require("./ingredient");
const { COLLATION_OPTION } = require("../utils/modelHelper");
const { Rating } = require("./rating");

const MAX_RATING = 5;

class RecipeError extends Error {
  constructor(msg, options) {
    super(msg, options);
  }
}

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    instructions: [String],
    ingredients: [ingredientSchema],
    avgRating: {
      type: Number,
      default: 0,
      alias: "rating",
    },
    numRatings: {
      type: Number,
      default: 0,
    },
    timeToMake: {
      value: Number,
      unit: String,
    },
    servingInfo: {
      numServed: Number,
      yield: Number,
      servingSize: Number,
      unit: String,
    },
    photos: [
      {
        key: String,
        url: String,
        caption: String,
        title: String,
      },
    ],
    calories: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    autoIndex: false,
    writeConcern: {
      w: "majority",
      j: false,
      wtimeout: 2000,
    },
  }
);

//renames _id to id when recipe is returned as json from MongoDB
recipeSchema.set("toJSON", {
  transform: function (doc, returnedObject, options) {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    returnedObject.rating = returnedObject.avgRating;
    delete returnedObject.avgRating;
    return returnedObject;
  },
});

recipeSchema.index({ name: "text", avgRating: -1 }, COLLATION_OPTION); //change this to use AtlasSearch
recipeSchema.index({ user: 1, "ingredients.name": 1 }, COLLATION_OPTION);
recipeSchema.index({ user: 1, avgRating: -1 });
recipeSchema.index({ avgRating: -1 });

//computes the average using formula: newAvg = avgRating + (newRating - avgRating) / ( numRatings + 1)
//and returns a copy of the recipe with the updated rating.
//@param {string} id: id of the recipe
//@param {int} newRating: rating to be added
recipeSchema.statics.addRating = async function (id, newRating, options) {
  //subtract = 1st arg - 2nd arg
  let top = { $subtract: [newRating, "$avgRating"] };
  let bottom = { $add: [1, "$numRatings"] };
  let returnDoc;
  returnDoc = await mongoose.model("Recipe").findOneAndUpdate(
    { _id: id },
    [
      {
        $set: {
          avgRating: { $add: ["$avgRating", { $divide: [top, bottom] }] },
        },
      },
      {
        $set: {
          numRatings: bottom,
        },
      },
    ],
    { new: true }
  );
  return returnDoc;
};

/*
Credit: https://stackoverflow.com/questions/22999487/update-the-average-of-a-continuous-sequence-of-numbers-in-constant-time
perform SAFE average calculation
  avgRating = (N * average - oldRating) / (N - 1)
  if numRatings=0 and average = 0

@param {string} id: id of the recipe
@param {int} oldRating: rating to remove
@param {object} session: mongoose session
@returns null || Recipe :  if error null, otherwise updated recipe
*/

recipeSchema.statics.removeRating = async function (id, oldRating, session) {
  if (!session) {
    return null; //TODO throw error here
  }
  const decrement = { $max: [0, { $subtract: ["$numRatings", 1] }] };

  const top = {
    $subtract: [{ $multiply: ["$avgRating", "$numRatings"] }, oldRating],
  };
  const avgRatingCalc = { $divide: [top, { $subtract: ["$numRatings", 1] }] };

  const ifStatement = (elseStatement) => {
    let obj = {
      $cond: {
        if: { $lte: ["$numRatings", 1] },
        then: 0,
        else: elseStatement,
      },
    };

    return obj;
  };

  const avgRatingStatement = ifStatement(avgRatingCalc);

  let updatedRecipe = null;
  try {
    updatedRecipe = await mongoose.model("Recipe").findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            avgRating: avgRatingStatement,
          },
        },
        {
          $set: {
            numRatings: decrement,
          },
        },
      ],
      { new: true }
    );
  } catch (error) {
    console.log(error); //TODO throw error here
    throw error;
  }

  return updatedRecipe;
};

/*
 *@param {string} id: id of the recipe
 *@param {int} oldRating: rating to remove
 *@param {int} newRating: rating to add
 *@param {objecte} session: mongoose session
 *@throws RecipeError
 *@returns null || Recipe: null if error, otherwise updated Recipe
 */
recipeSchema.statics.replaceRating = async function (
  id,
  oldRating,
  newRating,
  session
) {
  let anyError = null;
  if (!session) {
    throw new RecipeError("replaceRating: no session provided");
  }

  let product = { $multiply: ["$avgRating", "$numRatings"] };
  let difference = { $subtract: [product, oldRating] };
  let top = { $add: [difference, newRating] };
  let updateStatement = { $divide: [top, "$numRatings"] };
  let updatedRecipe = null;
  try {
    updatedRecipe = await mongoose.model("Recipe").findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            avgRating: updateStatement,
          },
        },
      ],
      { new: true }
    );
  } catch (error) {
    console.log(error);
    throw error;
  }

  if (anyError) {
    throw anyError;
  }
  return updatedRecipe;
};

const Recipe = mongoose.model("Recipe", recipeSchema);
module.exports = {
  Recipe,
  RecipeError,
};
