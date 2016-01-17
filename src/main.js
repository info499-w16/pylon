'use strict'

// Import main modules
const crypto = require('crypto')
const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

// Local modules
const auth = require('./controllers/authentication')
const users = require('./models/users')

// Immediately begin connecting to redis
users.initializeRedis({
  // REDIS_NAME is automatically set by docker
  // If not found, assume it's running on the localhost
  host: process.env.REDIS_NAME ? 'redis' : 'localhost'
})

// create the express application
var app = express()

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
  store: new RedisStore()
}))

// configure passport for user authentication
passport.serializeUser(auth.serializeUser)
passport.deserializeUser(auth.deserializeUser)

passport.use(GoogleStrategy)

app.use(passport.initialize())
app.use(passport.session())
const server = app.listen(process.env.PORT || 3000, () => {
  const addr = server.address()
  if (addr.address === '::') {
    addr.address = 'localhost'
  }
  console.log(`server listening at http://${addr.address}:${addr.port}`)
})
