import { HydratedDocument } from 'mongoose';
import { DBComment, type IDBComment } from './commentSchema';




export class Comment{
  doc: HydratedDocument<IDBComment>;
  // mLikes: number;
  // mDate: Date;
  // mText: string;
  // mParent: Types.ObjectId | null; 
  // mRecipe: Types.ObjectId;
  // mId: Types.ObjectId | null;

  constructor(){
    this.doc = new DBComment();
  }
  get id(){
    return this.doc.id;
  }

  set id(val){
    this.doc.id = val;
  }

  get recipe(){
    return this.doc.recipe;
  }

  set recipe(val){
    this.doc.recipe = val;
  }

  get parent(){
    return this.doc.parent;
  }

  set parent(val){
    this.doc.parent = val;
  }

  get text(){
    return this.doc.text;
  }

  set text(val){
    this.doc.text = val;
  }

  get date(){
    return this.doc.createdAt;
  }

  set date(val){
    this.doc.createdAt = val;
  }

  get likes(){
    return this.doc.likes;
  }

  set likes(val){
    this.doc.likes = val;
  }

  async save(){
    await this.doc.save();
  }

  

}