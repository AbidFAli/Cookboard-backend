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

const getRecipe = async (recipeId: string) =>{
  let response: null| IRecipe = await Recipe.findById(recipeId);
  if(!response){
    return undefined
  }
  return {avgRating: response.avgRating, recipeName: response.name};
}

const getUserHasRated = async (recipeId: string, userId: string ) => {
  let response : null | IRating = await Rating.findOne({recipeId: recipeId, userId: userId });
  if(!response){
    return false;
  }
  return true;
}

const getRatingsInfo = async (searchParams: {recipeId? : string, userId?: string}) => {
  let allRatings: [] | IRating[] = await Rating.find({recipeId: searchParams.recipeId});
  let userRatings = allRatings.filter((rating) => (("" + rating.userId) === searchParams.userId));
  return {
    allRatings, userRatings
  };
}


interface IProgOutput{
  recipeName?: string;
  avgRating?: number;
  userHasRated?: boolean;
  userRatingsForRecipe?: Array<Object>;
  userRatingsCount?: number;
  allRatingsForRecipe?: Array<Object>;
  allRatingsCount?: number;
}

const run = async () => {
  let connection: any;
  let fileHandle: any;
  try{
    program.option('--user <user>')
      .option('--recipe <recipe>')
      .option('--debug');
    //hello
    program.parse();
    const options = program.opts();
    const recipeId = options.recipe;
    const userId = options.user;
    const debugOn = options.debug;
    if(debugOn){
      console.log(process.argv);
      console.log(options);
    }
    console.log(`recipeId:${recipeId},userId:${userId}`);

    connection = await connectToMongo();
    const progOutput: IProgOutput = {};
    if(recipeId){
      const recipeResponse = await getRecipe(recipeId);
      if(recipeResponse){
        ({avgRating: progOutput.avgRating, recipeName: progOutput.recipeName}  = recipeResponse);
      }
       
    }

    if(recipeId && userId){
      progOutput.userHasRated = await getUserHasRated(recipeId, userId);
    }

    if(recipeId || userId){
      const ratingsInfo = await getRatingsInfo({recipeId: recipeId, userId: userId});
      progOutput.allRatingsForRecipe = ratingsInfo.allRatings;
      progOutput.allRatingsCount = ratingsInfo.allRatings.length;
      progOutput.userRatingsForRecipe = ratingsInfo.userRatings;
      progOutput.userRatingsCount = ratingsInfo.userRatings.length;
    }
    
    fileHandle = await open('results.json', 'w')
    let outputStr = JSON.stringify(progOutput, null, 2);
    console.log(outputStr);
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