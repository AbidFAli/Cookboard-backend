const {
  buildRatingFilter,
  RATING_MAX_VALUE,
} = require("./recipesRouterHelper");

describe("tests for buildRatingFilter", () => {
  test("if queryParams.ratingMin is blank then filter.range.gte is 0 ", () => {
    let queryParams = { ratingMin: "" };
    let filter = buildRatingFilter(queryParams);
    expect(filter.range.gte).toEqual(0);
  });
  test("if queryParams.ratingMin is undefined then filter.range.gte is 0", () => {
    let queryParams = { ratingMin: undefined };
    let filter = buildRatingFilter(queryParams);
    expect(filter.range.gte).toEqual(0);
  });
  test(`if queryParams.ratingMax is blank then filter.range.lte is ${RATING_MAX_VALUE} `, () => {
    let queryParams = { ratingMax: "" };
    let filter = buildRatingFilter(queryParams);
    expect(filter.range.lte).toEqual(RATING_MAX_VALUE);
  });
  test(`if queryParams.ratingMax is undefined then filter.range.lte is ${RATING_MAX_VALUE} `, () => {
    let queryParams = { ratingMax: undefined };
    let filter = buildRatingFilter(queryParams);
    expect(filter.range.lte).toEqual(RATING_MAX_VALUE);
  });
});
