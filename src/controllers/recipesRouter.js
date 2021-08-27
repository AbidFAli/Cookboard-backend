const recipesRouter = require("express").Router();
const Recipe = require("../models/recipe");

const { SearchError } = require("../utils/errors");
const mongoHelper = require("../utils/mongoHelper");

const RECIPE_SEARCH_INDEX = "name_ingredient_rating";
const RATING_MAX_VALUE = 5;
const RATING_PIVOT = 2.5;
const DEFAULT_RESULT_SIZE = 50;

recipesRouter.get("/", async (request, response, next) => {
  try {
    const session = await mongoHelper.getSession();
    const recipes = await Recipe.find({})
      .readConcern("majority")
      .session(session);
    response.json(recipes);
  } catch (error) {
    next(error);
  }
});

recipesRouter.get("/:id([a-f\\d]{24})", async (request, response, next) => {
  const id = request.params.id;
  const session = await mongoHelper.getSession();
  try {
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
  }
});

const buildRatingFilter = (queryParams) => {
  let ratingFilter = { range: { path: "rating" } };

  let ratingMin = queryParams.ratingMin;
  let ratingMax = queryParams.ratingMax;
  if (ratingMin && Number(ratingMin)) {
    ratingMin = Number(ratingMin);
    if (ratingMin >= 0 && ratingMin <= 5) {
      ratingFilter.range.gte = ratingMin;
    } else {
      throw new SearchError("Ratings must be between 0 and 5");
    }
  } else if (!ratingMin) {
    ratingFilter.range.gte = 0;
  } else {
    throw new SearchError("Ratings must be a number");
  }

  if (ratingMax && Number(ratingMax)) {
    ratingMax = Number(ratingMax);
    if (ratingMax >= 0 && ratingMax <= 5) {
      ratingFilter.range.lte = ratingMax;
    } else {
      throw new SearchError("Ratings must be between 0 and 5");
    }
  } else if (!ratingMax) {
    ratingFilter.range.lte = 5;
  } else {
    throw new SearchError("Ratings must be a number");
  }

  return ratingFilter;
};

const buildSearchFilters = (queryParams) => {
  let filters = [];
  let ratingFilter = buildRatingFilter(queryParams);
  if (ratingFilter) {
    filters.push(ratingFilter);
  }
  return filters;
};

const completeSearchQuery = (searchQuery, queryParams) => {
  searchQuery.addFields({ score: { $meta: "searchScore" } });

  let startingPos = 0;
  if (queryParams.start) {
    startingPos = Number(queryParams.start);
    if (Number.isNaN(startingPos) || startingPos < 0) {
      throw new SearchError("start must be a positive number");
    }
  }
  searchQuery.skip(startingPos);

  let resultSize = DEFAULT_RESULT_SIZE;
  if (queryParams.size) {
    resultSize = Number(queryParams.size);
    if (Number.isNaN(resultSize) || resultSize <= 0) {
      throw new SearchError("size must be a positive number");
    }
  }
  searchQuery.limit(resultSize);

  return searchQuery;
};

const buildSearchOptions = (queryParams) => {
  let searchObject = {
    index: RECIPE_SEARCH_INDEX,
  };

  let mustClauses = [];
  let shouldClauses = [];
  if (queryParams.name) {
    mustClauses.push({ text: { query: queryParams.name, path: "name" } });
  }

  if (queryParams.ingredient) {
    mustClauses.push({
      text: { query: queryParams.ingredient, path: "ingredients.name" },
    });
  }

  // score: {
  //   boost: {
  //     path: "rating",
  //     undefined: 1,
  //   }
  // }
  shouldClauses.push({
    near: {
      path: "rating",
      origin: RATING_MAX_VALUE,
      pivot: RATING_PIVOT,
    },
  });

  searchObject.compound = {
    must: mustClauses,
    should: shouldClauses,
  };
  let filters = buildSearchFilters(queryParams);
  if (filters) {
    searchObject.compound.filter = filters;
  }

  return searchObject;
};

//sort priority: name, rating,
recipesRouter.get("/search", async (request, response, next) => {
  try {
    const session = await mongoHelper.getSession();
    let query = Recipe.aggregate()
      .search(buildSearchOptions(request.query))
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
      let recipes = await completeSearchQuery(query, request.query);
      recipes.forEach((recipe) => {
        recipe.id = recipe._id;
        delete recipe._id;
      });
      response.json(recipes);
    }
  } catch (error) {
    next(error);
  }
});

/*
    Example Request Header: {'Authorization': 'Bearer yourTokenHere'}
*/
recipesRouter.post("/", async (request, response, next) => {
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
    const session = await mongoHelper.getSession();
    const savedRecipe = await recipe.save({ session });
    if (user) {
      user.recipes = user.recipes.concat(savedRecipe._id);
      await user.save({ session });
    }
    response.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
});

/*
 *Returns updated recipe in response body or status code of 401 if recipe is not owned by user
 *or status code of 404 if the recipe with the provided id does not exist.
 */
recipesRouter.put("/:id", async (request, response, next) => {
  try {
    const session = await mongoHelper.getSession();
    const recipe = await Recipe.findById(request.params.id)
      .session(session)
      .readConcern("majority");

    if (!recipe) {
      return response.status(404).end();
    } else if (recipe.user.toString() === request.user.id) {
      let newRecipe = request.body;
      recipe.set(newRecipe);
      let updatedRecipe = await recipe.save();
      response.send(updatedRecipe);
    } else if (recipe.user.toString() !== request.user.id) {
      return response.status(401).end();
    }
  } catch (error) {
    next(error);
  }
});

/*
 *Returns response of:
 * 204: successful deletion
 * 401: no user provided, or recipe is not owned by user making this request
 * 404: no recipe found with the provided id
 */
recipesRouter.delete("/:id", async (request, response, next) => {
  try {
    const session = await mongoHelper.getSession();
    let recipe = await Recipe.findById(request.params.id)
      .session(session)
      .readConcern("majority");

    if (!recipe) {
      return response.status(404).end(); // no recipe found with that id
    } else if (recipe.user.toString() !== request.user.id) {
      return response.status(401).end();
    }

    let query = await Recipe.deleteOne({
      _id: request.params.id,
      user: request.user.id,
    }).session(session);

    if (query.ok && query.n === 1) {
      response.status(204).end();
    } else {
      response.status(500).end();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = recipesRouter;
