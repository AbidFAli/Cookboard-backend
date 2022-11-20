const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app.js");
const { Recipe } = require("../../src/models/recipe");
const User = require("../../src/models/user");
const { Comment } = require("../../src/models/comment");
const {
  authHeader,
  getTokenForUser,
  createUser,
  createRandomRecipe,
} = require("./test_utils/testHelper.js");
const { waffles } = require("./fixtures/recipeFixtures");

const api = supertest(app);

let initialUser;
let initialUserToken;
let testRecipe;

beforeAll(async () => {
  await Recipe.deleteMany({});
  await User.deleteMany({});
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

beforeEach(async () => {
  await Comment.deleteMany({});
});

// const createTestComment = async ({ userId, recipeId, date, text }) => {
//   if (!userId) {
//     userId = initialUser.id;
//   }
//   if (!recipeId) {
//     recipeId = testRecipe.id;
//   }
//   if (!date) {
//     date = Date.now();
//   }
//   if (!text) {
//     text = "This is a comment!";
//   }
//   let comment = {
//     text,
//     recipe: recipeId,
//     user: userId,
//     date,
//   };
//   let result = await Comment.create(comment);
//   return result;
// };

describe("tests for recipe comments", () => {
  describe("tests for POST /api/recipes/:recipeId/comments", () => {
    test("add a comment to an existing recipe", async () => {
      let comment = {
        text: "This is a comment!",
        recipe: testRecipe.id,
        user: initialUser.id,
        date: Date.now(),
      };
      let response = await api
        .post(`/api/recipes/${testRecipe.id}/comments`)
        .set(authHeader(initialUserToken))
        .send(comment);

      expect(response.body).toMatchObject(comment);
      let dbComment = await Comment.findById(response.body.id);
      expect(dbComment.text).toEqual(comment.text);
      expect(dbComment.recipe.toString()).toMatch(comment.recipe);
      expect(dbComment.user.toString()).toMatch(comment.user);
      expect(dbComment.date).toEqual(new Date(comment.date));
    });

    // test("add multiple comments to an existing recipe", async () => {});

    // test("fails if you add too long of a comment", async () => {});

    // test("works with a long comment", async () => {});
  });

  test("test for GET /api/recipes/:recipeId/comments/:commentId", async () => {
    let comment = {
      text: "This is a comment!",
      recipe: testRecipe.id,
      user: initialUser.id,
      date: Date.now(),
    };
    let dbComment = await Comment.create(comment);

    let response = await api.get(
      `/api/recipes/${comment.recipe}/comments/${dbComment.id}`
    );

    expect(response.body).toMatchObject(comment);
    expect(dbComment.id).toEqual(response.body.id);
  });

  describe("tests for GET /api/recipes/:recipeId/comments", () => {
    let initialCommentData;
    let createdComments;
    //populate initial comment data
    beforeEach(async () => {
      initialCommentData = [1, 2, 3, 4].map((val, i, arr) => {
        let date = new Date();
        date.setDate(val); //sets day of month
        return {
          text: String(val),
          date: Number(date),
          recipe: testRecipe.id,
          user: initialUser.id,
          likes: val,
        };
      });
      createdComments = await Comment.create(initialCommentData);
    });

    test("get multiple comments", async () => {
      let response = await api.get(`/api/recipes/${testRecipe.id}/comments`);
      initialCommentData = initialCommentData.sort(
        Comment.dateComparator("desc")
      );
      expect(response.body).toMatchObject(initialCommentData);
    });

    test("get comments sorted by likes desc", async () => {
      let response = await api.get(
        `/api/recipes/${testRecipe.id}/comments?sortOn=likes&sortDir=-1`
      );
      initialCommentData = initialCommentData.sort(
        Comment.likesComparator("desc")
      );
      expect(response.body).toMatchObject(initialCommentData);
    });

    test("get comments sorted by date asc", async () => {
      let response = await api.get(
        `/api/recipes/${testRecipe.id}/comments?sortOn=date&sortDir=1`
      );
      initialCommentData = initialCommentData.sort(
        Comment.dateComparator("asc")
      );
      expect(response.body).toMatchObject(initialCommentData);
    });

    test("get comments after a time period", async () => {
      initialCommentData = initialCommentData.sort(
        Comment.dateComparator("asc")
      );
      let afterDate = initialCommentData[1].date; //number

      let response = await api.get(
        `/api/recipes/${testRecipe.id}/comments?after=${afterDate}`
      );
      let expectedComments = initialCommentData.filter(
        (comment) => comment.date > afterDate
      );
      response.body = response.body.sort(Comment.dateComparator("asc"));
      expect(response.body).toHaveLength(2);
      expect(response.body).toMatchObject(expectedComments);
    });

    test.skip("get comments before a time period", async () => {
      let afterDate = initialCommentData[1].date;
      initialCommentData = initialCommentData.sort(
        Comment.dateComparator("desc")
      );
      let response = await api.get(
        `/api/recipes/${testRecipe.id}/comments?before=${String(afterDate)}`
      );
      let expcetedComments = initialCommentData.filter(
        (comment) => comment.date < afterDate
      );
      expect(response.body).toMatchObject(expcetedComments);
    });

    // test("get comments between a time period", async () => {});

    // test("");
  });
});

afterAll(() => {
  mongoose.connection.close();
});
