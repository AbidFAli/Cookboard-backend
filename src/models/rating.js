const { mongoose, Schema } = require("mongoose");
const autopopulatePlugin = require("mongoose-autopopulate");
const { autoIndexEnabled } = require("./modelHelper");

const ratingSchema = new mongoose.Schema(
  {
    value: Number,
    userId: Schema.Types.ObjectId,
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
    },
    recipeName: String,
  },
  {
    autoIndex: autoIndexEnabled(),
  }
);

//ratingSchema.plugin(autopopulatePlugin);
ratingSchema.index({ userId: 1, recipeId: -1 }, { unique: true });

ratingSchema.set("toJSON", {
  transform: function (doc, returnedObject, options) {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    return returnedObject;
  },
  virtuals: true,
});

// ratingSchema.post("save", async function (doc, next) {
//   await doc.populate("recipe", { _id: 1, name: 1 });
// });

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = {
  Rating,
};
