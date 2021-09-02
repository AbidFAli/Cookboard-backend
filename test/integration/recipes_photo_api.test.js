const app = require("../../src/app");
const supertest = require("supertest");
const api = supertest(app);
const mongoose = require("mongoose");
const Recipe = require("../../src/models/recipe");
const recipeFixtures = require("./fixtures/recipeFixtures");
const User = require("../../src/models/user");

const testHelper = require("./test_utils/testHelper.js");
const mongoHelper = require("../../src/utils/mongoHelper");
const recipesPhotoHelper = require("../../src/utils/controllers/recipesPhotoRouterHelper");
const photoTestHelper = require("./test_utils/photoTestHelper.js");

const {
  ListObjectsCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

let initialUser;
let initialUserToken;
let session;

beforeEach(async () => {
  session = await mongoHelper.getSession();
  await Recipe.deleteMany({}).session(session);
  await User.deleteMany({}).session(session);
  let initialUserInfo = {
    username: "AbidAli",
    password: "password",
    email: "test@test.com",
  };
  ({ initialUser, initialUserToken } = await testHelper.createUser(
    api,
    initialUserInfo
  ));
  let oldPhotos = await photoTestHelper.getTestPhotos();
  await photoTestHelper.deleteTestPhotos(oldPhotos);
});

describe("tests for POST /uploadUrl", () => {
  // test("401 error code if user is not the owner of the recipe", async () => {});
  // test("404 error code if recipe does not exist", async () => {});
  test("if user is owner of recipe, succeeds and returns a url and fields", async () => {
    let recipe = { name: "Tandoori Chiken", user: initialUser.id };
    recipe = await Recipe.create(recipe);

    let response = await api
      .post(`/api/recipes/${recipe.id}/photos/uploadUrl`)
      .set(testHelper.authHeader(initialUserToken))
      .send({ fileName: "chicken.png", fileType: "images/png" });
    expect(response.body.url).toBeTruthy();
    expect(response.body.fields).toBeTruthy();
  });
});

describe("tests for PUT /photos", () => {
  test("adds the key, url, and caption for a photo to the recipe's photos", async () => {
    const recipeInfo = { name: "Tandoori Chiken", user: initialUser.id };
    let recipe = await Recipe.create(recipeInfo);

    let key = `${photoTestHelper.TEST_PREFIX}/somefakekey`;
    let caption = "Really good food";
    const body = {
      photos: [{ key, caption }],
    };
    let response = await api
      .put(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send(body)
      .expect(200);

    let updatedRecipe = await Recipe.findById(recipe.id).setOptions({
      session,
    });
    expect(updatedRecipe.photos).toContainEqual(
      expect.objectContaining({
        key,
        caption,
        url: expect.any(String),
      })
    );
  });

  test("can add information for multiple photos", async () => {
    const recipeInfo = { name: "Tandoori Chiken", user: initialUser.id };
    let recipe = await Recipe.create(recipeInfo);
    const body = {
      photos: [],
    };
    let prefix = photoTestHelper.TEST_PREFIX;
    for (let i = 0; i < 5; i++) {
      body.photos.push({ key: `${prefix}/${i}`, caption: i.toString() });
    }

    await api
      .put(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send(body);

    let updatedRecipe = await Recipe.findById(recipe.id).setOptions({
      session,
    });
    for (let photo of body.photos) {
      expect(updatedRecipe.photos).toContainEqual(
        expect.objectContaining({
          key: photo.key,
          caption: photo.caption,
          url: expect.any(String),
        })
      );
    }
  });

  test("gives a 400 error if the request body is missing a key", async () => {
    let recipe = { name: "Tandoori Chiken", user: initialUser.id };
    recipe = await Recipe.create(recipe);
    let response = await api
      .put(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send({})
      .expect(400);
  });

  test("deletes images from s3 for photos that are replaced", async () => {
    const prefix = photoTestHelper.TEST_PREFIX;
    const recipeInfo = {
      name: "Tandoori Chiken",
      user: initialUser.id,
      photos: [],
    };
    let promises = [];
    for (let i = 0; i < 5; i++) {
      recipeInfo.photos.push({ key: `${prefix}/${i}`, caption: i.toString() });
      promises.push(photoTestHelper.uploadTestPhoto(recipeInfo.photos[i].key));
    }
    promises.unshift(Recipe.create([recipeInfo]));
    let results = await Promise.all(promises);
    let recipe = results[0][0];

    const body = { photos: recipeInfo.photos.slice(0, 2) };
    await api
      .put(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send(body);

    //expect photos 2-4 not to have images in s3
    promises = [];
    for (let i = 2; i < recipeInfo.photos.length; i++) {
      let result = await photoTestHelper.testPhotoExists(
        recipeInfo.photos[i].key
      );
      expect(result).toBeTruthy();
    }
  });
});

describe("tests for DELETE ", () => {
  let recipe;

  beforeEach(async () => {
    let photos = [
      { key: "1", url: "www.aws.com", caption: "cap1" },
      { key: "2", url: "abc.com", caption: "caption2" },
      { key: "3", url: "www.com", caption: "caption3" },
      { key: "4", url: "abcd.com", caption: "caption4" },
    ];
    recipe = { name: "Tandoori Chiken", user: initialUser.id, photos: photos };
    recipe = await Recipe.create([recipe]);
    recipe = recipe[0];
  });

  test("status code 400 if no photos to delete", async () => {
    await api
      .delete(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send({ keys: [] })
      .expect(400);
  });
  test("can delete a single photo", async () => {
    let keys = [recipe.photos[0].key];
    await api
      .delete(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send({ keys });
    let updatedRecipe = await Recipe.findById(recipe.id);
    expect(updatedRecipe.photos).toHaveLength(3);
  });
  test("can delete multiple photos", async () => {
    let keys = recipe.photos.map((p) => p.key);
    await api
      .delete(`/api/recipes/${recipe.id}/photos/`)
      .set(testHelper.authHeader(initialUserToken))
      .send({ keys });
    let updatedRecipe = await Recipe.findById(recipe.id);
    expect(updatedRecipe.photos).toHaveLength(0);
  });
  //can delete a single photo
  //can delete multiple photos
});

afterAll(() => {
  mongoose.connection.close();
});
