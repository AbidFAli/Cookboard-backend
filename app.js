const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const morgan = require('morgan')

const usersRouter = require('./controllers/usersRouter')
const recipesRouter = require('./controllers/recipesRouter')

const middleware = require('./utils/middleware')

const MONGODB_URI = config.MONGODB_URI

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connecting to MongoDB', error.message)
    });

app.get('/', (request, response) => {
    response.send('Hello World!')
})

app.use(cors())
app.use(express.json())
//app.use(morgan('dev'))
app.use('/api/users', usersRouter)
app.use('/api/recipes',recipesRouter)
if(process.env.NODE_ENV === 'test'){
    const testingRouter = require('./controllers/testingRouter')
    app.use('/api/test', testingRouter)
}

app.use(middleware.errorHandler)

module.exports = app;