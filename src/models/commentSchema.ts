import mongoose, { Document, Schema, SchemaTimestampsConfig, Types } from 'mongoose';
import { autoIndexEnabled } from './modelHelper';

interface IComment{
  likes: number;
  text: string;
  parent: Types.ObjectId;
  recipe: Types.ObjectId;
  user: Types.ObjectId;
}

export type IDBComment = IComment & Document & SchemaTimestampsConfig;

export const commentSchema = new Schema<IDBComment>({
  likes: Number,
  text: String,
  parent: {type: Schema.Types.ObjectId, ref: "CommentSchema"},
  recipe: {type: Schema.Types.ObjectId, ref: "Recipe"},
  user: {type: Schema.Types.ObjectId, ref: "User"}
}, {
  timestamps: true,
  autoIndex: autoIndexEnabled()
});

commentSchema.index({
  recipe: 1, likes: 1
})
commentSchema.index({
  recipe: 1, parent: 1
})

commentSchema.set("toJSON", {
  transform: function (doc, returnedObject, options) {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    return returnedObject;
  },
  virtuals: true,
});

export const DBComment = mongoose.model<IDBComment>("Comment", commentSchema);


