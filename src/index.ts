import config = require("./utils/config.js"); //inits environment variables
import app = require("./app");
import http = require("http");

const server = http.createServer(app);
const PORT = config.PORT;

server.listen(PORT, () => {
  console.log(`Cookboard backend listening at http://localhost:${PORT}`);
});
