const recipeRatingsRouter = require("express").Router();
const { Rating } = require("../models/rating");
const { Recipe } = require("../models/recipe");
const { isArray, isNil } = require("lodash");
const { default: mongoose } = require("mongoose");
const { ID_ROUTE_REGEX } = require("../utils/controllers/routerHelper");

//3 options: getByUserID, getByRecipeId, getOne(userId, recipeId)
/*
  GET /api/recipes/ratings?recipe=<recipeId>&userId=<id>

query params
    recipe: optional,
    userId: optional,
 @returns Array of Rating
*/
recipeRatingsRouter.get("/", async (request, response, next) => {
  try {
    let recipeId = request.query.recipe;
    let userId = request.query.userId;
    let filter = {};
    if (recipeId && userId) {
      filter.recipe = recipeId;
      filter.userId = userId;
    } else if (recipeId) {
      filter.recipe = recipeId;
    } else if (userId) {
      filter.userId = userId;
    }
    const rating = await Rating.find(filter);
    response.status(200).json(rating);
  } catch (error) {
    next(error);
  }
});

/*
*description:  create rating object, saves it to the db, and updates the average rating of that recipe
*body:
  {
    recipe: string, mandatory. The id of the recipe to rate
    value: number, mandatory. The value of the rating
  }
*/
recipeRatingsRouter.post("/", async (request, response, next) => {
  try {
    const body = request.body;
    let user = request.user;
    if (!body.recipe || !body.value) {
      return response.status(400).send();
    }

    const rating = new Rating({
      value: body.value,
      userId: user.id,
      recipe: body.recipe,
    });
    const createdRating = await rating.save();
    let newRecipe = await Recipe.addRating(body.recipe, rating.value);

    response.status(201).json({
      rating: createdRating,
      average: newRecipe.avgRating,
      numRatings: newRecipe.numRatings,
    });
  } catch (error) {
    next(error);
  }
});

//TODO: change back to node/:id/node2/:id2 format instead of using query params
//read this: https://github.com/RestCheatSheet/api-cheat-sheet#api-design-cheat-sheet
/*
  description: update a single existing rating
  example: PUT /api/recipes/ratings/
  request body: {
    recipe: string, mandatory. The id of the recipe to rate
    oldValue: number, mandatory. Old value of rating
    newValue: number, mandatory. New value of rating
  }

  response body: {
    avgRating: number
    numRatings: number
  }
*/
recipeRatingsRouter.put("/", async (request, response, next) => {
  const body = request.body;
  const user = request.user;
  try {
    if (!body.recipe || isNil(body.oldValue) || isNil(body.newValue)) {
      return response.status(400).send();
    }

    await Rating.findOneAndUpdate(
      { userId: user.id, recipe: body.recipe },
      {
        value: body.newValue,
      }
    );
    let session = await mongoose.startSession();
    let updatedRecipe = await Recipe.replaceRating(
      body.recipe,
      body.oldValue,
      body.newValue,
      session
    );
    await session.endSession();

    response.status(201).json({
      avgRating: updatedRecipe.avgRating,
      numRatings: updatedRecipe.numRatings,
    });
  } catch (error) {
    next(error);
  }
});

/*
  delete a single existing rating
  DELETE /api/recipes/ratings/:recipeId
  response body: {
    avgRating: number,
    numRatings: number
  }
*/
recipeRatingsRouter.delete(
  `/:recipeId(${ID_ROUTE_REGEX})`,
  async (request, response, next) => {
    if (!request.params.recipeId) {
      response.status(400).send();
    }
    let recipeId = request.params.recipeId;
    let session = null;
    let recipeInfo = null;
    try {
      session = await mongoose.startSession();
      let rating = await Rating.findOne({
        userId: request.user.id,
        recipe: recipeId,
      });
      await Rating.deleteOne({ userId: request.user.id, recipe: recipeId });
      recipeInfo = await Recipe.removeRating(recipeId, rating.value, session);
    } catch (error) {
      next(error);
    } finally {
      if (session) {
        await session.endSession();
      }
    }
    if (recipeInfo !== null) {
      response.send({
        avgRating: recipeInfo.avgRating,
        numRatings: recipeInfo.numRatings,
      });
    } else {
      response.status(400).send();
    }
  }
);

//recompute rating
recipeRatingsRouter.post("/recompute");

module.exports = { recipeRatingsRouter };
