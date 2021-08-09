const jwt = require('jsonwebtoken')
const User = require('../models/user')
const {UserCreationError} = require('./errors')




const errorHandler = function(error, request, response, next){
    if(error.name === 'ValidationError' || error.name === 'JsonWebTokenError'){
        let errorToSend = {name: error.name, error: error.message}
        if(error.message.match(/expected `username` to be unique/)){
            errorToSend = {name: UserCreationError.name, error: UserCreationError.MESSAGE_NONUNIQUE_USERNAME}
        }
        
        return response.status(400).json(errorToSend)
        
    }
    else if(error.name === 'TokenExpiredError'){
        return response.status(403).json({name: error.name, error: error.message})
    }else{
        console.log(error)
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
    Sets request.user to the User specified in the decoded token.
    request.user can be null if the token is improperly formatted or does not exist.
*/
const userExtractor = async function(request, response, next){
    

    try{
        let decodedToken = request.token ? jwt.verify(request.token, process.env.SECRET) : null
        if(!decodedToken || !decodedToken.id){
            return response.status(401).end()
        }
        request.user = await User.findById(decodedToken.id)
    }
    catch(error){
        next(error)
    }
    
    
    next()
}

module.exports = {
    errorHandler,
    tokenExtractor,
    userExtractor
}

