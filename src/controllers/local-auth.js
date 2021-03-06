const express = require('express')
const passport = require('passport')
const users = require('../models/users')

const PROVIDER = 'google'

const authentication = require('./authentication')
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

// Helper function for loading secret keys mainly. If they aren't found, just
// crash
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
    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null,
    oauthProfile: profile
  }
}

function applyToUser (profile, user) {
  if (profile.displayName) {
    user.displayName = profile.displayName
  }

  if (profile.emails && profile.emails.length > 0) {
    user.email = profile.emails[0].value
  }

  user.oauthProfile = profile
  return user
}

module.exports.Strategy = () => {
  return new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT || 3000}/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    // see if user already exists
    users.getByAuthId(profile.id)
      .then(user => {
        return users.update(applyToUser(profile, user))
      })
      // User wasn't found
      .catch(e => {
        console.log('User not found, creating new one in database')
        return users.insert(profile.id, convertToUser(profile))
      })
      .then(user => {
        done(null, user)
      })
  })
}

module.exports.GoogleRouter = () => {
  var router = express.Router()

  router.get('/signin/google', passport.authenticate(PROVIDER, {scope: ['email', 'profile']}))

  router.get('/auth/google/callback', passport.authenticate(PROVIDER, {scope: 'profile'}),
    authentication.backToRequestedUrl)

  return router
}

module.exports.Router = () => {
  var router = express.Router()

  router.get('/session', ({user, session}, res) => {
    res.json({user, session})
  })

  router.get('/signout', (req, res) => {
    req.logout()
    res.json({message: 'signed out'})
  })

  return router
}
