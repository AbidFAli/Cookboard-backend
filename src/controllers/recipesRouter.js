const jwt = require('jsonwebtoken')
const recipesRouter = require('express').Router()
const Recipe = require('../models/recipe')
const User = require('../models/user')


recipesRouter.get('/', async (request, response, next) => {
    try{
        const recipes = await Recipe.find({})
        response.json(recipes)
    }
    catch(error){
        next(error)
    }
})

recipesRouter.get('/:id([a-f\\d]{24})', async (request, response, next) => {
    const id = request.params.id;
    try{
        const recipe = await Recipe.findById(id)
        if(recipe){
            response.json(recipe)
        } else {
            response.status(404).end()
        }
    }
    catch(error){
        next(error)
    }
})

recipesRouter.get('/search', async (request, response, next) => {
    let typeError = false;
    let filter = {}
    let projection = {}
    let options = {}
    if(request.query.name && typeof(request.query.name) === 'string'){
        filter['$text'] = { $search: request.query.name } 
        projection.score = {"$meta": "textScore"}
        options.sort = {score: 1}
    }
    else if(request.query.name){
        typeError = true;
    }

    if(typeError){
        return response.status(400).end()
    }

    try{
        let recipes = await Recipe.find(filter, projection, options)
        if(recipes.length === 0){
            response.status(204).end()
        }
        else{
            response.json(recipes)
        }
        
    }
    catch(error){
        next(error)
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

    try{
        const savedRecipe = await recipe.save()
        if(user){
            user.recipes = user.recipes.concat(savedRecipe._id)
            await user.save()
        }
        response.status(201).json(recipe)
    }
    catch(error){
        next(error)
    }
})


/*
 *Returns updated recipe in response body or status code of 401 if recipe is not owned by user
 *or status code of 404 if the recipe with the provided id does not exist.
 */
recipesRouter.put('/:id' , async (request, response, next) => {
    try{
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
    }
    catch(error){
        next(error)
    }
    
    
    
})

/*
 *Returns response of:
 * 204: successful deletion
 * 401: no user provided, or recipe is not owned by user making this request
 * 404: no recipe found with the provided id
 */
recipesRouter.delete('/:id' , async (request, response, next) => {
    try{
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
    }catch(error){
        next(error)
    }
     
})


module.exports = recipesRouter