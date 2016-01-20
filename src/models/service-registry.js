const redis = require('redis')
const bluebird = require('bluebird')
const uuid = require('uuid')
const _ = require('lodash')

// Adds async to all redis methods, allowing for usage as a promise
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

var client

module.exports.setClient = function (redisClient) {
  client = redisClient
}

// Adds a new service instance
module.exports.add = function (name, serviceInstance) {
  const {ipAddr} = serviceInstance
  if (!ipAddr || !name) throw new Error('Required parameters missing: Need ipAddr')

  const id = uuid.v4()
  serviceInstance.id = id

  const serialized = JSON.stringify(serviceInstance)
  return client.saddAsync(`service:${name}`, serialized)
    .then(() => {
      return id
    })
}

// Gets an instance of a service
module.exports.get = function (name) {
  // Eventually do version checking here
  return client.srandmemberAsync(`service:${name}`)
}

// Gets all of the instances of a service
module.exports.getAll = function (name) {
  return client.smembersAsync(name)
    .then(members => {
      // Reserialize
      return _.map(members, JSON.parse)
    })
}

// Gets a specific instance of a service
module.exports.getById = function (name, id) {
  return module.exports.getAll(name)
    .then(members => {
      return _.filter(members, {'id': id})[0]
    })
}

// Removes an instance of a service
module.exports.remove = function (name, id) {
  return module.exports.getAll(name)
    .then(members => {
      const memberToRemove = _.filter(members, {'id': id})[0]
      const serialized = JSON.stringify(memberToRemove)

      return client.sremAsync(`service:${name}`, serialized)
    })
}

// Updates an instance of a service
module.exports.update = function (name, id, updated) {
  return module.exports.remove(name, id)
    .then(() => {
      updated.id = id
      const serialized = JSON.stringify(updated)
      return module.exports.add(`service:${name}`, serialized)
    })
}

// Authorizes a user to use a given service
module.exports.authorize = function (name, userId) {
  // Eventually use a more expressive model, like groups
  return client.saddAsyc(`service:${name}:authorized`, userId)
}

// Does the user have the authority to use said service?
module.exports.isAuthorized = function (name, userId) {
  return client.sismemberAsync(`service:${name}:authorized`, userId)
}

// Deauthorizes a user to use a given service
module.exports.ban = function (name, userId) {
  return client.spopAsync(`service:${name}:authorized`, userId)
}
