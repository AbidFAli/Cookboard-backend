const config = require('./src/utils/config') //inits environment variables
const app = require('./src/app')
const http = require('http')


const server = http.createServer(app)
const PORT = config.PORT

server.listen(PORT, () => {
    console.log(`Cookboard backend listening at http://localhost:${PORT}`)
})