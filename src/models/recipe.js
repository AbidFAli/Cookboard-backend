const mongoose = require("mongoose");
const { ingredientSchema } = require("./ingredient");
const { COLLATION_OPTION } = require("../utils/modelHelper");

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    instructions: [String],
    ingredients: [ingredientSchema],
    rating: {
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
    return returnedObject;
  },
});

recipeSchema.index({ name: "text", rating: -1 }, COLLATION_OPTION); //change this to use AtlasSearch
recipeSchema.index({ user: 1, "ingredients.name": 1 }, COLLATION_OPTION);
recipeSchema.index({ user: 1, rating: -1 });
recipeSchema.index({ rating: -1 });
const Recipe = mongoose.model("Recipe", recipeSchema);
module.exports = Recipe;
