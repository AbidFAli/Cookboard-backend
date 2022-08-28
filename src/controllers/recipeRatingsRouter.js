const recipeRatingsRouter = require("express").Router();
const { Rating } = require("../models/rating");
const { Recipe } = require("../models/recipe");

//3 options: getByUserID, getByRecipeId, getOne(userId, recipeId)
/*
  GET /api/recipes/ratings?recipe=<recipeId>?userId=<id>

query params
    recipe: optional,
    userId: optional,
 @returns [Rating]
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

//create rating object
//save to db
//update avg rating of recipe
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
    await Recipe.addRating(body.recipe, rating.value, { returnDoc: false });

    response.status(201).json(createdRating);
  } catch (error) {
    next(error);
  }
});

module.exports = { recipeRatingsRouter };
