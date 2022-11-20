const { Schema, default: mongoose } = require("mongoose");
const { autoIndexEnabled } = require("../utils/modelHelper");

//16*2^20 bytes document size limit ~= 16million

//Alternate Key = (Recipe, User, Date)
const commentsSchema = new Schema(
  {
    likes: { type: Number, min: 0, default: 0 },
    text: { type: String, maxLength: 10 * Math.pow(10, 8), required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment" },
    recipe: { type: Schema.Types.ObjectId, ref: "Recipe", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true }, //up to seconds
  },
  {
    autoIndex: autoIndexEnabled(),
  }
);

//display comments sorted by likes
commentsSchema.index({ recipe: 1, likes: 1 });
//display comments sorted by creation date
commentsSchema.index({ recipe: 1, date: 1 });
//find all replies to a comment. TODO: use dummy node
//commentsSchema.index({ recipe: 1, parent: 1 });

commentsSchema.set("toJSON", {
  transform: function (doc, returnedObject, options) {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.date = doc.date.valueOf();

    delete returnedObject._id;
    return returnedObject;
  },
});

commentsSchema.statics.dateComparator = (direction) => {
  return (comment1, comment2) => {
    if (direction === 1 || direction === "asc") {
      return comment1.date - comment2.date;
    } else if (direction === -1 || direction === "desc") {
      return comment2.date - comment1.date;
    } else {
      throw "Comment.dateComparator direction must be 1/-1/asc/desc";
    }
  };
};

commentsSchema.statics.likesComparator = (direction) => {
  return (comment1, comment2) => {
    if (direction === 1 || direction === "asc") {
      return comment1.likes - comment2.likes;
    } else if (direction === -1 || direction === "desc") {
      return comment2.likes - comment1.likes;
    } else {
      throw "Comment.likesComparator direction must be 1/-1/asc/desc";
    }
  };
};

const Comment = new mongoose.model("Comment", commentsSchema);

module.exports = { Comment };
