const {
  getS3Client,
  PHOTO_BUCKET_NAME,
} = require("../../../src/utils/controllers/recipesPhotoRouterHelper");

const {
  HeadObjectCommand,
  PutObjectCommand,
  ListObjectsCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const s3Client = getS3Client();
const TEST_PREFIX = "test/recipes";

const getTestPhotos = async () => {
  const params = {
    Bucket: PHOTO_BUCKET_NAME,
    Prefix: TEST_PREFIX,
  };
  const response = await s3Client.send(new ListObjectsCommand(params));
  let photos = [];
  if (response.Contents) {
    photos = response.Contents.map((photo) => {
      return { Key: photo.Key };
    });
  }
  return photos;
};

const deleteTestPhotos = async (keys) => {
  if (!keys || keys.length === 0) {
    return;
  }

  const params = {
    Bucket: PHOTO_BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => {
        return { Key: key };
      }),
    },
  };
  await s3Client.send(new DeleteObjectsCommand(params));
};

const uploadTestPhoto = async (key) => {
  const bucketParams = {
    Bucket: PHOTO_BUCKET_NAME,
    Key: key,
    Body: "Something",
  };
  return s3Client.send(new PutObjectCommand(bucketParams));
};

const testPhotoExists = async (key) => {
  const bucketParams = {
    Bucket: PHOTO_BUCKET_NAME,
    Key: key,
  };
  try {
    await s3Client.send(new HeadObjectCommand(bucketParams));
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  testPhotoExists,
  uploadTestPhoto,
  deleteTestPhotos,
  getTestPhotos,
  TEST_PREFIX,
};
