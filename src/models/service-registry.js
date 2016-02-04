const redis = require('redis')
const bluebird = require('bluebird')
const _ = require('lodash')
const semver = require('semver')

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
  const {ipAddr, id, name, version} = serviceInstance
  if (!id || !ipAddr || !name || !version) throw new Error('Required parameters missing: Need ipAddr, version, name and id')

  const serialized = JSON.stringify(serviceInstance)
  const key = `service:${name}:${id}`
  return client.setAsync(key, serialized)
    .then(client.expireAsync(key, TTL))
    .then(() => {
      return id
    })
}

// Gets an instance of a service that satisfies provided version constraint
module.exports.get = function (name, version) {
  // Note that if we have multiple versions of a service, this will just give
  // back random ones, with no real preference. Should find a way to do real load
  // balancing
  return module.exports.getAll(name, version)
    .then(instances => {
      return _(instances).shuffle().value()[0]
    })
}

// Gets all of the instances of a service, optionally filtering by the
// supplied version using the same technique NPM uses for handling packges
module.exports.getAll = function (name, versionQ) {
  // Note that this uses the KEYS command, which is inneficient. We should
  // find a more efficient way to do grouping in the future
  console.log(`service:${name}:*`)
  return client.keysAsync(`service:${name}:*`)
    .then(keys => {
      if (keys.length === 0) {
        throw new Error(`Service ${name} not registered`)
      }

      return client.mgetAsync(keys)
    }).then(members => {
      // Reserialize
      const instances = _.map(members, JSON.parse)
      if (versionQ) {
        return _.filter(instances, ({version}) => {
          return semver.satisfies(version, `^${versionQ}`)
        })
      }
      return instances
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
