const {
  beforeAll,
  test,
  expect,
  describe,
  afterAll,
} = require("@jest/globals");
const { Recipe, RecipeError } = require("./recipe");
const User = require("./user");
const { connectToMongo } = require("../utils/mongoHelper");
const { isEmpty } = require("lodash");
const { mongoose } = require("mongoose");

let connection;

beforeAll(async () => {
  connection = await connectToMongo();
});

let user, recipe, session;

const RATING_PRECISCION = 2;

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  user = await User.create({ username: "Abid", passwordHash: "abcd" });
  recipe = await Recipe.create({ name: "Cookies", user: user.id });
  session = await mongoose.startSession();
});

afterEach(async () => {
  await session.endSession();
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
});

describe("tests for removeRating", () => {
  test("remove, leaving only one", async () => {
    //(4+2)/2 = 3
    let testRecipe = await Recipe.findByIdAndUpdate(recipe.id, {
      $set: { avgRating: 3, numRatings: 2 },
    });
    testRecipe = await Recipe.removeRating(testRecipe.id, 2, session);
    expect(testRecipe.avgRating).toEqual(4);
  });

  test("remove the only rating", async () => {
    let testRecipe = await Recipe.findByIdAndUpdate(recipe.id, {
      $set: { avgRating: 4, numRatings: 1 },
    });
    testRecipe = await Recipe.removeRating(testRecipe.id, 4, session);
    expect(testRecipe.avgRating).toEqual(0);
  });

  test("remove, standard case", async () => {
    /*
      (size * average - value) / (size -1)
      4 * 3 - 2
      size = 4
      avg = 3
      val = 2
      result = 3.33
    */
    let testRecipe = await Recipe.findByIdAndUpdate(recipe.id, {
      $set: { avgRating: 3, numRatings: 4 },
    });
    testRecipe = await Recipe.removeRating(testRecipe.id, 2, session);
    expect(testRecipe.avgRating).toBeCloseTo(3.33, 2);
  });

  test("remove a rating when no ratings", async () => {
    let testRecipe = await Recipe.removeRating(recipe.id, 2, session);
    expect(testRecipe.avgRating).toEqual(0);
  });
});

describe.only("tests for replaceRating", () => {
  test("replace a rating with a zero", async () => {
    let testRecipe = await Recipe.findByIdAndUpdate(recipe.id, {
      $set: { avgRating: 3, numRatings: 2 }, //3, 3
    });

    testRecipe = await Recipe.replaceRating(recipe.id, 3, 0, session);
    expect(testRecipe.avgRating).toBeCloseTo(1.5, RATING_PRECISCION);
  });

  test("replace a rating standard case", async () => {
    let testRecipe = await Recipe.findByIdAndUpdate(recipe.id, {
      $set: { avgRating: 3, numRatings: 2 }, //3, 3
    });

    testRecipe = await Recipe.replaceRating(recipe.id, 3, 2, session);
    expect(testRecipe.avgRating).toBeCloseTo(2.5, RATING_PRECISCION);
  });
});

afterAll(async () => {
  connection.disconnect();
});
