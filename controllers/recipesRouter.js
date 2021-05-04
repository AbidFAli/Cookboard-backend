const recipesRouter = require('express').Router()
const { response } = require('../app')
const Recipe = require('../models/recipe')

recipesRouter.get('/', async (request, response) => {

})

recipesRouter.get('/:id', async (request, response) => {
    const id = request.params.id;
    const recipe = await Recipe.findById(id)
    if(recipe){
        response.json(recipe)
    } else {
        response.status(404).end()
    }
})

recipesRouter.post('/', async (request, response) => {
    const body = request.body;
    const recipe = new Recipe({
        name: body.name,
        description: body.description,
        instructions: body.instructions,
        ingredients: body.ingredients,   //could cause issues b/c of schema
        stars: body.stars,
        timeToMake: body.timeToMake,
        servingInfo: body.servingInfo,
        calories: body.calories
    })
    await recipe.save()
    response.json(recipe)
})


recipesRouter.put('/:id' , async (request, response) => {

})

recipesRouter.delete('/:id' , async (request, response) => {

})


// want path to be /user/1/recipes/aef401 or /recipes/aef401?

module.exports = recipesRouter