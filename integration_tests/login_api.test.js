const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Recipe = require('../models/recipe')
const User = require('../models/user')

const api = supertest(app)


beforeEach(async () => {
  await User.deleteMany({})
  await Recipe.deleteMany({})
})

describe('tests for login', () => {
  const userInfo = {username: "AbidAli", password: "something"}
  beforeEach(async() => {
    await api.post('/api/users').send(userInfo)
  })

  test("login returns the user's info and a token", async () => {
    let response = await api.post('/api/login').send(userInfo)
    let loggedInUser = response.body
    //expect has username, doesnt have password, has the token
    expect(loggedInUser.username).toMatch(userInfo.username)
    expect(loggedInUser).toHaveProperty('token')
    expect(loggedInUser).not.toHaveProperty('password')
  })

  test('login gives an error code if the password is incorrect', async () => {
    await api.post('/api/login').send({username: userInfo.username, password: "wrong"}).expect(401)

  })
  test('login gives an error if the password is missing', async () => {
    await api.post('/api/login').send({username: userInfo.username}).expect(401)
  })
  test('login gives an error if the username does not exist', async () => {
    await api.post('/api/login').send({username: "notInDB"}).expect(401)
  })
})

afterAll(() => {
  mongoose.disconnect()
});