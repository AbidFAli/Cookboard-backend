const testingRouter = require('express').Router()
const Recipe = require('../models/recipe')
const User = require('../models/user')

testingRouter.post('/reset', async (request, response) => {
  await Recipe.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = testingRouter