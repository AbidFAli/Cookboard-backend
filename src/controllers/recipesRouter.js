const recipesRouter = require("express").Router();
const { recipesPhotoRouter } = require("./recipesPhotoRouter");
const { Recipe } = require("../models/recipe");
const { ID_ROUTE_REGEX } = require("./util/routerHelper");
const helper = require("./util/recipesRouterHelper");
const mongoHelper = require("../utils/mongoHelper");
const { recipeRatingsRouter } = require("./recipeRatingsRouter");
const mongoose = require("mongoose");
const { isArray } = require("lodash");

recipesRouter.use(`/:recipeId(${ID_ROUTE_REGEX})/photos`, recipesPhotoRouter);
recipesRouter.use("/ratings", recipeRatingsRouter);

recipesRouter.get("/", async (request, response, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    const recipes = await Recipe.find({})
      .readConcern("majority")
      .session(session);

    response.json(recipes);
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

recipesRouter.get(
  `/:recipeId(${ID_ROUTE_REGEX})`,
  async (request, response, next) => {
    const id = request.params.recipeId;
    let session;

    try {
      session = await mongoose.startSession();
      const recipe = await Recipe.findById(id)
        .readConcern("majority")
        .session(session);
      if (recipe) {
        response.json(recipe);
      } else {
        response.status(404).end();
      }
    } catch (error) {
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/*
 * Query parameters: {
 * name: String; the name of the recipe to search for,
 * ingredient: String; the name of the ingredient to search for,
 * ratingMin: Number;
 * ratingMax: Number;
 * count: Number; whether to return recipes or a count of the number of recipes matching the search criteria;
 * start: Number; the position(starts at 0) of the recipe in the search results from which to begin returning.
 *   Ignored if params.count is provided
 *}
 */
//sort priority: name, rating,
recipesRouter.get("/search", async (request, response, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    let query = Recipe.aggregate()
      .search(helper.buildSearchOptions(request.query))
      .session(session);
    if (
      request.query.count === "true" ||
      request.query.count === "True" ||
      request.query.count === 1 ||
      request.query.count === true
    ) {
      let count = await query.count("resultCount"); //count is array of documents
      response.json({ count: count[0].resultCount });
    } else {
      let recipes = await helper.completeSearchQuery(query, request.query);
      recipes.forEach((recipe) => {
        recipe.id = recipe._id;
        delete recipe._id;
      });
      response.json(recipes);
    }
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

/*
    Example Request Header: {'Authorization': 'Bearer yourTokenHere'}
*/
recipesRouter.post("/", async (request, response, next) => {
  let session;
  const body = request.body;
  let user = request.user;

  const recipe = new Recipe({
    name: body.name,
    description: body.description,
    instructions: body.instructions,
    ingredients: body.ingredients,
    rating: body.rating,
    timeToMake: body.timeToMake,
    servingInfo: body.servingInfo,
    calories: body.calories,
    user: user != null ? user._id : null, //id of the user, should probably change this
  });

  try {
    session = await mongoose.startSession();
    const savedRecipe = await recipe.save({ session });
    if (user) {
      user.recipes = user.recipes.concat(savedRecipe._id);
      await user.save({ session });
    }
    response.status(201).json(recipe);
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

/*
 *Returns updated recipe in response body or status code of 401 if recipe is not owned by user
 *or status code of 404 if the recipe with the provided id does not exist.
 */
recipesRouter.put(
  `/:recipeId(${ID_ROUTE_REGEX})`,
  async (request, response, next) => {
    let session;
    try {
      session = await mongoose.startSession();
      const recipe = await Recipe.findById(request.params.recipeId)
        .session(session)
        .readConcern("majority");

      if (!recipe) {
        return response.status(404).end();
      } else if (recipe.user.toString() === request.user.id) {
        let newRecipe = request.body;

        const properties = [
          "name",
          "description",
          "instructions",
          "ingredients",
          "avgRating",
          "numRatings",
          "timeToMake",
          "servingInfo",
          "photos",
          "calories",
          "user",
        ];

        for (let prop of properties) {
          if (newRecipe[prop] !== null && newRecipe[prop] !== undefined) {
            recipe[prop] = newRecipe[prop];
          }
        }

        let updatedRecipe = await recipe.save();
        response.send(updatedRecipe);
      } else if (recipe.user.toString() !== request.user.id) {
        return response.status(401).end();
      }
    } catch (error) {
      next(error);
    } finally {
      session.endSession();
    }
  }
);

/*
 *Returns response of:
 * 204: successful deletion
 * 401: no user provided, or recipe is not owned by user making this request
 * 404: no recipe found with the provided id
 */
recipesRouter.delete(
  `/:recipeId(${ID_ROUTE_REGEX})`,
  async (request, response, next) => {
    let session;
    try {
      session = await mongoose.startSession();
      let recipe = await Recipe.findById(request.params.recipeId)
        .session(session)
        .readConcern("majority");

      if (!recipe) {
        return response.status(404).end(); // no recipe found with that id
      } else if (recipe.user.toString() !== request.user.id) {
        return response.status(401).end();
      }

      let query = await Recipe.deleteOne({
        _id: request.params.recipeId,
        user: request.user.id,
      }).session(session);

      if (query.acknowledged && query.deletedCount === 1) {
        response.status(204).end();
      } else {
        response.status(500).end();
      }
    } catch (error) {
      next(error);
    } finally {
      session.endSession();
    }
  }
);

module.exports = { recipesRouter };
