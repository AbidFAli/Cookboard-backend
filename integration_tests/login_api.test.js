const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Recipe = require('../models/recipe')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


const api = supertest(app)


beforeEach(async () => {
  await Recipe.deleteMany({})
  await User.deleteMany({})  
})

describe('tests for login', () => {
  const userInfo = {username: "AbidAli", password: "something"}
  beforeEach(async() => {
    await api.post('/api/users').send(userInfo)
  })

  describe('tests for POST /login', () => {
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


  describe('tests for GET /login/valid', () => {
    const sendToken = async (token) => await api.post('/api/login/valid').send({token});

    test('returns true if token is valid', async () => {
      let response = await api.post('/api/login').send(userInfo)
      response = await sendToken(response.body.token)
      expect(response.body.tokenValid).toBeTruthy();
    })
    test('returns true if token has not expired', async () => {
      let signedToken = jwt.sign(userInfo, process.env.SECRET, {expiresIn: "1d"})
      let response = await sendToken(signedToken)
      expect(response.body.tokenValid).toBeTruthy();
    })
    test('returns false if invalid token', async () => {
      let response = await sendToken("ae467je112z")
      expect(response.body.tokenValid).toBeFalsy();
    })
    test('returns false if token has expired', async () => {
      let signedToken = jwt.sign(userInfo, process.env.SECRET, {expiresIn: "1 ms"})
      let response = await sendToken(signedToken)
      expect(response.body.tokenValid).toBeFalsy()
    })
  })
})



afterAll(() => {
  mongoose.disconnect()
});