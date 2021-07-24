const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const morgan = require('morgan')

const usersRouter = require('./controllers/usersRouter')
const recipesRouter = require('./controllers/recipesRouter')
const loginRouter = require('./controllers/loginRouter')

const middleware = require('./utils/middleware')
const {useMethodsExcept} = require('./utils/middlewareHelper')

const MONGODB_URI = config.MONGODB_URI

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
    .catch((error) => {
        console.log('error connecting to MongoDB', error.message)
    });


app.use(cors())
app.use(express.json())
if(process.env.NODE_ENV !== 'test'){
    app.use(morgan('common'))
}

app.use('/api/login', loginRouter)
app.use(middleware.tokenExtractor)
app.use('/api/users', usersRouter)
app.use('/api/recipes', 
    useMethodsExcept(['GET'], middleware.userExtractor)
    , recipesRouter)
if(process.env.NODE_ENV === 'test'){
    const testingRouter = require('./controllers/testingRouter')
    app.use('/api/test', testingRouter)
}

app.use(middleware.errorHandler)

module.exports = app;