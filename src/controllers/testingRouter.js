const testingRouter = require("express").Router();
const { Recipe } = require("../models/recipe");
const User = require("../models/user");
const mongoose = require("mongoose");

testingRouter.post("/reset", async (request, response, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    await Recipe.deleteMany({}).session(session);
    await User.deleteMany({}).session(session);
    response.status(204).end();
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
});

module.exports = testingRouter;
