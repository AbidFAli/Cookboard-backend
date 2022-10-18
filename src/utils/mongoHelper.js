const config = require("./config");
const mongoose = require("mongoose");

const MONGODB_URI = config.MONGODB_URI;
let session = null;

async function connectToMongo() {
  let connection;
  try {
    connection = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.log("error connecting to MongoDB", error.message);
  }
  return connection;
}

module.exports = {
  connectToMongo,
};
