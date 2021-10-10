const mongoHelper = require('./utils/mongoHelper')
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')

const usersRouter = require('./controllers/usersRouter')
const recipesRouter = require('./controllers/recipesRouter')
const loginRouter = require('./controllers/loginRouter')

const middleware = require('./utils/middleware')
const {useMethodsExcept} = require('./utils/middlewareHelper')

mongoHelper.connectToMongo()


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