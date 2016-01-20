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

module.exports.getById = function (id) {
  return redisClient.getAsync(`user:${id}`)
    .then(serialUser => JSON.parse(serialUser))
}

module.exports.insert = function (id, user) {
  return redisClient.setAsync(`user:${id}`, JSON.stringify(user))
    .then(() => user)
}

module.exports.update = function (user) {
  redisClient.hmset(userKey(user), user)
  return user
}

module.exports.doesUserExist = function (id) {
  return redisClient.existsAsync(`user:${id}`)
}

module.exports.getAll = function () {
  // return db.execute('select id,email,displayName,isAdmin from users');
}
