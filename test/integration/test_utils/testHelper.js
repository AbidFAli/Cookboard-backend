const { JsonWebTokenError } = require("jsonwebtoken");

const authHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

const getTokenForUser = async (api, username, password) => {
  let response = await api.post("/api/login").send({ username, password });
  return response.body.token;
};

const sleep = async (ms) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

/*
*@returns {
  intialUser,
  initialUserToken
}
*/
const createUser = async (api, userInfo) => {
  let response = await api.post("/api/users").send(userInfo);
  let initialUser = response.body;
  response = await api.post("/api/login").send(userInfo);
  let initialUserToken = response.body.token;

  return {
    initialUser,
    initialUserToken,
  };
};

/*
 *@callback supressionRule:
 *@param error: the error that will be passed to the callback
 *@returns: true or false depending on whether to supress the error or not
 */
const supressErrorInTest = () => {
  jest.spyOn(console, "error").mockImplementation(jest.fn());
};

const unsupressErrorInTest = () => {
  jest.spyOn(console, "error").mockRestore();
};

module.exports = {
  authHeader,
  getTokenForUser,
  sleep,
  createUser,
  supressErrorInTest,
  unsupressErrorInTest,
};
