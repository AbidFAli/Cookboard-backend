const config = require("./config");
const mongoose = require("mongoose");

const MONGODB_URI = config.MONGODB_URI;
let session = null;

async function connectToMongo() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  } catch (error) {
    console.log("error connecting to MongoDB", error.message);
  }
}

async function getSession() {
  if (session === null) {
    session = await mongoose.connection.startSession();
  }
  return session;
}

module.exports = {
  connectToMongo,
  getSession,
};
