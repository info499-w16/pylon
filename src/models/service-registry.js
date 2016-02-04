import * as redis from 'redis'
import * as bluebird from 'bluebird'
import * as _ from 'lodash'
import * as semver from 'semver'

// Just export all of our functions
export {
  setStore, add, get, getAll, getById, remove, authorize,
  isAuthorized, ban
}

// Sets how often a service needs to update itself
const TTL = process.env.TTL || 40

// Adds async to all redis methods, allowing for usage as a promise
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

// Used to store the client when accessing other methods
let client

// Sets the connection to redis. We don't initialize a new store because
// we want to just keep everything in a single store, since there's so little
// information that we need to keep around.
function setStore (redisClient) { client = redisClient }

// Adds a new service instance
function add (serviceInstance) {
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
function get (name, version) {
  // Note that if we have multiple versions of a service, this will just give
  // back random ones, with no real preference. Should find a way to do real load
  // balancing
  return getAll(name, version)
    .then(instances => {
      return _(instances).shuffle().value()[0]
    })
}

// Gets all of the instances of a service, optionally filtering by the
// supplied version using the same technique NPM uses for handling packges
function getAll (name, versionQ) {
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
function getById (name, id) {
  return getAll(name)
    .then(members => {
      return _.filter(members, {'id': id})[0]
    })
}

// Removes an instance of a service
function remove (name, id) {
  return client.delAsync(`service:${name}:${id}`)
}

// Authorizes a user to use a given service
function authorize (name, userId) {
  // Eventually use a more expressive model, like groups
  return client.saddAsync(`service:${name}:authorized`, userId)
}

// Does the user have the authority to use said service?
function isAuthorized (name, userId) {
  return client.sismemberAsync(`service:${name}:authorized`, userId)
}

// Deauthorizes a user to use a given service
function ban (name, userId) {
  return client.spopAsync(`service:${name}:authorized`, userId)
}
