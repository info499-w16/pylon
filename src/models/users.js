const redis = require('redis')
const bluebird = require('bluebird')

// Adds async to all redis methods, allowing for usage as a promise
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

var redisClient

function userKey ({authId}) {
  return `user:${authId}`
}

// This should be called before doing any redis related things
module.exports.initializeRedis = function (redisOptions) {
  redisClient = redis.createClient(redisOptions)
}

function deserializeOauthProfile (record) {
  if (!record) {
    return null
  }

  if (record.oauthProfileJson) {
    record.oauthProfile = JSON.parse(record.oauthProfileJson)
  }
  delete record.oauthProfileJson
  return record
}

module.exports.getById = function (id) {
<<<<<<< HEAD
  redisClient.hgetallAsync(id).then(deserializeOauthProfile)
=======
  redisClient.hgetall(id).then(deserializeOauthProfile)
>>>>>>> f338847cdbd19f5670b4dc9ef28c332ca138269f
}

module.exports.getByProviderId = function (authProvider, authId) {
  // var sql = 'select * from users where authProvider=? and authId=?'
  // var params = [authProvider, authId]
  // return db.selectOne(sql, params).then(deserializeOauthProfile)
}

module.exports.insert = function (user) {
  // var sql = 'insert into users (authProvider,authId,email,passhash,displayName,oauthProfileJson) values (?,?,?,?,?,?)'
  // var params = [
  //   user.authProvider
  //   user.authId
  //   user.email
  //   user.passhash
  //   user.displayName
  //   user.oauthProfile ? JSON.stringify(user.oauthProfile) : null
  // ];
  // return db.execute(sql, params)
  //   .then(function(results) {
  //     user.id = results.insertId;
  //     return user;
  //   });
<<<<<<< HEAD
  return redisClient.hmsetAsync(userKey(user), user)
=======
  return redisClient.hmset(userKey(user), user)
>>>>>>> f338847cdbd19f5670b4dc9ef28c332ca138269f
}

module.exports.update = function (user) {
  redisClient.hmset(userKey(user), user)
  return user
}

module.exports.doesUserExist = function (authProvider, authId) {
  // var sql = 'select count(*) as numUsers from users where authProvider=? and authId=?';
  // var params = [authProvider, authId];
  // return db.selectOne(sql, params)
  //     .then(function(row) {
  //         return row.numUsers != 0;
  //     });
<<<<<<< HEAD
  return redisClient.existsAsync(`user:${authId}`)
=======
  redisClient.exists(`user:${authId}`, (err, reply) {
    if (err) throw err

    return reply
  })
>>>>>>> f338847cdbd19f5670b4dc9ef28c332ca138269f
}

module.exports.getAll = function () {
  // return db.execute('select id,email,displayName,isAdmin from users');
}
