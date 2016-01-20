const express = require('express')
// const users = require('../models/users')
// const serviceRegistry = require('../models/service-registry')

// The main router for the API
module.exports.Router = () => {
  const router = express.Router()

  // Add a microservice instance
  router.post('/registry/:name')
  // Remove a microservice instance
  router.delete('/registry/:name/:id')
  // Update a microservice instance
  router.put('/registry/:name/:id')
  // Get information about a specific microservice instance
  router.get('/registry/:name/:id')
  // Get list of microservice instances with registered name
  router.get('/registry/:name')

  // Make is so that only 'admins' can do this in the future
  // See who's authorized to use a given service
  router.get('/registry/:name/:id/authentication')
  // Authorize a user
  router.post('/registry/:name/:id/authentication/:userId')
  // Deauthorize a user
  router.delete('/registry/:name/:id/authentication/:userId')

  // This is where we will perform forwarding and do service lookups
  router.all('/forward/:name')

  return router
}
