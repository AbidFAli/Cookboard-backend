const mongoose = require("mongoose");
const { ingredientSchema } = require("./ingredient");
const { COLLATION_OPTION } = require("../utils/modelHelper");
const { Rating } = require("./rating");

const MAX_RATING = 5;

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
//@param options: {
//  noDoc: True| False. If true, returns the updated recipe. If false, returns an empty documnet.
//}
recipeSchema.statics.addRating = async function (id, newRating, options) {
  //subtract = 1st arg - 2nd arg
  let top = { $subtract: [newRating, "$avgRating"] };
  let bottom = { $add: [1, "$numRatings"] };
  await mongoose.model("Recipe").updateOne({ _id: id }, [
    {
      $set: {
        avgRating: { $add: ["$avgRating", { $divide: [top, bottom] }] },
        numRatings: bottom,
      },
    },
  ]);
  if (!options || (options && options.noDoc === false)) {
    return mongoose.model("Recipe").findById(id);
  } else {
    return {};
  }
};

// recipeSchema.methods.removeRating = function (ratingToRemove) {
//   mongoose.model("Recipe").updateOne({ _id: this._id }, []);
// };

const Recipe = mongoose.model("Recipe", recipeSchema);
module.exports = {
  Recipe,
};

//todo later: add a getter for rating
