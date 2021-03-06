const usersRouter = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const mongoHelper = require("../utils/mongoHelper");
const MIN_PASS_LENGTH = 3;
const PASSWORD_ERROR_MESSAGE = `PasswordError: password was less than ${MIN_PASS_LENGTH} characters`;

const NUM_SALTS = 10;

const recipeInfoToPopulate = { _id: 1, name: 1 };

usersRouter.get("/", async (request, response, next) => {
  try {
    const session = await mongoHelper.getSession();
    const users = await User.find({})
      .readConcern("majority")
      .session(session)
      .populate("recipes", recipeInfoToPopulate);
    response.json(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:id", async (request, response, next) => {
  let user = null;
  const session = await mongoHelper.getSession();
  try {
    user = await User.findById(request.params.id)
      .readConcern("majority")
      .session(session)
      .populate("recipes", recipeInfoToPopulate);
    if (user) {
      response.json(user);
    } else {
      response.status(404);
    }
  } catch (error) {
    next(error);
  }
});

/*
body = {
  username: String,
  email: String,
  password: String
}
*/
usersRouter.post("/", async (request, response, next) => {
  const body = request.body;
  const session = await mongoHelper.getSession();
  try {
    if (body.password && body.password.length < 3) {
      throw new Error(PASSWORD_ERROR_MESSAGE);
    }

    const passwordHash = await bcrypt.hash(body.password, NUM_SALTS);
    const user = new User({
      username: body.username,
      email: body.email,
      passwordHash,
    });
    const savedUser = await user.save({ session });
    response.json(savedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
