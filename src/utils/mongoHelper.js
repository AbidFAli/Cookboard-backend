const config = require('./config')
const mongoose = require('mongoose')

const MONGODB_URI = config.MONGODB_URI

function connectToMongo() {
  return mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false })
      .catch((error) => {
          console.log('error connecting to MongoDB', error.message)
      });
}

module.exports = {
  connectToMongo
}