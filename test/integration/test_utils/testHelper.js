const { JsonWebTokenError } = require("jsonwebtoken");
const { Recipe } = require("../../../src/models/recipe");

const authHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

const getTokenForUser = async (api, username, password) => {
  let response = await api.post("/api/login").send({ username, password });
  return response.body.token;
};

const sleep = async (ms) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

let uidCounter = 1;
/*
*@desc creates a user. If no user is provided, will create a random one.
*@increments uidCounter if userInfo is not provided
*@returns {
  intialUser,
  initialUserToken
}
*/
const createUser = async (api, userInfo) => {
  if (userInfo === null || userInfo === undefined) {
    userInfo = {
      username: "fakeuser" + uidCounter,
      password: "password" + uidCounter,
      email: `email${uidCounter}@email.com`,
    };
    uidCounter += 1;
  }

  let response = await api.post("/api/users").send(userInfo);
  let initialUser = response.body;
  response = await api.post("/api/login").send(userInfo);
  let initialUserToken = response.body.token;

  return {
    user: initialUser,
    token: initialUserToken,
  };
};

let recipeCounter = 1;

const createRandomRecipe = async () => {
  let info = { name: "random" + recipeCounter };
  let response = await Recipe.create([info]);
  return response[0];
};

class TestCommentFactory {
  constructor({ user, recipe, parent }) {
    this.user = user;
    this.recipe = recipe;
    this.parent = parent;
    this.numCreated = 0;
  }

  /*@param config {
      parent: Comment || null, 
  }
  @increments numCreated
  */
  makeComment(config) {
    this.numCreated += 1;
    let parent;
    if (config.parent && config.parent.id) {
      parent = config.parent.id;
    } else if (config.parent === null) {
      parent = undefined;
    } else {
      parent = this.parent.id;
    }
    return {
      likes: 0,
      text: "I am " + this.numCreated,
      parent,
      recipe: this.recipe.id,
      user: this.user.id,
      date: Date.now(),
    };
  }
}

/*
 *@callback supressionRule:
 *@param error: the error that will be passed to the callback
 *@returns: true or false depending on whether to supress the error or not
 */
const supressErrorInTest = () => {
  jest.spyOn(console, "error").mockImplementation(jest.fn());
};

const unsupressErrorInTest = () => {
  jest.spyOn(console, "error").mockRestore();
};

const idComparator = (c1, c2) => String(c1.id).localeCompare(String(c2.id));

module.exports = {
  authHeader,
  getTokenForUser,
  sleep,
  createUser,
  supressErrorInTest,
  unsupressErrorInTest,
  createRandomRecipe,
  TestCommentFactory,
  idComparator,
};
