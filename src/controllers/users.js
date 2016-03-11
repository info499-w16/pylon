import * as express from 'express'
import {default as bodyParser} from 'body-parser'

import * as users from '../models/users'

// Should be mounted under /users, all requests will assume this as a prefix
export const router = express.Router()

// Use body parsing on this route ONLY
// This is important, because when this is enabled globally it PREVENTS
// forwarding from working properly, and leads to mysterious socket hang up
// errors. Be wary of global middleware usage because it may impact how
// requests are forwarded.
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({extended: false}))

// Catches an error from a promise, sending a 400 status and printing the string
function handleBadReq (promise, res) {
  promise.catch(err => {
    res.status(400).send(err.toString())
  })
}

// Shows information about the user as identified by the given session
router.get('/me', (req, res) => {
  // Send the user associated with the session
  res.json(req.user)
})

// Show all users
router.get('/all', (req, res) => {
  const main = users.getAll().then(users => {
    res.json(users)
  })
  handleBadReq(main, res)
})
router.get('/all/:authLevel', (req, res) => {
  const main = users.getAll(req.params.authLevel).then(users => {
    res.json(users)
  })
  handleBadReq(main, res)
})

// Get a sepecific user
router.get('/:id', (req, res) => {
  const main = users.getById(req.params.id).then(user => {
    res.json(user)
  })
  handleBadReq(main, res)
})

// Gets a selection of users
router.post('/get-selected', (req, res) => {
  const ids = req.body.ids
  const main = users.getMany(ids).then(users => {
    res.json({users})
  })
  handleBadReq(main, res)
})

// Set the authority level of a user
router.post('/:id/authorize/:authLevel', (req, res) => {
  const main = users.setAuthority(req.params.id, req.params.authLevel).then(() => {
    res.sendStatus(200)
  })
  handleBadReq(main, res)
})
