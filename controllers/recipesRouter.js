const jwt = require('jsonwebtoken')
const recipesRouter = require('express').Router()
const Recipe = require('../models/recipe')
const User = require('../models/user')






const decodeToken = (token) => {
    return jwt.verify(token, process.env.SECRET)
}



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
/*
    Example Request Header: {'Authorization': 'Bearer yourTokenHere'}
*/
recipesRouter.post('/', async (request, response, next) => {
    const body = request.body;
    let user = request.user

    const recipe = new Recipe({
        name: body.name,
        description: body.description,
        instructions: body.instructions,
        ingredients: body.ingredients,   
        rating: body.rating,
        timeToMake: body.timeToMake,
        servingInfo: body.servingInfo,
        calories: body.calories,
        user: user != null ? user._id : null, //id of the user, should probably change this
    })
    const savedRecipe = await recipe.save()

    if(user){
        user.recipes = user.recipes.concat(savedRecipe._id)
        await user.save()
    }


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
    next()
})

recipesRouter.delete('/:id' , async (request, response) => {
    await Recipe.deleteOne({_id : request.params.id})
    response.status(204).end()

})


// want path to be /user/1/recipes/aef401 or /recipes/aef401?

module.exports = recipesRouter