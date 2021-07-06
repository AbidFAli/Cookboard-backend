const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Recipe = require('../models/recipe')
const User = require('../models/user')
const {authHeader} = require('./test_utils/testHelper.js')
const api = supertest(app)



let initialUser;
let initialUserToken;




beforeEach(async () => {
    await User.deleteMany({})
    await Recipe.deleteMany({})
    let initialUserInfo = {
        username: "AbidAli",
        password: "password",
        email: "test@test.com"
    }
    let response = await api.post('/api/users').send(initialUserInfo)
    initialUser = response.body
    response = await api.post('/api/login').send(initialUserInfo)
    initialUserToken = response.body.token
})

describe('with no recipies in the database', () => {
    describe('tests for POST /api/recipes', () => {
        test('a recipe can be added', async () => {
            let testRecipe = {
                name: "waffles",
                description: "yummy",
                instructions: ["heat pan", "add oil", "add batter", "cook", "flip"],
                ingredients: [
                    {name: "batter", amount: 1, unit : "cup"},
                    {name: "water", amount: 2, unit: "cup"}
                ],
                rating: 2.5,
                timeToMake: {value: 5, unit: "minutes"},
                servingInfo: { numServed: 1, yield: 1, servingSize: 1, unit: "pancake"},
                calories: 300,
                user: initialUser.id
            }
            let response = await api.post('/api/recipes').set(authHeader(initialUserToken)).send(testRecipe).expect(201)
            expect(response.body).toMatchObject(testRecipe)
        });
    
        test('a recipe wont be added if its name is blank', async () => {
            let testRecipe = {
                description: "healthy",
                rating: 4,
                calories: 300
            }
            let response = await api.post('/api/recipes').set(authHeader(initialUserToken)).send(testRecipe).expect(400)
        })

        test("after creating a recipe, the creating user will have the recipe's id", async () => {
            let testRecipe = {
                name: "Sushi",
                user: initialUser.id
            }
            let response = await api.post('/api/recipes').set(authHeader(initialUserToken)).send(testRecipe).expect(201)
            expect(response.body.user).toMatch(initialUser.id.toString())
            let updatedUser = await api.get(`/api/users/${initialUser.id}`)
            updatedUser = updatedUser.body
            expect(updatedUser.recipes.length).toEqual(initialUser.recipes.length + 1)
            expect(updatedUser.recipes).toContainEqual(
                expect.objectContaining(
                    {
                        id: response.body.id
                    }
                )
            ) 
        })

        
        test("a valid header must be provided to create a reipe", async () => {
            let testRecipe = {
                name: "waffles",
                user: initialUser.id
            }
           
            let response = await api.post('/api/recipes')
                .set(authHeader(initialUserToken))
                .send(testRecipe)
                .expect(201)

            expect(response.body).toMatchObject(testRecipe)
        })

        test("401 error response when the user is not logged in and tries to create a recipe", async () => {
            let testRecipe = {
                name: "waffles",
                user: initialUser.id
            }
            await api.post('/api/recipes').send(testRecipe).expect(401)
        })


    })
})

describe('with a recipe in the database', () => {
    var testId;
    const recipeParams = {
        name: "waffles",
        description: "yummy",
        instructions: ["heat pan", "add oil", "add batter", "cook", "flip"],
        ingredients: [
            {name: "batter", amount: 1, unit : "cup"},
            {name: "water", amount: 2, unit: "cup"}
        ],
        rating: 2.5,
        timeToMake: {value: 5, unit: "minutes"},
        servingInfo: { numServed: 1, yield: 1, servingSize: 1, unit: "pancake"},
        calories: 300
    }

    beforeEach(async () => {
        let testRecipe = await Recipe.create(recipeParams)
        testId = testRecipe.id
    })

    describe('GET /api/recipes/:id', () => {
        test('retrieves the recipe with the matching id', async () => {
            let response = await api.get(`/api/recipes/${testId}`).expect(200).expect('Content-Type', /application\/json/)
            expect(response.body).toMatchObject(recipeParams)
        })

        test('returns error 404 when no recipe with that id exists', async () => {
            await api.get(`/api/recipes/a402cdd2c9e0600bfea94283`).expect(404)
        })
    })

    
    describe('PUT /api/recipes/:id', () => {
        test('updates an existing recipe with that id', async () => {
            let newRecipe = {...recipeParams}
            newRecipe.calories = 400;
            let response = await api.put(`/api/recipes/${testId}`)
                .set(authHeader(initialUserToken))
                .send(newRecipe)
                .expect(200)

            expect(response.body).toMatchObject(newRecipe)
            expect(response.body.id).toMatch(testId)
        })

        test('returns error 404 if no recipe with that id exists', async () => {
            let newRecipe = {...recipeParams}
            let response = await api.put(`/api/recipes/a402cdd2c9e0600bfea94283`)
                .set(authHeader(initialUserToken))
                .send(newRecipe)
                .expect(404)
        })
    })
    
    describe('DELETE /api/recipes/:id', () => {
        test('deletes the recipe with the specified id', async () => {
            await api.delete(`/api/recipes/${testId}`).set(authHeader(initialUserToken)).expect(204)
            await api.get(`/api/recipes/${testId}`).expect(404)
        })
    })
})

describe('with multiple recipies in the database', () => {
    const recipeList = [
        {
            name: "waffles",
            description : "crunchy"
        },
        {
            name : "french toast",
            description: "yummy"
        },
        {
            name: "pancakes",
            description: "syrupy"
        }
    ]
    beforeEach(async () => {
        await Recipe.create(recipeList)
    });

    describe('GET /api/recipes ', () => {
        test('retrieves all of the recipes', async () => {
            const response = await api.get('/api/recipes')
            const retrievedRecipes = response.body
            expect(retrievedRecipes.length).toEqual(recipeList.length)
            
            recipeList.forEach((recipe) => {
                expect(retrievedRecipes.some((retrieved) => {
                    return retrieved.name === recipe.name 
                        && retrieved.description === recipe.description;
                })).toBe(true)
            })
        });

    });
})

afterAll(() => {
    mongoose.connection.close()
});