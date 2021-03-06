const semver = require('semver')
const request = require('request')
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

  // Get list of microservice instances with registered name
  router.get('/:name', (req, res) => {
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
  router.get('/:name/:id/authentication')
  // Authorize a user
  router.post('/:name/:id/authentication/:userId')
  // Deauthorize a user
  router.delete('/:name/:id/authentication/:userId')

  // This is where we will perform forwarding and do service lookups
  router.all('/forward/:name/:version/*', (req, res) => {
    if (!semver.valid(req.params.version)) {
      res.status(400).send(`Supplied invalid version string: ${req.params.version}`)
    }
    // IP Lookup for service
    serviceRegistry.get(req.params.name, req.params.version)
      .then(({ipAddr, port}) => {
        // Port is optional
        port = port || 80
        const idx = `/forward/${req.params.name}/${req.params.version}`.length
        const forwardedPath = req.url.substring(idx)
        const uri = `http://${ipAddr}:${port}${forwardedPath}`
        const options = {
          url: uri,
          headers: {
            'X-User': '1234'
          }
        }
        // Proxy the reqest
        req.pipe(request(options)).pipe(res)
      }).catch(err => {
        res.status(404).send(`Service '${req.params.name}' not found :(.\nError details: ${err.toString()}`)
      })
  })

  return router
}
