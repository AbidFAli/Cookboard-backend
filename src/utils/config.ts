import { fromEnv } from "@aws-sdk/credential-providers";
import * as dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;
const PORT = process.env.PORT;
const AWS_REGION = "us-east-2";

const AWS_CREDENTIALS = fromEnv();

export = {
  MONGODB_URI,
  PORT,
  AWS_CREDENTIALS,
  AWS_REGION,
};
