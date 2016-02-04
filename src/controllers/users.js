import * as express from 'express'

import * as users from '../models/users'

// Should be mounted under /users, all requests will assume this as a prefix
export const router = express.Router()

// Show all users
router.get('/all', (req, res) => {
  users.getAll().then(users => {
    res.json(users)
  }).catch(err => {
    res.status(400).send(err.toString())
  })
})
router.get('/all/:authLevel', (req, res) => {
  users.getAll(req.params.authLevel).then(users => {
    res.json(users)
  }).catch(err => {
    res.status(400).send(err.toString())
  })
})

// Get a sepecific user
router.get('/:id', (req, res) => {
  users.getById(req.params.id).then(user => {
    if (user) {
      res.json(user)
    } else {
      res.sendStatus(404)
    }
  }).catch(err => {
    res.status(400).json(err)
  })
})
