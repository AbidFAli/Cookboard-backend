const { SearchError } = require("../../utils/errors");

const RECIPE_SEARCH_INDEX = "name_ingredient_rating";
const RATING_MAX_VALUE = 5;
const RATING_PIVOT = 2.5;
const DEFAULT_RESULT_SIZE = 50;

const buildRatingFilter = (queryParams) => {
  let ratingFilter = { range: { path: "avgRating" } };

  let ratingMin = queryParams.ratingMin;
  let ratingMax = queryParams.ratingMax;
  if (Number(ratingMin) || Number(ratingMin) === 0) {
    ratingMin = Number(ratingMin);
    if (ratingMin >= 0 && ratingMin <= 5) {
      ratingFilter.range.gte = ratingMin;
    } else {
      throw new SearchError("Ratings must be between 0 and 5");
    }
  } else if (ratingMin === undefined) {
    ratingFilter.range.gte = 0;
  } else {
    throw new SearchError("Ratings must be a number");
  }

  if (Number(ratingMax)) {
    ratingMax = Number(ratingMax);
    if (ratingMax >= 0 && ratingMax <= 5) {
      ratingFilter.range.lte = ratingMax;
    } else {
      throw new SearchError("Ratings must be between 0 and 5");
    }
  } else if (
    ratingMax === undefined ||
    (typeof ratingMax === "string" && ratingMax.trim() === "")
  ) {
    ratingFilter.range.lte = RATING_MAX_VALUE;
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

module.exports = {
  buildRatingFilter,
  buildSearchFilters,
  completeSearchQuery,
  buildSearchOptions,
  RATING_MAX_VALUE,
};
