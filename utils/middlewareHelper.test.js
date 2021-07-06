//dummyApp setup
const express = require('express')
const dummyApp = express()
const cors = require('cors')
dummyApp.use(express.json())

const supertest = require('supertest')
const api = supertest(dummyApp)


