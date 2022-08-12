const {
  beforeAll,
  test,
  expect,
  describe,
  afterAll,
} = require("@jest/globals");
const { Recipe } = require("./recipe");
const User = require("./user");
const { connectToMongo } = require("../utils/mongoHelper");
const { isEmpty } = require("lodash");

let connection;
beforeAll(async () => {
  connection = await connectToMongo();
});

let user, recipe;

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  user = await User.create({ username: "Abid", passwordHash: "abcd" });
  recipe = await Recipe.create({ name: "Cookies", user: user.id });
});

describe("tests for addRating", () => {
  test("add a rating to a recipe with no ratings", async () => {
    let updatedRecipe = await Recipe.addRating(recipe.id, 4);
    expect(updatedRecipe.avgRating).toEqual(4);
    expect(updatedRecipe.numRatings).toEqual(1);
  });

  test("add a rating to a recipe with ratings", async () => {
    recipe = await Recipe.create({
      name: "Better-Cookies",
      user: user.id,
      avgRating: 4,
      numRatings: 2,
    });
    let updatedRecipe = await Recipe.addRating(recipe.id, 0);
    //newAvg = avgRating + (newRating - avgRating) / ( numRatings + 1)
    expect(updatedRecipe.avgRating).toBeCloseTo(4 + (0 - 4) / 3);
    expect(updatedRecipe.numRatings).toEqual(3);
  });

  test("returns an empty document if {noDoc = true}", async () => {
    let updatedRecipe = await Recipe.addRating(recipe.id, 1, {
      noDoc: true,
    });
    expect(isEmpty(updatedRecipe)).toBeTruthy();
  });
});

afterAll(() => {
  connection.disconnect();
});
