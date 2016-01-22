const express = require('express')
const serviceRegistry = require('../models/service-registry')
// const users = require('../models/users')

// Handler for UDP service registration
module.exports.registryHandler = function (msg, rinfo) {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
  const instance = JSON.parse(msg)
  // The most important thing is the ip address, and we need to set that
  // property on the object before setting it in storage
  instance.ipAddr = rinfo.address
  serviceRegistry.add(instance)
}

// The main router for the API
module.exports.Router = () => {
  const router = express.Router()

  // Get information about a specific microservice instance
  router.get('/registry/:name/:id')
  // Get list of microservice instances with registered name
  router.get('/registry/:name', (req, res) => {
    serviceRegistry.getAll(req.params.name)
      .then(services => {
        res.json(services)
      })
      .catch(err => {
        res.status(500).json(err)
      })
  })

  // Make is so that only 'admins' can do this in the future
  // See who's authorized to use a given service
  router.get('/registry/:name/:id/authentication')
  // Authorize a user
  router.post('/registry/:name/:id/authentication/:userId')
  // Deauthorize a user
  router.delete('/registry/:name/:id/authentication/:userId')

  // This is where we will perform forwarding and do service lookups
  router.all('/forward/:name', (req, res) => {
    console.log(req)
    res.json({
      name: req.params.name
    })
  })

  return router
}
