// import config = require("utils/config");
import { program } from "commander";
import { open } from 'fs/promises';
import { Rating } from "models/rating";
import { Recipe } from "models/recipe";
import { Types } from 'mongoose';
import { connectToMongo } from "utils/mongoHelper";
import User = require("models/user"); //i dont think this import will work


//usage:
/*
  ./ratingDebug -u <user> -r <recipe>   #get the users rating from the recipe if it exists, otherwise return an empty document
  ./ratingDebug -r <recipe> # get the avgRating from the document, also get all of the ratings for a recipe
*/



interface IRecipe {
  avgRating: number;
  name: string;
}

interface IRating{
  value: number;
  userId: Types.ObjectId;
  recipeId: Types.ObjectId;
  recipeName: string;
}

const getAvgRatingFromDoc = async (recipeId: string) =>{
  let response: null| IRecipe = await Recipe.findById(recipeId);
  if(!response){
    return undefined
  }
  return response.avgRating;
}

const getUserHasRated = async (recipeId: string, userId: string ) => {
  let response : null | IRating = await Rating.findOne({recipeId: recipeId, userId: userId });
  if(!response){
    return false;
  }
  return true;
}

const getRatings = async (searchParams: {recipeId? : string, userId?: string}) => {
  let response: [] | IRating[] = await Rating.find({recipeId: searchParams.recipeId, userId: searchParams.userId});
  return response;
}


interface IProgOutput{
  avgRating?: number;
  hasRated?: boolean;
  ratings?: Array<Object>;
  ratingsCount?: number;
}

const run = async () => {
  let connection: any;
  let fileHandle: any;
  try{
    program.option('--user <user>')
      .option('--recipe <recipe>');
    //hello
    program.parse();
    const options = program.opts();
    const recipeId = options.recipe;
    const userId = options.user;

    connection = await connectToMongo();
    const progOutput: IProgOutput = {};
    if(recipeId){
      progOutput.avgRating = await getAvgRatingFromDoc(recipeId);
    }

    if(recipeId && userId){
      progOutput.hasRated = await getUserHasRated(recipeId, userId);
    }

    if(recipeId || userId){
      progOutput.ratings = await getRatings({recipeId: recipeId, userId: userId});
      progOutput.ratingsCount = progOutput.ratings.length;
    }
    
    fileHandle = await open('results.json', 'w')
    let outputStr = JSON.stringify(progOutput, null, 2);
    await fileHandle.writeFile(outputStr);
  }
  catch(error: any){
    console.log(error);
  }finally{
    if(connection){
      connection.disconnect();
    }
    if(fileHandle){
      await fileHandle.close();
    }
  }
}

run();