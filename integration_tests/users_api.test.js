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

describe('tests for POST /api/users', () => {
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
})


describe('tests for GET /api/users/:id', () => {
  let initialUser;
  const initialInfo = {
    username: "Abid",
    passwordHash: "6e1f3a2419b",
    email: "test@test.com"
  }
  beforeEach(async () => {
    initialUser = new User(initialInfo)
    initialUser = await initialUser.save()
  })

  test('an existing user can be retrieved by their id', async () => {
    let response = await api.get(`/api/users/${initialUser.id}`)
    let retrievedUser = response.body;
    expect(retrievedUser.id).toMatch(initialUser.id)
    expect(retrievedUser).toMatchObject({username: initialInfo.username, email: initialInfo.email})
  })

  test('a user with no recipes will be retrieved with no recipes', async () => {
    let response = await api.get(`/api/users/${initialUser.id}`)
    let retrievedUser = response.body;
    expect(retrievedUser.recipes).toHaveLength(0)
  })

  describe('when there is a user that has made multiple recipes', () =>{
    let userWithRecipes;
    let testRecipe = {name: "lamb chops"};
    const userWithRecipesInfo = 
    {
      username: "User2",
      passwordHash: "hash",
      email: "something@something.com"
    }

    beforeEach(async () => {
      userWithRecipes = new User(userWithRecipesInfo)
      userWithRecipes = await userWithRecipes.save()
      testRecipe = await api.post('/api/recipes').send({name: "lamb chops", user: userWithRecipes.id})
      testRecipe = testRecipe.body
      userWithRecipes = await User.findById(userWithRecipes.id)
    })

    
    test('a user with recipes will have a list of the names of their recipes', async () => {
      let response = await api.get(`/api/users/${userWithRecipes.id}`)
      // let {body: retrievedUser, } = await api.get(`/api/users/${userWithRecipes.id}`)
      expect(response.body.recipes).toContainEqual({id : testRecipe.id, name: testRecipe.name})
    })
    
    
    
  })




})

afterAll(() => {
  mongoose.connection.close()
});