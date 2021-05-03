const mongoose = require('mongoose')

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    unit: String
})

ingredientSchema.set('toJSON', {
    transform: function(doc, returnedObject, options){
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        return returnedObject;
    }
})

let Ingredient = mongoose.model('Ingredient', ingredientSchema)
module.exports = {
    ingredientSchema,
    Ingredient
}