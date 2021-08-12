const mongoHelper = require('../src/utils/mongoHelper')
const Recipe = require('../src/models/recipe')

const run = async () => {
  console.log('Node env is ' + process.env.NODE_ENV)

  try{
    await mongoHelper.connectToMongo()
    await Recipe.syncIndexes()
    console.log('Indexes created')
  }catch(error){
    console.log(error)
  }
  return
}

run()




