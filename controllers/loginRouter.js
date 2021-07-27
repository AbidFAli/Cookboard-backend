const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')



const recipeInfoToPopulate = {_id: 1, name: 1}

const TOKEN_EXPIRATION_TIME = "7d"

/*
 *@param request = {
   username,
   password
 *}
 *@returns {
 *  id,
 *  username
 *  recipes
 *  token
 * }
 */
loginRouter.post('/', async (request, response, next) => {
  const body = request.body;
  
  try{
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
  }
  catch(error){
    next(error)
  }
})

/*
 *@desc checks whether a token is valid or not
 *@param request = {
 *  token  
 *}
 *@returns {
 * tokenValid: bool  
 *}
 */
loginRouter.get('/valid', async (request, response) => {
  let valid = false;
    try{
      if(request.body.token){
        await jwt.verify(request.body.token, process.env.SECRET)
        valid = true;
      }
    }catch(error){
      valid = false;
    }
    finally{
      response.send({
        tokenValid: valid
      })
    }
})



module.exports = loginRouter