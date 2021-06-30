const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Recipe = require('../models/recipe')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
})

test('a new user can be created', async () => {
  let user = {
    username: "Abid",
    password: "password",
    email: "test@test.com"
  }

  let response = await api.post('/api/users').send(user);
  let createdUser = response.body;
  expect(createdUser.id).toBeDefined();

})

afterAll(() => {
  mongoose.connection.close()
});