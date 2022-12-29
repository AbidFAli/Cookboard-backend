const mongoose = require("mongoose");
const mongoHelper = require("../src/utils/mongoHelper");
const { Recipe } = require("../src/models/recipe");

process.env.NODE_ENV = "development";

const syncIndex = async () => {
  try {
    await Recipe.syncIndexes();
    console.log("Indexes synced");
  } catch (error) {
    console.log(error);
  }
  return;
};

const run = async () => {
  console.log("Node env is " + process.env.NODE_ENV);
  try {
    await mongoHelper.connectToMongo();
  } catch (error) {
    console.log(error);
    process.exit(-1);
  }

  if (process.argv[2] === "sync") {
    await syncIndex();
  }
  await mongoose.disconnect();
  process.exit(0);
};

run();
