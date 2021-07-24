const jwt = require('jsonwebtoken')
const recipesRouter = require('express').Router()
const Recipe = require('../models/recipe')
const User = require('../models/user')






const decodeToken = (token) => {
    return jwt.verify(token, process.env.SECRET)
}

const recipeOwnedByUser = async (userId) => {

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


/*
 *Returns updated recipe in response body or status code of 401 if recipe is not owned by user
 *or status code of 404 if the recipe with the provided id does not exist.
 */
recipesRouter.put('/:id' , async (request, response, next) => {
    const recipe = await Recipe.findById(request.params.id);
    if(!recipe){
        return response.status(404).end()
    }
    else if(recipe.user.toString() === request.user.id){
        let newRecipe = request.body
        recipe.set(newRecipe)
        let updatedRecipe = await recipe.save()
        response.send(updatedRecipe)
    }
    else if(recipe.user.toString() !== request.user.id){
        return response.status(401).end()
    }
    next()
})

/*
 *Returns response of:
 * 204: successful deletion
 * 401: no user provided, or recipe is not owned by user making this request
 * 404: no recipe found with the provided id
 */
recipesRouter.delete('/:id' , async (request, response) => {
    let recipe = await Recipe.findById(request.params.id)
    if(!recipe){
        return response.status(404).end() // no recipe found with that id
    }
    else if(recipe.user.toString() !== request.user.id){
        return response.status(401).end() 
    }
    let query = await Recipe.deleteOne({_id : request.params.id, user: request.user.id})

    if(query.ok && query.n === 1){
        response.status(204).end()
    }
    else{
        response.status(500).end()
    }


})



module.exports = recipesRouter