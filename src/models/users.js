const redis = require('redis')
const bluebird = require('bluebird')

// Adds async to all redis methods, allowing for usage as a promise
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

var redisClient

function userKey ({id}) {
  return `user:${id}`
}

// This should be called before doing any redis related things
module.exports.initializeRedis = function (redisOptions) {
  redisClient = redis.createClient(redisOptions)
  return redisClient
}

// Performs a lookup, and if the user doesn't exist, adds them
module.exports.createOrLookup = function (profile) {
  const {id} = profile
  return module.exports.doesUserExist(id)
    .then(exists => {
      if (exists) return module.exports.getById(id)
      else {
        return module.exports.insert(id, {
          name: profile.displayName,
          gender: profile.gender,
          email: profile.emails[0].value
        })
      }
    })
}

module.exports.getById = function (id) {
  return redisClient.hgetallAsync(`user:${id}`)
}

module.exports.insert = function (id, user) {
  return redisClient.hmsetAsync(`user:${id}`, user)
}

module.exports.update = function (user) {
  redisClient.hmset(userKey(user), user)
  return user
}

module.exports.doesUserExist = function (authId) {
  return redisClient.existsAsync(`user:${authId}`)
}

module.exports.getAll = function () {
  // return db.execute('select id,email,displayName,isAdmin from users');
}
