const original = jest.requireActual("../recipesRouterHelper");
const photoHelper = {
  ...original,
  deletePhotosFromS3: jest.fn().mockResolvedValue({}),
};

module.exports = {
  ...photoHelper,
};
