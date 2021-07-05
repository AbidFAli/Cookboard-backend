const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

/*
 *body = {
   username,
   password
 }
 */
loginRouter.post('/', async (request, response) => {
  const body = request.body
  const user = await User.findOne({username: body.username})
  let validPassword = false
  if(user && body.password){
    validPassword = await bcrypt.compare(body.password, user.passwordHash)
  }

  if(user && validPassword){
    //add the token to the user object
    let token = jwt.sign({id: user.id, username: user.username}, process.env.SECRET)
    
    let userWithToken = {
      id: user.id, 
      username: user.username, 
      recipes: user.recipes, 
      token: token
    }
    
    response.json(userWithToken)
  }
  else{
    response.status(401).send('Invalid password')
  }

})



module.exports = loginRouter