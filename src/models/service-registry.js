const redis = require('redis')
const bluebird = require('bluebird')
const _ = require('lodash')

// Sets how often a service needs to update itself
const TTL = process.env.TTL || 40

// Adds async to all redis methods, allowing for usage as a promise
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

var client

module.exports.setClient = function (redisClient) {
  client = redisClient
}

// Adds a new service instance
module.exports.add = function (serviceInstance) {
  const {ipAddr, id, name} = serviceInstance
  if (!id || !ipAddr || !name) throw new Error('Required parameters missing: Need ipAddr name and id')

  const serialized = JSON.stringify(serviceInstance)
  const key = `service:${name}:${id}`
  return client.setAsync(key, serialized)
    .then(client.expireAsync(key, TTL))
    .then(() => {
      return id
    })
}

// Gets an instance of a service
module.exports.get = function (name) {
  // Note that if we have multiple versions of a service, this will just give
  // back random ones, with no real prefernce. Should find a way to do real load
  // balancing
  return module.exports.getAll(instances => {
    return _(instances).shuffle().value()[0]
  })
}

// Gets all of the instances of a service
module.exports.getAll = function (name) {
  // Note that this uses the KEYS command, which is inneficient. We should
  // find a more efficient way to do grouping in the future
  return client.keysAsync(`service:${name}:*`)
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
  return client.delAsync(`service:${name}:${id}`)
}

// Updates an instance of a service
// module.exports.update = function (name, id, updated) {
//   return module.exports.remove(name, id)
//     .then(() => {
//       updated.id = id
//       const serialized = JSON.stringify(updated)
//       return module.exports.add(`service:${name}`, serialized)
//     })
// }

// Authorizes a user to use a given service
module.exports.authorize = function (name, userId) {
  // Eventually use a more expressive model, like groups
  return client.saddAsync(`service:${name}:authorized`, userId)
}

// Does the user have the authority to use said service?
module.exports.isAuthorized = function (name, userId) {
  return client.sismemberAsync(`service:${name}:authorized`, userId)
}

// Deauthorizes a user to use a given service
module.exports.ban = function (name, userId) {
  return client.spopAsync(`service:${name}:authorized`, userId)
}
