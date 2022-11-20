const COLLATION_OPTION = { locale: "en" };

const autoIndexEnabled = () => {
  if (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  ) {
    return true;
  }
  return false;
};

module.exports = {
  COLLATION_OPTION,
  autoIndexEnabled,
};
