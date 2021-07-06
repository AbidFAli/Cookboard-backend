const jwt = require('jsonwebtoken')
const User = require('../models/user')


const errorHandler = function(error, request, response, next){
    if(error.name === 'ValidationError' || error.name === 'JsonWebTokenError'){
        return response.status(400).json({error: error.message})
    }
    else if(error.name === 'TokenExpiredError'){
        return response.status(403).json({error: error.message})
    }else{
        console.log(error)
        return response.status(400).json({error: error.message})
    }
    next(error)
}

//keep the space
const TOKEN_PREFIX = 'Bearer '

/*
    Sets the request's token property. 
    request.token will be null if the token is improperly formatted or does not exist.
*/
const tokenExtractor = function(request, response, next) {
    let authHeader = request.get('Authorization')
    if(authHeader && authHeader.toLowerCase().startsWith(TOKEN_PREFIX.toLowerCase())){
        authHeader = authHeader.slice(TOKEN_PREFIX.length)
    }
    request.token = authHeader

    next()
}

/*
    Sets the request's user property to the User specified in the decoded token.
    request.user can be null if the token is improperly formatted or does not exist.
*/
const userExtractor = async function(request, response, next){
    let decodedToken = request.token ? jwt.verify(request.token, process.env.SECRET) : null
    if(!decodedToken || !decodedToken.id){
        return response.status(401).end()
    }

    request.user = await User.findById(decodedToken.id)
    
    next()
}

module.exports = {
    errorHandler,
    tokenExtractor,
    userExtractor
}

