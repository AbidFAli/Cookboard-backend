const usersRouter = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const MIN_PASS_LENGTH = 3
const PASSWORD_ERROR_MESSAGE = `PasswordError: password was less than ${MIN_PASS_LENGTH} characters`

const NUM_SALTS = 10;

const recipeInfoToPopulate = {_id: 1, name: 1}

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('recipes', recipeInfoToPopulate)
  response.json(users)
})

//maybe secure this/make it not publicly accessible if there is user info you want to keep secret
//or only allow it during test?
//TODO: swap this with the login 
usersRouter.get('/:id', async (request, response, next) => {
  const user = await User.findById(request.params.id).populate('recipes', recipeInfoToPopulate)
  if(user){
    response.json(user)
  }
  else{
    response.status(404)
  }
})

usersRouter.post('/', async (request, response, next) => {
  const body = request.body;
  try{
    if(body.password.length < 3){
      throw new Error(PASSWORD_ERROR_MESSAGE)
    }
  }
  catch(exception){
    next(exception)
  }

  const passwordHash = await bcrypt.hash(body.password, NUM_SALTS)

  const user = new User({
    username: body.username,
    email: body.email,
    passwordHash,
  })

  try{
    const savedUser = await user.save()
    response.json(savedUser)
  }
  catch(exception){
    next(exception)
  }

})


module.exports = usersRouter