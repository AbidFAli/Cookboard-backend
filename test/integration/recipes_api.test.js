const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../../src/app')
const Recipe = require('../../src/models/recipe')
const User = require('../../src/models/user')
const {authHeader, getTokenForUser} = require('./test_utils/testHelper.js')
const api = supertest(app)
const recipeFixtures = require('./fixtures/recipeFixtures')



let initialUser;
let initialUserToken;




beforeEach(async () => {
    await Recipe.deleteMany({})
    await User.deleteMany({})
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
    let testId;
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
        recipeParams.user = initialUser.id
        let testRecipe = await Recipe.create(recipeParams)
        testId = testRecipe.id
        
    })

    //this breaks
    describe('GET /api/recipes/:id', () => {
        test('retrieves the recipe with the matching id', async () => {
            let path = `/api/recipes/${testId}`
            let response = await api.get(path).expect(200).expect('Content-Type', /application\/json/)
            expect(response.body).toMatchObject(recipeParams)
        })

        test('returns error 404 when no recipe with that id exists', async () => {
            let fakeId = "a2".repeat(12)
            await api.get(`/api/recipes${fakeId}`).expect(404)
        })
    })

    
    describe('PUT /api/recipes/:id', () => {
        let modifiedRecipe;
        beforeEach(() => {
            modifiedRecipe = {...recipeParams}
            modifiedRecipe.calories = 400;
        })

        test('updates an existing recipe with that id', async () => {
            let response = await api.put(`/api/recipes/${testId}`)
                .set(authHeader(initialUserToken))
                .send(modifiedRecipe)
                .expect(200)

            expect(response.body).toMatchObject(modifiedRecipe)
            expect(response.body.id).toMatch(testId)
        })

        test('returns error 404 if no recipe with that id exists', async () => {
            let response = await api.put(`/api/recipes/a402cdd2c9e0600bfea94283`)
                .set(authHeader(initialUserToken))
                .send(modifiedRecipe)
                .expect(404)
        })

        test("owner's token must be provided to delete a recipe", async () => {
            let response = await api.put(`/api/recipes/${testId}`)
                .set(authHeader(initialUserToken))
                .send(modifiedRecipe)
                .expect(200)
        })

        test("401 error response when trying to modify a recipe without a token in the header", async () => {
            let testRecipe = {
                name: "waffles",
                user: initialUser.id
            }
            await api.put(`/api/recipes/${testId}`).send(testRecipe).expect(401)
        })

        test("401 error response if the token is from a user who is not owner of the recipe", async () => {
            let user2Info = {
                username: "user2",
                password: "something",
                email: "test@test.com"
            }
            await api.post('/api/users').send(user2Info)
            let user2token = await getTokenForUser(api, user2Info.username, user2Info.password)
            
            
            await api.put(`/api/recipes/${testId}`)
            .set(authHeader(user2token))
            .send(modifiedRecipe)
            .expect(401)


        })

       
    })
    
    describe('DELETE /api/recipes/:id', () => {
        test('deletes the recipe with the specified id', async () => {
            await api.delete(`/api/recipes/${testId}`).set(authHeader(initialUserToken)).expect(204)
            let exists = await Recipe.exists({_id: testId})
            expect(exists).toBeFalsy();
        })

        test("owner's token must be provided to delete a recipe", async () => {
            await api.delete(`/api/recipes/${testId}`)
                .set(authHeader(initialUserToken))
                .expect(204)
        })

        test("401 error response when trying to delete a recipe without a token in the header", async () => {
            await api.delete(`/api/recipes/${testId}`).expect(401)
        })

        test("401 error response if the token is from a user who is not owner of the recipe", async () => {
            let user2Info = {
                username: "user2",
                password: "something",
                email: "test@test.com"
            }
            await api.post('/api/users').send(user2Info)
            let user2token = await getTokenForUser(api, user2Info.username, user2Info.password)
            
            
            await api.delete(`/api/recipes/${testId}`)
            .set(authHeader(user2token))
            .expect(401)


        })
    })

    

})

