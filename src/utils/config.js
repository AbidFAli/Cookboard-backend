require("dotenv").config();
const { fromEnv } = require("@aws-sdk/credential-providers");

const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;
const PORT = process.env.PORT;
const AWS_REGION = "us-east-2";

const AWS_CREDENTIALS = fromEnv();

module.exports = {
  MONGODB_URI,
  PORT,
  AWS_CREDENTIALS,
  AWS_REGION,
};
