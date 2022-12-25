const { AWS_CREDENTIALS, AWS_REGION } = require("../../utils/config");
const { S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const PHOTO_BUCKET_URL =
  "https://cookboard-photobucket.s3.us-east-2.amazonaws.com";
const PHOTO_BUCKET_NAME = "cookboard-photobucket";

/*
 *id: Number
 */
const createPhotoKey = (id, fileName) => {
  return `recipe/${id}/${fileName}_${Date.now()}`;
};

const getPhotoUrl = (photoKey) => {
  return `${PHOTO_BUCKET_URL}/${photoKey}`;
};

const getS3Client = () => {
  return new S3Client({
    credentials: AWS_CREDENTIALS,
    region: AWS_REGION,
  });
};

/*
 *@param keys: [String] ; keys for photos you wish to delete
 *@returns deletePromise: Promise; a promise to delete the specified keys from S3
 */
const deletePhotosFromS3 = async (bucketName, keys) => {
  if (!keys || keys.length === 0) {
    throw new Error("you must provide keys to deleted");
  }
  const s3Client = getS3Client();
  const params = {
    Bucket: bucketName,
    Delete: {
      Objects: keys.map((key) => {
        return { Key: key };
      }),
    },
  };
  return s3Client.send(new DeleteObjectsCommand(params));
};

module.exports = {
  createPhotoKey,
  getPhotoUrl,
  getS3Client,
  deletePhotosFromS3,
  PHOTO_BUCKET_URL,
  PHOTO_BUCKET_NAME,
};
