const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const { Recipe } = require("../../src/models/recipe");
const User = require("../../src/models/user");
const { Rating } = require("../../src/models/rating");
const {
  authHeader,
  getTokenForUser,
  createUser,
} = require("./test_utils/testHelper.js");
const api = supertest(app);
const recipeFixtures = require("./fixtures/recipeFixtures");
const mongoHelper = require("../../src/utils/mongoHelper");
const { waffles } = require("./fixtures/recipeFixtures");

let initialUser;
let initialUserToken;
let testRecipe;

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  await Rating.deleteMany({});

  let initialUserInfo = {
    username: "AbidAli",
    password: "password",
    email: "test@test.com",
  };
  ({ initialUser, initialUserToken } = await createUser(api, initialUserInfo));
  const params = waffles();
  params.rating = 0;
  testRecipe = new Recipe({ ...params });
  testRecipe.user = initialUser.id;
  testRecipe = await testRecipe.save();
});

const createRating = async (value) => {
  return await Rating.create({
    value,
    userId: initialUser.id,
    recipe: testRecipe.id,
  });
};

describe("tests for GET /api/recipes/ratings", () => {
  const ratingComparator = (one, two) => {
    return one.value - two.value;
  };

  test("an existing rating can be retrieved by its userId and recipeId", async () => {
    let ratingParams = {
      value: 3.5,
      userId: initialUser.id,
      recipe: testRecipe.id,
    };
    let initialRating = await Rating.create(ratingParams);

    const response = await api
      .get(
        `/api/recipes/ratings?userId=${initialUser.id}&recipe=${testRecipe.id}`
      )
      .set(authHeader(initialUserToken));
    let retrievedRatings = response.body;
    expect(retrievedRatings).toHaveLength(1);
    expect(retrievedRatings[0]).toMatchObject({
      ...ratingParams,
      id: initialRating.id,
    });
  });

  test("all of a users ratings can be found", async () => {
    let fiveRatings = new Array(5).fill(0).map((_, i) => ({
      userId: initialUser.id,
      recipe: testRecipe.id,
      value: i,
    }));
    await Rating.create(fiveRatings);
    const response = await api.get(
      `/api/recipes/ratings?userId=${initialUser.id}`
    );
    let retreivedRatings = response.body;
    const ratingComparator = (one, two) => {
      return one.value - two.value;
    };
    retreivedRatings.sort(ratingComparator);
    expect(retreivedRatings).toMatchObject(fiveRatings);
  });

  test("all of a recipe's ratings can be found", async () => {
    let fiveRatings = new Array(5).fill(0).map((_, i) => ({
      userId: initialUser.id,
      recipe: testRecipe.id,
      value: i,
    }));
    await Rating.create(fiveRatings);
    const response = await api.get(
      `/api/recipes/ratings?recipe=${testRecipe.id}`
    );
    let retreivedRatings = response.body;

    retreivedRatings.sort(ratingComparator);
    expect(retreivedRatings).toMatchObject(fiveRatings);
  });

  test("a rating contains the name of the recipe which it was left for", async () => {
    await createRating(3.5);
    let response = await api
      .get(
        `/api/recipes/ratings?userId=${initialUser.id}&recipe=${testRecipe.id}`
      )
      .set(authHeader(initialUserToken));
    let rating = response.body[0];
    expect(rating.recipe.name).toEqual(testRecipe.name);
  });
});

describe("tests for POST /api/recipes/ratings", () => {
  test("a rating can be created", async () => {
    let rating = {
      value: 4,
      userId: initialUser.id,
      recipe: testRecipe.id,
    };
    await api
      .post("/api/recipes/ratings")
      .set(authHeader(initialUserToken))
      .send(rating)
      .expect(201);
  });

  test("a rating cannot be created without providing a recipe", async () => {
    let rating = {
      value: 4,
    };
    await api
      .post("/api/recipes/ratings")
      .set(authHeader(initialUserToken))
      .send(rating)
      .expect(400);
  });

  describe("creating a rating updates the avgRating for the recipe", () => {
    test("with one rating, which is a float", async () => {
      let rating = {
        value: 3.5,
        userId: initialUser.id,
        recipe: testRecipe.id,
      };
      await api
        .post("/api/recipes/ratings")
        .set(authHeader(initialUserToken))
        .send(rating);
      let updatedRecipe = await Recipe.findOne({
        _id: testRecipe.id,
      });
      expect(updatedRecipe.rating).toBeCloseTo(3.5);
    });

    test("with one rating, which is an int", async () => {
      let rating = {
        value: 4,
        userId: initialUser.id,
        recipe: testRecipe.id,
      };
      await api
        .post("/api/recipes/ratings")
        .set(authHeader(initialUserToken))
        .send(rating);
      let updatedRecipe = await Recipe.findOne({
        _id: testRecipe.id,
      });
      expect(updatedRecipe.rating).toBeCloseTo(4);
    });

    test("with multiple ratings, should be the average", async () => {
      let ratings = [1, 2].map((value) => ({
        userId: initialUser.id,
        recipe: testRecipe.id,
        value: value,
      }));

      let createRatingsPromises = ratings.map((r) => {
        return api
          .post("/api/recipes/ratings")
          .set(authHeader(initialUserToken))
          .send(r);
      });

      await Promise.all(createRatingsPromises);

      let updatedRating = await Recipe.findOne({
        _id: testRecipe.id,
      });
      expect(updatedRating.rating).toBeCloseTo(1.5);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