describe('with multiple recipies in the database', () => {
    describe('GET /api/recipes ', () => {
        let recipeList
        beforeEach(async () => {
            recipeList = recipeFixtures.similarNames()
            await Recipe.create(recipeList)
        });

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

    describe('GET /api/recipes/search', () => {

        describe('when specifying the position of a starting recipe and a result size', () => {
            let twentyRecipes;
            const searchURL = '/api/recipes/search?ratingMin=1&size=5'
            beforeEach(async () => {
                twentyRecipes = [];
                for(i = 0; i <20; i++){
                    twentyRecipes.push({
                        name: "testRecipe"+ i,
                        rating: 1.0 + .2*i
                    })
                }
                await Recipe.create(twentyRecipes)
                twentyRecipes = twentyRecipes.sort((r1, r2) => r1.rating > r2.rating ? -1: 1)
            })

            test('?start=0&size=5 gets the first 5 matching documents', async () => {
                let response = await api.get(searchURL + '&start=0')
                let expected = twentyRecipes.slice(0,5)
                expect(response.body).toHaveLength(5)
                for(i = 0; i < 5; i++){
                    expect(response.body[i].rating === expected.rating && respone.body[i].name === expected.name)
                }

            })

            test('?start=5&size=5 gets the 6th through 10th matching documents', async () => {
                let response = await api.get(searchURL + '&start=5')
                let expected = twentyRecipes.slice(5,10)
                expect(response.body).toHaveLength(5)
                for(i = 0; i < 5; i++){
                    expect(response.body[i].rating === expected.rating && respone.body[i].name === expected.name)
                }
            })

            test('?start=15&size=5 gets the 16th through 20th matching documents', async () => {
                let response = await api.get(searchURL + '&start=15')
                let expected = twentyRecipes.slice(15,20)
                expect(response.body).toHaveLength(5)
                for(i = 0; i < 5; i++){
                    expect(response.body[i].rating === expected.rating && respone.body[i].name === expected.name)
                }
            })

            test('starting past the number of documents returns no documents', async () => {
                let response = await api.get(searchURL + '&start=40')
                expect(response.body).toHaveLength(0)
            })
        })

        describe('when searching by rating', () => {

            beforeEach(async () => {
                const testRecipes = []
                for(let i = 0; i < 8; i++){
                    testRecipes.push({rating: 3, name: "a"+i})
                }
                for(let i = 0; i< 7; i++){
                    testRecipes.push({rating: 4.2, name: "b"+i})
                }
                for(let i = 0; i < 5; i++){
                    testRecipes.push({rating: 1.4, name: "c"+i})
                }
                await Recipe.create(testRecipes)
            })


            test('retrieves all recipes with less than a rating of 3.4', async () => {
                let response = await api.get('/api/recipes/search?ratingMax=3.4')
                expect(response.body.length).toBeGreaterThan(0)
                response.body.forEach((recipe) => expect(recipe.rating).toBeLessThanOrEqual(3.4))
            })

            test('retrieves all recipes with a rating greater than 2', async () => {
                let response = await api.get('/api/recipes/search?ratingMin=2')
                expect(response.body.length).toBeGreaterThan(0)
                response.body.forEach((recipe) => expect(recipe.rating).toBeGreaterThanOrEqual(2))
            })

            test('retrieves all recipes with a rating between 4 and 5', async ()=> {
                let response = await api.get('/api/recipes/search?ratingMax=5&ratingMin=4')
                expect(response.body.length).toBeGreaterThan(0)
                expect(response.body.every(recipe => recipe.rating >= 4 && recipe.rating <= 5)).toBeTruthy()
            })

            test('responds w/ status code 400 if searching for a negative rating', async () => {
                await api.get('/api/recipes/search?ratingMax=-3.4').expect(400)
            })

            test('responds w/ status code 400 if searching for a rating greater than 5', async () => {
                await api.get('/api/recipes/search?ratingMin=6').expect(400)
            })

            test('retrieved recipes are sorted in descending order of rating', async () => {
                let response = await api.get('/api/recipes/search?ratingMax=3.4')
                let sorted = false
                sorted = response.body.every((recipe, pos, recipeArray) => {
                    if(pos !== 0){
                        return recipe.rating <= recipeArray[pos-1].rating
                    }
                    else{
                        return true
                    }
                })
                response.body.forEach((recipe) => expect(recipe.rating).toBeLessThanOrEqual(3.4))
                expect(sorted).toBeTruthy()
            })
        })

        describe('when searching by name', () => {
            let recipeList

            beforeEach(async () => {
                recipeList = recipeFixtures.similarNames()
                await Recipe.create(recipeList)
            });
            test('returns one recipe if it is the only match', async () => {
                let response = await api.get('/api/recipes/search?name=waffles')
                let recipes = response.body
                expect(recipes).toHaveLength(1)
                expect(recipes[0]).toMatchObject(recipeList[0])
            })

            test('can return multiple matching recipes', async () => {
                let response = await api.get('/api/recipes/search?name=pancakes]')
                let recipes = response.body
                let expectedRecipes = [recipeList[2], recipeList[3]]
                for( let expectedRecipe of expectedRecipes){
                    let recieved = recipes.find((recipe) => recipe.name === expectedRecipe.name)
                    expect(recieved).toMatchObject(expectedRecipe)
                }
            })

            test('matching recipes are sorted by textScore', async () => {
                let response = await api.get('/api/recipes/search?name=pancakes]')
                let recipes = response.body
                let isSorted = true;
                for(let i=0; i<recipes.length - 1; i++){
                    isSorted = isSorted && recipes[i].score >= recipes[i+1].score
                }
                expect(isSorted).toBeTruthy()
            })

            test('returns an empty array if no recipes matched', async () => {
                let response = await api.get('/api/recipes/search?name=nothing]')
                expect(response.body).toHaveLength(0)
            })

            test('can get a count of the results', async () => {
                let response = await api.get('/api/recipes/search?name=pancakes&count=true')
                let body = response.body
                expect(body.count).toEqual(2)
            })

        })

        describe('when searching by name and rating', () => {
            let recipeList
            beforeEach(async () => {
                recipeList = recipeFixtures.namesAndRatings()
                await Recipe.create(recipeList)
            });

            test('returns all recipes within a range of ratings that have names matching the name query paramter', async () => {
                let response = await api.get('/api/recipes/search?ratingMin=4&name=waffles')
                expect(response.body).toHaveLength(2)
                let isSorted = true;
                for(let i=0; i<recipeList.length - 1; i++){
                    isSorted = isSorted && recipeList[i].score >= recipeList[i+1].score && recipeList[i].rating >= recipeList[i+1].rating
                }
                expect(isSorted)
            })

        });
        
    })
})

afterAll(() => {
    mongoose.connection.close()
});