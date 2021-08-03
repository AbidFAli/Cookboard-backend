
class UserCreationError extends Error{
  constructor(message){
    this.message = message;
  }
  static name = "UserCreationError";
  static MESSAGE_NONUNIQUE_USERNAME = "Username must be unique";
}

module.exports = {
  UserCreationError
}