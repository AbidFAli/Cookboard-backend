const {
  deletePhotosFromS3,
  getS3Client,
  PHOTO_BUCKET_NAME,
} = require("./recipesPhotoRouterHelper");

const {
  getTestPhotos,
  deleteTestPhotos,
  uploadTestPhoto,
  testPhotoExists,
  TEST_PREFIX,
} = require("../../../test/integration/test_utils/photoTestHelper");

//in the future, create a test bucket for this.
const generateKey = () => {
  return `${TEST_PREFIX}/${Date.now()}`;
};

//these tests will break if the delete fails, since theres nothing to delete
beforeEach(async () => {
  let oldPhotos = await getTestPhotos();
  await deleteTestPhotos(oldPhotos);
});

describe("tests for delete photos from S3", () => {
  test("can delete one photo", async () => {
    let key = generateKey();
    await uploadTestPhoto(key);
    let sanity = await testPhotoExists(key);
    expect(sanity).toBeTruthy();

    await deletePhotosFromS3(PHOTO_BUCKET_NAME, [key]);

    let result = await testPhotoExists(key);
    expect(result).toBeFalsy();
  });
  test("can delete multiple photos", async () => {
    let keys = [];
    let num_photos = 5;
    for (let i = 0; i < num_photos; i++) {
      keys.push(generateKey());
      await uploadTestPhoto(keys[i]);
    }

    let response = await deletePhotosFromS3(PHOTO_BUCKET_NAME, keys);
    expect(response.Deleted).toHaveLength(5);
  });
});
