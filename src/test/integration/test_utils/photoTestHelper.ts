import {
  getS3Client,
  PHOTO_BUCKET_NAME,
} from "controllers/util/recipesPhotoRouterHelper";

import type {ListObjectsCommandOutput} from "@aws-sdk/client-s3";
import {
  HeadObjectCommand,
  PutObjectCommand,
  ListObjectsCommand,
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  ObjectIdentifier
} from "@aws-sdk/client-s3";

const s3Client = getS3Client();
const TEST_PREFIX = "test/recipes";

const getTestPhotos = async () => {
  const params = {
    Bucket: PHOTO_BUCKET_NAME,
    Prefix: TEST_PREFIX,
  };
  const response = await s3Client.send(new ListObjectsCommand(params));
  let photos: Array<Object> = [];
  if (response.Contents) {
    photos = response.Contents.map((photo) => {
      return { Key: photo.Key };
    });
  }
  return photos;
};

const deleteTestPhotos = async (keys: Array<Object> | undefined| null) => {
  if (!keys || keys.length === 0) {
    return;
  }

  const params: DeleteObjectsCommandInput = {
    Bucket: PHOTO_BUCKET_NAME,
    Delete: {
      Objects: keys.map((key) => {
        return { Key: key };
      }) as Array<ObjectIdentifier>,
    },
  };
  await s3Client.send(new DeleteObjectsCommand(params));
};

const uploadTestPhoto = async (key: string) => {
  const bucketParams = {
    Bucket: PHOTO_BUCKET_NAME,
    Key: key,
    Body: "Something",
  };
  return s3Client.send(new PutObjectCommand(bucketParams));
};

const testPhotoExists = async (key: string) => {
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

export = {
  testPhotoExists,
  uploadTestPhoto,
  deleteTestPhotos,
  getTestPhotos,
  TEST_PREFIX,
};
