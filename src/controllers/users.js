import * as express from 'express'

import * as users from '../models/users'

// Should be mounted under /users, all requests will assume this as a prefix
export const router = express.Router()

// Catches an error from a promise, sending a 400 status and printing the string
function handleBadReq (promise, res) {
  promise.catch(err => {
    res.status(400).send(err.toString())
  })
}

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
    if (user) {
      res.json(user)
    } else {
      res.sendStatus(404)
    }
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
