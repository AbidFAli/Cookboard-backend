const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')



const recipeInfoToPopulate = {_id: 1, name: 1}

const TOKEN_EXPIRATION_TIME = "7d"

/*
 *body = {
   username,
   password
 }
 */
loginRouter.post('/', async (request, response) => {
  const body = request.body
  const user = await User.findOne({username: body.username}).populate('recipes', recipeInfoToPopulate)
  let validPassword = false
  if(user && body.password){
    validPassword = await bcrypt.compare(body.password, user.passwordHash)
  }


  if(user && validPassword){
    //add the token to the user object
    let token = jwt.sign({id: user.id, username: user.username}, process.env.SECRET, {expiresIn: TOKEN_EXPIRATION_TIME})
    
    let userWithToken = {
      id: user.id, 
      username: user.username, 
      recipes: user.recipes, 
      token: token
    }
    
    response.json(userWithToken)
  }
  else if(!validPassword){
    response.status(401).send('Invalid password')
  }
  else if(!user){
    response.status(404).send('User does not exist')
  }

})



module.exports = loginRouter