const express = require('express')
const passport = require('passport')
const users = require('../models/users')

const PROVIDER = 'google'

const authentication = require('./authentication')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

function loadEnv (envVar) {
  if (!process.env[envVar]) throw new Error(`Environment variable '${envVar}' not found`)
  return process.env[envVar]
}

const GOOGLE_CLIENT_ID = loadEnv('CLIENT')
const GOOGLE_CLIENT_SECRET = loadEnv('SECRET')

function convertToUser (profile) {
  return {
    authProvider: PROVIDER,
    authId: profile.id,
    displayName: profile.displayName,
    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
    // oauthProfile: profile
  }
}

function applyToUser (profile, user) {
  if (profile.displayName) {
    user.displayName = profile.displayName
  }

  if (profile.emails && profile.emails.length > 0) {
    user.email = profile.emails[0].value
  }

  user.oathProfile = profile
  return user
}

module.exports.Strategy = () => {
  return new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT || 3000}/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    // see if user already exists
    users.getById(profile.id)
      .then(user => {
        console.log('got a user by ID')
        if (!user) {
          return users.insert(profile.id, convertToUser(profile))
        } else {
          return users.update(applyToUser(profile, user))
        }
      })
      .then(user => {
        console.log('got a user, calling done funciton')
        done(null, user)
      })
      .catch(done)
  })
}

module.exports.GoogleRouter = () => {
  var router = express.Router()

  router.get('/signin/google', passport.authenticate(PROVIDER, {scope: 'profile'}))

  router.get('/auth/google/callback', passport.authenticate(PROVIDER, {scope: 'profile'}),
    authentication.backToRequestedUrl)

  return router
}

module.exports.Router = () => {
  var router = express.Router()

  router.post('/signin', passport.authenticate(PROVIDER), (req, res) => {
    var response = {message: 'authenticated'}

    if (req.session.afterAuthRedirectTo) {
      response.redirectTo = req.session.afterAuthRedirectTo
      delete req.session.afterAuthRedirectTo
    }

    res.json(response)
  })

  // router.post('/signup', (req, res, next) => {
  //   var newUser = req.body

  //   // ensure new user has required properties
  //   if (!newUser || !newUser.email || !newUser.displayName || !newUser.password) {
  //     return next({status: 400, message: 'Email, display name, and password are all required.'})
  //   }

  //   newUser.authProvider = PROVIDER
  //   newUser.authId = newUser.email

  //   users.doesUserExist(PROVIDER, newUser.email)
  //     .then(alreadyRegistered => {
  //       if (alreadyRegistered) {
  //         throw new Error({status: 400, message: 'That email address is already registered.'})
  //       }

  //       return hashPassword(newUser)
  //     })
  //     .then(() => {
  //       return users.insert(newUser)
  //     })
  //     .then(() => {
  //       return loginUser(newUser, req)
  //     })
  //     .then(() => {
  //       res.status(201).json({message: 'created and authenticated new user'})
  //     })
  //     .catch(next)
  // })

  router.get('/signout', (req, res) => {
    req.logout()
    res.json({message: 'signed out'})
  })

  return router
}
