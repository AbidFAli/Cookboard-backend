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

module.exports = {
  authHeader,
  getTokenForUser,
  sleep,
};
