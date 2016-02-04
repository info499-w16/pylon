'use strict'

// Import main modules
const crypto = require('crypto')
const express = require('express')
const morgan = require('morgan')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const redis = require('redis')
const passport = require('passport')

// Local modules
const auth = require('./controllers/authentication')
const users = require('./models/users')
const localAuth = require('./controllers/local-auth')
const registryModel = require('./models/service-registry')
const registryController = require('./controllers/service')
import {router as UserRouter} from './controllers/users'
import {default as initRegistry} from './heartbeat/receiver'
import {default as broadcast} from './heartbeat/broadcaster'

const PORT = process.env.PORT || 3000
const API_ROOT = '/api/v1'

// Immediately begin connecting to redis
const rc = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
})

// Set registry to use our default redis store
registryModel.setStore(rc)

// Attempt to connect to the users database
users.init().then(() => {
  console.log('Successfully connected to database')

  // create the express application
  var app = express()

  // Setup middleware chain in one place to avoid confusion
  // request logging
  app.use(morgan(process.env.LOG_FORMAT || 'dev'))
  // parse both json and url-encoded body content
  // app.use(bodyParser.json())
  // app.use(bodyParser.urlencoded({extended: false}))
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

  // Attach users router
  app.use('/users', UserRouter)

  const server = app.listen(PORT, () => {
    const addr = server.address()
    if (addr.address === '::') {
      addr.address = 'localhost'
    }
    console.log(`server listening at http://${addr.address}:${addr.port}`)
  })

  // Sets up server to continuously listen for microservice broadcasts and add them
  // to the redis store
  initRegistry()

  // Sets up server to continously broadcast the IP address of pylon
  broadcast()
})
