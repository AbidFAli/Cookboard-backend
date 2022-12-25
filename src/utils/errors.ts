class UserCreationError extends Error {
  static MESSAGE_NONUNIQUE_USERNAME = "Username must be unique";
  static errorName = "UserCreationError"
  name: string;
  constructor(message : string) {
    super(message);
    this.name = "UserCreationError"
  }
}

class SearchError extends Error {
  static errorName = "SearchError"
  name: string;
  constructor(message: string) {
    super(message);
    this.name = "SearchError";
  }
}

export = {
  UserCreationError,
  SearchError,
};
