const mongoHelper = require('../src/utils/mongoHelper')
const Recipe = require('../src/models/recipe')

const run = async () => {
  console.log('Node env is ' + process.env.NODE_ENV)
  await mongoHelper.connectToMongo()

  Recipe.ensureIndexes().then(error => {
    if(error && error.message){
      console.log(error)
    }
    else{
      console.log('Success')
    }
  })
}

run()




