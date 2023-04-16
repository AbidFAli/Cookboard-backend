/// <reference path="./mongoose-unique-validator.d.ts"
import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";


interface IUser{
  username: String;
  email?: String;
  passwordHash: String;
  recipes: mongoose.Types.ObjectId[] | Record<string, any>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minLength: 3,
    },
    email: String,
    passwordHash: {
      type: String,
      required: true,
    },
    recipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
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

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
