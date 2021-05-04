const mongoose = require('mongoose')
const {ingredientSchema, Ingredient} = require('./ingredient')

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    instructions: [String],
    ingredients: [ingredientSchema],
    stars: {
        type: Number,
        default: 0
    },
    timeToMake: {
        value: Number,
        unit: String
    },
    servingInfo: {
        numServed: Number,
        yield: Number,
        servingSize: Number,
        unit: String,
    },
    calories: Number
})

//TODO needs testing
recipeSchema.set('toJSON', {
    transform: function(doc, returnedObject, options){
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        return returnedObject;
    }
})

module.exports = mongoose.model('Recipe', recipeSchema)