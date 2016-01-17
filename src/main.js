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
  // This should properly look them up and authenticate them OR add them to the store
  users.createOrLookup(profile).then(done)
}))

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile', 'https://www.googleapis.com/auth/plus.login'] }),
  (req, res) => {
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  })

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/')
  })

app.get('/signup')

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.use(passport.initialize())
app.use(passport.session())
const server = app.listen(PORT, () => {
  const addr = server.address()
  if (addr.address === '::') {
    addr.address = 'localhost'
  }
  console.log(`server listening at http://${addr.address}:${addr.port}`)
})
