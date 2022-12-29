const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const { Recipe } = require("../../models/recipe");
const User = require("../../models/user");
const { Rating } = require("../../models/rating");
const {
  authHeader,
  getTokenForUser,
  createUser,
  supressErrorInTest,
  unsupressErrorInTest,
  createRandomRecipe,
} = require("./test_utils/testHelper.js");

const api = supertest(app);
const recipeFixtures = require("./fixtures/recipeFixtures");
const mongoHelper = require("../../utils/mongoHelper");
const { waffles } = require("./fixtures/recipeFixtures");
const { ObjectId } = require("mongodb");

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
  ({ user: initialUser, token: initialUserToken } = await createUser(
    api,
    initialUserInfo
  ));
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
    recipeId: testRecipe.id,
  });
};

const ratingComparator = (one, two) => {
  return one.value - two.value;
};

describe("tests for GET /api/recipes/ratings", () => {
  test("if the user has no ratings, return an array", async () => {
    const response = await api
      .get(
        `/api/recipes/ratings?userId=${initialUser.id}&recipe=${testRecipe.id}`
      )
      .set(authHeader(initialUserToken));
    expect(response.body).toEqual([]);
  });

  test("an existing rating can be retrieved by its userId and recipeId", async () => {
    let ratingParams = {
      value: 3.5,
      userId: initialUser.id,
      recipeId: testRecipe.id,
    };
    let initialRating = await Rating.create(ratingParams);

    const response = await api
      .get(
        `/api/recipes/ratings?userId=${initialUser.id}&recipe=${testRecipe.id}`
      )
      .set(authHeader(initialUserToken));
    let retrievedRatings = response.body;
    expect(retrievedRatings).toHaveLength(1);

    //alternatively, match every field and then have a custom matcher for recipe, which would allow the structure of the recipe to change.
    expect(retrievedRatings[0]).toMatchObject({
      value: ratingParams.value,
      userId: ratingParams.userId,
      recipeId: ratingParams.recipeId,
      id: initialRating.id,
    });
  });

  test("all of a users ratings can be found", async () => {
    let createPromises = new Array(5).fill(0).map((_, i) => {
      return createRandomRecipe();
    });

    let recipes = await Promise.all(createPromises);

    let fiveRatings = new Array(5).fill(0).map((_, i) => ({
      userId: initialUser.id,
      recipeId: recipes[i].id,
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
    let createUsersPromises = [];
    for (let i = 1; i <= 5; i++) {
      let userPromise = createUser(api);
      createUsersPromises.push(userPromise);
    }

    let userInfo = await Promise.all(createUsersPromises);

    let fiveRatings = new Array(5).fill(0).map((_, i) => ({
      userId: userInfo[i].user.id,
      recipeId: testRecipe.id,
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
});

describe("tests for POST /api/recipes/ratings", () => {
  test("a rating can be created", async () => {
    let rating = {
      value: 4,
      userId: initialUser.id,
      recipe: testRecipe.id,
    };
    let response = await api
      .post("/api/recipes/ratings")
      .set(authHeader(initialUserToken))
      .send(rating);

    expect(response.status).toEqual(201);
    expect(response.body.avgRating).toEqual(rating.value);
    expect(response.body.numRatings).toEqual(1);
    expect(response.body.rating).toMatchObject({
      value: rating.value,
      userId: rating.userId,
      id: expect.anything(),
      recipeId: testRecipe.id,
    });
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

  test("user cant create two ratings for the same recipe", async () => {
    supressErrorInTest();
    let ratings = [1, 2].map((value) => {
      return {
        value,
        userId: initialUser.id,
        recipe: testRecipe.id,
      };
    });

    //returns a promise
    let makeRequest = (rating) => {
      return api
        .post("/api/recipes/ratings")
        .set(authHeader(initialUserToken))
        .send(rating);
    };

    await makeRequest(ratings[0]).expect(201);
    await makeRequest(ratings[1]).expect(400);
    unsupressErrorInTest();
  });

  describe("creating a rating updates the avgRating for the recipe", () => {
    test("with one rating, which is a float", async () => {
      let rating = {
        value: 3.5,
        userId: initialUser.id,
        recipe: testRecipe.id,
      };
      let response = await api
        .post("/api/recipes/ratings")
        .set(authHeader(initialUserToken))
        .send(rating);

      //test response body
      expect(response.body.avgRating).toBeCloseTo(3.5);
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
      let response = await api
        .post("/api/recipes/ratings")
        .set(authHeader(initialUserToken))
        .send(rating);
      expect(response.body.avgRating).toBeCloseTo(4);
      let updatedRecipe = await Recipe.findOne({
        _id: testRecipe.id,
      });
      expect(updatedRecipe.rating).toBeCloseTo(4);
    });

    test("with multiple ratings, should be the average", async () => {
      //({ initialUser, initialUserToken } = await createUser(api, initialUserInfo));

      let user2 = {
        username: "user2",
        password: "password",
        email: "something@something.com",
      };
      let user2Token = null;
      ({ user: user2, token: user2Token } = await createUser(api, user2));
      let users = [
        { user: initialUser, token: initialUserToken },
        { user: user2, token: user2Token },
      ];

      let ratings = [1, 2].map((value, i) => ({
        userId: users[i].user.id,
        recipe: testRecipe.id,
        value: value,
      }));

      let createRatingsPromises = ratings.map((r, i) => {
        return api
          .post("/api/recipes/ratings")
          .set(authHeader(users[i].token))
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

describe("tests for PUT /api/recipes/ratings/", () => {
  test("update a rating", async () => {
    //average should change, numRatings should not change
    let recipe = await Recipe.create({
      name: "something",
      user: initialUser.id,
    });
    let rating = await api
      .post("/api/recipes/ratings")
      .set(authHeader(initialUserToken))
      .send({
        recipe: recipe.id,
        value: 4,
      });

    let response = await api
      .put("/api/recipes/ratings")
      .set(authHeader(initialUserToken))
      .send({
        recipe: recipe.id,
        value: 3,
      });

    expect(response.body.avgRating).toEqual(3);
    expect(response.body.numRatings).toEqual(1);
    recipe = await Recipe.findById(recipe.id);
    expect(recipe.avgRating).toEqual(3);
    expect(recipe.numRatings).toEqual(1);
  });
});

describe("tests for DELETE /api/recipes/ratings", () => {
  test("delete a rating", async () => {
    let recipe = await Recipe.create({
      name: "something",
      user: initialUser.id,
      avgRating: 4,
      numRatings: 1,
    });

    let rating = await Rating.create({
      value: 4,
      userId: initialUser.id,
      recipe: recipe.id,
    });

    await api
      .delete(`/api/recipes/ratings/${recipe.id}`)
      .set(authHeader(initialUserToken));

    let response = await Rating.findOne({
      recipeId: rating.recipeId,
      userId: rating.userId,
    });
    expect(response).toBeNull();
  });
});

afterAll(() => {
  mongoose.connection.close();
});
