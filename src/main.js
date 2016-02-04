'use strict'

// Import main modules
const crypto = require('crypto')
const express = require('express')
const morgan = require('morgan')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const redis = require('redis')
const passport = require('passport')
const dgram = require('dgram')

// Local modules
const auth = require('./controllers/authentication')
const users = require('./models/users')
const localAuth = require('./controllers/local-auth')
const registryModel = require('./models/service-registry')
const registryController = require('./controllers/service')

const PORT = process.env.PORT || 3000
const API_ROOT = '/api/v1'
const REGISTRY_PORT = process.env.REGISTRY_PORT || 8888

// Immediately begin connecting to redis
const rc = redis.createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
})

// Set registry to use our default redis store
registryModel.setStore(rc)

// Attempt to connect to the users database
users.init().then(() => {
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

  const server = app.listen(PORT, () => {
    const addr = server.address()
    if (addr.address === '::') {
      addr.address = 'localhost'
    }
    console.log(`server listening at http://${addr.address}:${addr.port}`)
  })

  // Startup UDP Registration server
  const registry = dgram.createSocket('udp4')

  registry.on('error', (err) => {
    console.log(`Registry error:\n${err.stack}`)
    registry.close()
  })

  registry.on('message', registryController.registryHandler)

  registry.on('listening', () => {
    var address = registry.address()
    console.log(`Registry listening ${address.address}:${address.port}`)
  })

  registry.bind(REGISTRY_PORT)
})
