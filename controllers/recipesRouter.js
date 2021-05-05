const recipesRouter = require('express').Router()
const { response } = require('../app')
const Recipe = require('../models/recipe')

recipesRouter.get('/', async (request, response) => {
    const recipes = await Recipe.find({})
    response.json(recipes)

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
        ingredients: body.ingredients,   
        stars: body.stars,
        timeToMake: body.timeToMake,
        servingInfo: body.servingInfo,
        calories: body.calories
    })
    await recipe.save()
    response.status(201).json(recipe)
})


recipesRouter.put('/:id' , async (request, response, next) => {
    const recipe = await Recipe.findById(request.params.id);
    if(recipe){
        let newRecipe = request.body
        recipe.set(newRecipe)
        let updatedRecipe = await recipe.save()
        response.send(updatedRecipe)
    }
    else{
        response.status(404).end()
    }
})

recipesRouter.delete('/:id' , async (request, response) => {
    await Recipe.deleteOne({_id : request.params.id})
    response.status(204).end()

})


// want path to be /user/1/recipes/aef401 or /recipes/aef401?

module.exports = recipesRouter