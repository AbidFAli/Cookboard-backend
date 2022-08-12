const supertest = require("supertest");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const app = require("../../src/app");
const { Recipe } = require("../../src/models/recipe");
const User = require("../../src/models/user");
const { authHeader, getTokenForUser } = require("./test_utils/testHelper.js");
const { UserCreationError } = require("../../src/utils/errors");
const {
  beforeEach,
  test,
  expect,
  describe,
  afterAll,
  beforeAll,
} = require("@jest/globals");
const api = supertest(app);

beforeEach(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
});

describe("tests for POST /api/users", () => {
  let user = {
    username: "Abid",
    password: "password",
    email: "test@test.com",
  };

  test("a new user can be created", async () => {
    let response = await api.post("/api/users").send(user);
    let createdUser = response.body;
    expect(createdUser.id).toBeDefined();
  });

  test("a UsernameTakenError will be returned if a user with the provided username already exists", async () => {
    await api.post("/api/users").send(user);
    await api
      .post("/api/users")
      .send(user)
      .expect((response) => {
        if (
          response.body.name !== UserCreationError.name ||
          response.body.error !== UserCreationError.MESSAGE_NONUNIQUE_USERNAME
        ) {
          throw new Error();
        }
      });
  });
});

describe("tests for GET /api/users/:id", () => {
  let initialUser;
  const initialInfo = {
    username: "Abid",
    passwordHash: "6e1f3a2419b",
    email: "test@test.com",
  };
  beforeEach(async () => {
    initialUser = new User(initialInfo);
    initialUser = await initialUser.save();
  });

  test("an existing user can be retrieved by their id", async () => {
    let response = await api.get(`/api/users/${initialUser.id}`);
    let retrievedUser = response.body;
    expect(retrievedUser.id).toMatch(initialUser.id);
    expect(retrievedUser).toMatchObject({
      username: initialInfo.username,
      email: initialInfo.email,
    });
  });

  test("a user with no recipes will be retrieved with no recipes", async () => {
    let response = await api.get(`/api/users/${initialUser.id}`);
    let retrievedUser = response.body;
    expect(retrievedUser.recipes).toHaveLength(0);
  });

  describe("when there is a user that has made multiple recipes", () => {
    let userWithRecipes;
    let testRecipe = { name: "lamb chops" };
    let userWithRecipesToken;
    const userWithRecipesInfo = {
      username: "User2",
      password: "stuff",
      email: "something@something.com",
    };

    beforeAll(async () => {
      userWithRecipesInfo.passwordHash = await bcrypt.hash(
        userWithRecipesInfo.password,
        1
      );
    });

    beforeEach(async () => {
      userWithRecipes = new User({
        username: userWithRecipesInfo.username,
        email: userWithRecipesInfo.email,
        passwordHash: userWithRecipesInfo.passwordHash,
      });
      userWithRecipes = await userWithRecipes.save();
      userWithRecipesToken = await getTokenForUser(
        api,
        userWithRecipesInfo.username,
        userWithRecipesInfo.password
      );
      let header = authHeader(userWithRecipesToken);
      testRecipe = await api
        .post("/api/recipes")
        .set(header)
        .send({ name: "lamb chops", user: userWithRecipes.id });
      testRecipe = testRecipe.body;
      userWithRecipes = await User.findById(userWithRecipes.id);
    });

    test("a user with recipes will have a list of the names of their recipes", async () => {
      let response = await api.get(`/api/users/${userWithRecipes.id}`);
      // let {body: retrievedUser, } = await api.get(`/api/users/${userWithRecipes.id}`)
      expect(response.body.recipes).toContainEqual({
        id: testRecipe.id,
        name: testRecipe.name,
      });
    });
  });
});

afterAll(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
  mongoose.connection.close();
});
