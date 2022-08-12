const { mongoose, Schema } = require("mongoose");
const autopopulatePlugin = require("mongoose-autopopulate");

const ratingSchema = new mongoose.Schema(
  {
    value: Number,
    userId: Schema.Types.ObjectId,
    recipe: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
      autopopulate: { select: "name" },
    },
  },
  {
    autoIndex: false,
    selectPopulatedPaths: false,
  }
);

ratingSchema.plugin(autopopulatePlugin);
ratingSchema.index({ userId: 1, recipeId: -1 });

ratingSchema.set("toJSON", {
  transform: function (doc, returnedObject, options) {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    return returnedObject;
  },
  virtuals: true,
});

ratingSchema.post("save", async function (doc, next) {
  await doc.populate("recipe", { _id: 1, name: 1 });
});

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = {
  Rating,
};
