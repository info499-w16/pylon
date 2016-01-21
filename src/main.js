'use strict'

// Import main modules
const crypto = require('crypto')
const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const passport = require('passport')

// Local modules
const auth = require('./controllers/authentication')
const users = require('./models/users')
const localAuth = require('./controllers/local-auth')
const registryModel = require('./models/service-registry')
const registryController = require('./controllers/service')

const PORT = process.env.PORT || 3000
const API_ROOT = '/api/v1'

// Immediately begin connecting to redis
const rc = users.initializeRedis({
  // REDIS_NAME is automatically set by docker
  // If not found, assume it's running on the localhost
  host: process.env.REDIS_NAME ? 'redis' : 'localhost'
})

// Allows the registry to store information
registryModel.setClient(rc)

// create the express application
var app = express()

// Setup middleware chain in one place to avoid confusion
// request logging
app.use(morgan(process.env.LOG_FORMAT || 'dev'))
// parse both json and url-encoded body content
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
// support user sessions
app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({client: rc})
}))

// configure passport for user authentication
passport.serializeUser(auth.serializeUser)
passport.deserializeUser(auth.deserializeUser)

// Sets up passport to use Google for authentication
passport.use(localAuth.Strategy())

app.use(passport.initialize())
app.use(passport.session())
app.use(localAuth.GoogleRouter())

// In order to use the main API they must be authenticated
app.use(API_ROOT, auth.ensureAuth('/signin/google'))
app.use(API_ROOT, registryController.Router())

const server = app.listen(PORT, () => {
  const addr = server.address()
  if (addr.address === '::') {
    addr.address = 'localhost'
  }
  console.log(`server listening at http://${addr.address}:${addr.port}`)
})
