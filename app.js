const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connecting to MongoDB', error.message)
    });
app.get('/', (request, response) => {
    response.send('Hello World!')
})

app.use(cors())
app.use(express.json())

module.exports = app;