const recipesPhotoRouter = require("express").Router({ mergeParams: true });
const { Recipe } = require("../models/recipe");

const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");

const photoHelper = require("./util/recipesPhotoRouterHelper");
const mongoose = require("mongoose");

const PRESIGNED_POST_EXPIRATION_TIME = 600; //seconds
const PHOTO_SIZE_LIMIT = 10 * 1024 * 1024; //bytes

/*
*requestParameters : {
  id: id of the recipe to save the photo for
}
*request body: {
  fileName: string
  fileType: string
}
*@returns response = {
* url: String; the url to save to 
* fields: key,value pairs to be POSTed along with the photo  
}
*/
recipesPhotoRouter.post("/uploadUrl", async (request, response, next) => {
  const id = request.params.recipeId;
  const fileName = request.body.fileName;
  let mongoSession;

  try {
    mongoSession = await mongoose.startSession();
    const recipe = await Recipe.findById(id)
      .readConcern("majority")
      .session(mongoSession);
    if (!recipe) {
      return response.status(404).end();
    } else if (recipe.user.toString() !== request.user.id) {
      return response.status(401).end();
    }

    const s3Client = photoHelper.getS3Client();
    const Key = photoHelper.createPhotoKey(id, fileName);
    const Conditions = [
      ["content-length-range", 0, PHOTO_SIZE_LIMIT],
      ["starts-with", "$Content-Type", "image/"],
    ];
    const Fields = {
      acl: "bucket-owner-full-control",
    };

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: photoHelper.PHOTO_BUCKET_NAME,
      Key,
      Conditions,
      Fields,
      Expires: PRESIGNED_POST_EXPIRATION_TIME,
    });

    return response.json({ url, fields });
  } catch (error) {
    next(error);
  } finally {
    mongoSession.endSession();
  }
});

/*
*Sets the key, caption, and url for the photos in recipe.photos. Generates the appropriate URL
*for the each photo based on its key. Deletes any old photos.
*requestParameters : {
  id: id of the recipe to save the photo for
}
*request body: {
  photos: [{
    key: string; key for saved photo
    caption: string; caption for saved photo
  }]
} 
*@returns response
*/
recipesPhotoRouter.put("/", async (request, response, next) => {
  const recipeId = request.params.recipeId;
  let mongoSession;
  if (!request.body.photos) {
    return response.status(400).end();
  }

  try {
    mongoSession = await mongoose.startSession();
    const newPhotos = request.body.photos.map((photo) => {
      return {
        key: photo.key,
        caption: photo.caption,
        url: photoHelper.getPhotoUrl(photo.key),
      };
    });

    const oldRecipe = await Recipe.findOne({
      _id: recipeId,
      user: request.user.id,
    }).setOptions({ session: mongoSession });

    //no recipe exists or user does not own that recipe
    if (!oldRecipe) {
      return response.status(404).end();
    }

    const keysToDelete = [];
    for (let i = 0; i < oldRecipe.photos.length; i++) {
      let appears = newPhotos.find(
        (photo) => oldRecipe.photos[i].key === photo.key
      );
      if (!appears) {
        keysToDelete.push(oldRecipe.photos[i].key);
      }
    }

    oldRecipe.photos = newPhotos;
    const promises = [];
    promises.push(oldRecipe.save());

    if (keysToDelete.length > 0) {
      promises.push(
        photoHelper.deletePhotosFromS3(
          photoHelper.PHOTO_BUCKET_NAME,
          keysToDelete
        )
      );
    }

    await Promise.all(promises);

    return response.status(200).end();
  } catch (error) {
    next(error);
  } finally {
    mongoSession.endSession();
  }
});

/*
*request body: {
  keys: [String]; array of keys you wish to delete
}
*/
recipesPhotoRouter.delete("/", async (request, response, next) => {
  const recipeId = request.params.recipeId;
  const keys = request.body.keys;
  let mongoSession;

  if (!keys || keys.length === 0) {
    return response.status(400).end();
  }
  try {
    mongoSession = await mongoose.startSession();
    const deletePicPromise = photoHelper.deletePhotosFromS3(
      photoHelper.PHOTO_BUCKET_NAME,
      keys
    );
    const updateRecipePromise = Recipe.findOneAndUpdate(
      {
        _id: recipeId,
        user: request.user.id,
      },
      {
        $pull: { photos: { key: { $in: keys } } },
      },
      {
        session: mongoSession,
      }
    );

    const results = await Promise.all([deletePicPromise, updateRecipePromise]);

    //no recipe matched the provided recipeId and userId
    if (results.length < 2 || !results[1]) {
      return response.status(404).end();
    }

    return response.status(204).end();
  } catch (error) {
    next(error);
  } finally {
    mongoSession.endSession();
  }
});
module.exports = {
  recipesPhotoRouter,
};
