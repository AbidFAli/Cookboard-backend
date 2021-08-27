const testingRouter = require("express").Router();
const Recipe = require("../models/recipe");
const User = require("../models/user");
const mongoHelper = require("../utils/mongoHelper");

testingRouter.post("/reset", async (request, response, next) => {
  try {
    const session = await mongoHelper.getSession();
    await Recipe.deleteMany({}).session(session);
    await User.deleteMany({}).session(session);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = testingRouter;
