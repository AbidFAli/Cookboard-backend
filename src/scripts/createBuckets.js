require("../utils/config");

var AWS = require("aws-sdk");

var credentials = new AWS.SharedIniFileCredentials({
  profile: "cookboard-backend",
});
AWS.config.credentials = credentials;
AWS.config.getCredentials(function (err) {
  if (err) console.log(err.stack);
  // credentials not loaded
  else {
    console.log("Access key:", AWS.config.credentials.accessKeyId);
  }
});
