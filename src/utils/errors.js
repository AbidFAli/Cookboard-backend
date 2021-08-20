
class UserCreationError extends Error{
  constructor(message){
    super(message);
    this.name = UserCreationError.name
  }
  static name = "UserCreationError";
  static MESSAGE_NONUNIQUE_USERNAME = "Username must be unique";
}

class SearchError extends Error{
  constructor(message){
    super(message)
    this.name = SearchError.name
  }
  static name = "SearchError"

}

module.exports = {
  UserCreationError,
  SearchError
}