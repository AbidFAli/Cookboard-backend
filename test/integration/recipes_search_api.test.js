const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");
const { Recipe } = require("../../src/models/recipe");
const api = supertest(app);
const recipeFixtures = require("./fixtures/recipeFixtures");
//const mongoHelper = require("../../src/utils/mongoHelper");
const { sleep } = require("./test_utils/testHelper");
const {
  beforeAll,
  test,
  expect,
  describe,
  afterAll,
} = require("@jest/globals");

const WAITING_PERIOD = 2000;

describe("GET /api/recipes/search", () => {
  describe("when specifying the position of a starting recipe and a result size", () => {
    let twentyRecipes;
    const searchURL = "/api/recipes/search?ratingMin=1&size=5";

    beforeAll(async () => {
      await Recipe.deleteMany({});

      twentyRecipes = [];
      for (let i = 0; i < 20; i++) {
        twentyRecipes.push({
          name: "testRecipe" + i,
          rating: 1.0 + 0.2 * i,
        });
      }
      await Recipe.insertMany(twentyRecipes);
      twentyRecipes = twentyRecipes.sort((r1, r2) =>
        r1.rating > r2.rating ? -1 : 1
      );
      await sleep(WAITING_PERIOD);
    });

    test("?start=0&size=5 gets the first 5 matching documents", async () => {
      let response = await api.get(searchURL + "&start=0");
      let expected = twentyRecipes.slice(0, 5);
      expect(response.body).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(
          response.body[i].rating === expected.rating &&
            response.body[i].name === expected.name
        );
      }
    });

    test("?start=5&size=5 gets the 6th through 10th matching documents", async () => {
      let response = await api.get(searchURL + "&start=5");
      let expected = twentyRecipes.slice(5, 10);
      expect(response.body).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(
          response.body[i].rating === expected.rating &&
            response.body[i].name === expected.name
        );
      }
    });

    test("?start=15&size=5 gets the 16th through 20th matching documents", async () => {
      let response = await api.get(searchURL + "&start=15");
      let expected = twentyRecipes.slice(15, 20);
      expect(response.body).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(
          response.body[i].rating === expected.rating &&
            response.body[i].name === expected.name
        );
      }
    });

    test("starting past the number of documents returns no documents", async () => {
      let response = await api.get(searchURL + "&start=40");
      expect(response.body).toHaveLength(0);
    });
  });

  describe("when searching by rating", () => {
    beforeAll(async () => {
      await Recipe.deleteMany({});
      const testRecipes = [];
      for (let i = 0; i < 8; i++) {
        testRecipes.push({ rating: 3, name: "a" + i });
      }
      for (let i = 0; i < 7; i++) {
        testRecipes.push({ rating: 4.2, name: "b" + i });
      }
      for (let i = 0; i < 5; i++) {
        testRecipes.push({ rating: 1.4, name: "c" + i });
      }
      await Recipe.insertMany(testRecipes);
      await sleep(WAITING_PERIOD);
    });

    test("retrieves all recipes with less than a rating of 3.4", async () => {
      let response = await api.get("/api/recipes/search?ratingMax=3.4");
      expect(response.body.length).toEqual(13);
      response.body.forEach((recipe) =>
        expect(recipe.rating).toBeLessThanOrEqual(3.4)
      );
    });

    test("retrieves all recipes with a rating greater than 2", async () => {
      let response = await api.get("/api/recipes/search?ratingMin=2");
      expect(response.body.length).toEqual(15);
      response.body.forEach((recipe) =>
        expect(recipe.rating).toBeGreaterThanOrEqual(2)
      );
    });

    test("retrieves all recipes with a rating between 4 and 5", async () => {
      let response = await api.get(
        "/api/recipes/search?ratingMax=5&ratingMin=4"
      );
      expect(response.body.length).toEqual(7);
      expect(
        response.body.every(
          (recipe) => recipe.rating >= 4 && recipe.rating <= 5
        )
      ).toBeTruthy();
    });

    test("responds w/ status code 400 if searching for a negative rating", async () => {
      await api.get("/api/recipes/search?ratingMax=-3.4").expect(400);
    });

    test("responds w/ status code 400 if searching for a rating greater than 5", async () => {
      await api.get("/api/recipes/search?ratingMin=6").expect(400);
    });

    test("retrieved recipes are sorted in descending order of rating", async () => {
      let response = await api.get("/api/recipes/search?ratingMax=3.4");
      let sorted = false;
      sorted = response.body.every((recipe, pos, recipeArray) => {
        if (pos !== 0) {
          return recipe.rating <= recipeArray[pos - 1].rating;
        } else {
          return true;
        }
      });
      response.body.forEach((recipe) =>
        expect(recipe.rating).toBeLessThanOrEqual(3.4)
      );
      expect(sorted).toBeTruthy();
    });
  });

  describe("when searching by name", () => {
    let recipeList;

    beforeAll(async () => {
      await Recipe.deleteMany({});
      recipeList = recipeFixtures.similarNames();
      await Recipe.insertMany(recipeList);
      await sleep(WAITING_PERIOD);
    });
    //this one makes that range error
    test("returns one recipe if it is the sole match", async () => {
      let response = await api.get("/api/recipes/search?name=waffles");
      let recipes = response.body;
      expect(recipes).toHaveLength(1);
      expect(recipes[0]).toMatchObject(recipeList[0]);
    });

    test("can return multiple matching recipes", async () => {
      let response = await api.get("/api/recipes/search?name=pancakes]");
      let recipes = response.body;
      let expectedRecipes = [recipeList[2], recipeList[3]];
      for (let expectedRecipe of expectedRecipes) {
        let recieved = recipes.find(
          (recipe) => recipe.name === expectedRecipe.name
        );
        expect(recieved).toMatchObject(expectedRecipe);
      }
    });

    test("matching recipes are sorted by textScore", async () => {
      let response = await api.get("/api/recipes/search?name=pancakes]");
      let recipes = response.body;
      let isSorted = true;
      for (let i = 0; i < recipes.length - 1; i++) {
        isSorted = isSorted && recipes[i].score >= recipes[i + 1].score;
      }
      expect(isSorted).toBeTruthy();
    });

    test("returns an empty array if no recipes matched", async () => {
      let response = await api.get("/api/recipes/search?name=nothing]");
      expect(response.body).toHaveLength(0);
    });

    test("can get a count of the results", async () => {
      let response = await api.get(
        "/api/recipes/search?name=pancakes&count=true"
      );
      let body = response.body;
      expect(body.count).toEqual(2);
    });
  });

  describe("when searching by name and rating", () => {
    let recipeList;
    beforeAll(async () => {
      await Recipe.deleteMany({});
      recipeList = recipeFixtures.namesAndRatings();
      await Recipe.insertMany(recipeList);
      await sleep(WAITING_PERIOD);
    });

    test("returns all recipes within a range of ratings that have names matching the name query paramter", async () => {
      let response = await api.get(
        "/api/recipes/search?ratingMin=4&name=waffles"
      );
      expect(response.body).toHaveLength(2);
      let isSorted = true;
      for (let i = 0; i < recipeList.length - 1; i++) {
        isSorted =
          isSorted &&
          recipeList[i].score >= recipeList[i + 1].score &&
          recipeList[i].rating >= recipeList[i + 1].rating;
      }
      expect(isSorted);
    });
  });
});

afterAll(() => {
  mongoose.connection.close();
});
