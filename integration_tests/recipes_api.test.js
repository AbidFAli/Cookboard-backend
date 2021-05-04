const supertest = require('supertest')
const mongoose = require('mongoose')
const app = require('../app')
const Recipe = require('../models/recipe')
const Ingredient = require('../models/ingredient')

const api = supertest(app)

beforeEach(async () => {
    await Recipe.deleteMany({})
})
describe('with no recipies in the database', () => {
    test('a recipe can be added', async () => {
        let testRecipe = {
            name: "waffles",
            description: "yummy",
            instructions: ["heat pan", "add oil", "add batter", "cook", "flip"],
            ingredients: [
                {name: "batter", amount: 1, unit : "cup"},
                {name: "water", amount: 2, unit: "cup"}
            ],
            stars: 2.5,
            timeToMake: {value: 5, unit: "minutes"},
            servingInfo: { numServed: 1, yield: 1, servingSize: 1, unit: "pancake"},
            calories: 300
        }
        let response = await api.post('/api/recipes').send(testRecipe).expect(200)
        expect(response.body).toMatchObject(testRecipe)
    });
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
        stars: 2.5,
        timeToMake: {value: 5, unit: "minutes"},
        servingInfo: { numServed: 1, yield: 1, servingSize: 1, unit: "pancake"},
        calories: 300
    }

    beforeEach(async () => {
        let testRecipe = await Recipe.create(recipeParams)
        testId = testRecipe.id
    })

    test('an existing recipe can be retrieved by its id', async () => {
        let response = await api.get(`/api/recipes/${testId}`).expect(200).expect('Content-Type', /application\/json/)
        expect(response.body).toMatchObject(recipeParams)

    })
})

afterAll(() => {
    mongoose.connection.close()
});