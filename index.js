const config = require('./utils/config')
const app = require('./app')
const http = require('http')


const server = http.createServer(app)
const PORT = config.PORT

server.listen(PORT, () => {
    console.log(`Cookboard backend listening at http://localhost:${PORT}`)
})