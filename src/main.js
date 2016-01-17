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

const PORT = process.env.PORT || 3000

function loadEnv (envVar) {
  if (!process.env[envVar]) throw new Error(`Environment variable '${envVar}' not found`)
  return process.env[envVar]
}

const GOOGLE_CLIENT_ID = loadEnv('CLIENT')
const GOOGLE_CLIENT_SECRET = loadEnv('SECRET')

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

// Sets up passport to use Google for authentication
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:${PORT}/auth/google/callback`
}, (token, tokenSecret, profile, done) => {
  // This should properly look them up and authenticate them
  users.deserializeUser(profile.id).then(done)
}))

app.use(passport.initialize())
app.use(passport.session())
const server = app.listen(PORT, () => {
  const addr = server.address()
  if (addr.address === '::') {
    addr.address = 'localhost'
  }
  console.log(`server listening at http://${addr.address}:${addr.port}`)
})
