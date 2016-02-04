import {default as Knex} from 'knex'
import {default as _} from 'lodash'

export {
  init, getById, getByAuthId, insert, update, doesUserExist, getAll,
  setAuthority
}

const DB_PASSWORD = process.env.DB_PASSWORD
if (!DB_PASSWORD) {
  console.log(process.env.DB_PASSWORD)
  throw new Error('DB_PASSWORD env variable not set!')
}

// Initialze connection to the database
const knex = Knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'postgres',
    password: DB_PASSWORD,
    database: 'users'
  }
})

// Used for better aliases when doing level filtering
export const authLevels = {
  'student': 0,
  'ta': 1,
  'teacher': 2,
  'admin': 3
}

const USERS_TABLE = 'users'

// Create table (if it doesn't exist)
function buildUsers () {
  return knex.schema.hasTable('users').then(exists => {
    if (!exists) {
      return knex.schema.createTable(USERS_TABLE, function (table) {
        console.log('Users table does not exist, building...')
        table.increments('id') // Creates auto-incrementing ID
        table.string('name').notNullable()
        table.string('authId').unique().notNullable()
        table.string('email').notNullable()
        table.text('profile') // This is just the serialized text that we get back from google
        // This represents how much authority the user has
        // 0 -> Student
        // 1 -> TA
        // 2 -> Teacher
        // 3 -> Administrator
        table.integer('authLevel').notNullable()
        table.timestamps()
      })
    }
  })
}

// Acutally builds the tables if needed
function init () {
  return buildUsers()
    .catch(err => {
      console.log('Uh oh, encountered db error!')
      console.log(err)
      throw err
    })
}

// Helper function for getting JSON of users back
function deserialize (user) {
  const parsed = JSON.parse(user.profile)
  user.profile = parsed
  return user
}

// Get's a user by looking up thier database ID (maybe faster)
function getById (id) {
  return knex(USERS_TABLE)
    .where('id', id)
    .then(users => {
      if (users.length === 0) return null
      else return deserialize(users[0])
    })
}

// Get's a user by looking up their GOOGLE id
function getByAuthId (id) {
  return knex(USERS_TABLE)
    .where('authId', id)
    .then(users => {
      if (users.length === 0) return null
      else return deserialize(users[0])
    })
}

// Adds a user with the specified GOOGLE id
// Optionally set their authorization level (defaults to student)
function insert (id, user, level = 0) {
  return knex(USERS_TABLE)
    .insert({
      authId: id,
      profile: user.oauthProfile, // deserialize the json
      name: user.displayName,
      email: user.email,
      authLevel: level,
      created_at: new Date()
    }, 'id').then(([id]) => getById(id))
}

// Updates a user's profile information with new information
function update (user) {
  return knex(USERS_TABLE)
    .where('authId', user.authId)
    .update({
      profile: user.oauthProfile,
      name: user.displayName,
      email: user.email,
      updated_at: new Date()
    }, 'id').then(([id]) => getById(id))
}

// Returns whether a user exists
function doesUserExist (id) {
  return getById(id)
    .then(user => !!user)
}

// Gets every single user that is registered
// Optionally filters by authorization level
function getAll (level) {
  let users = knex(USERS_TABLE)
    .select(['id', 'authId', 'name', 'email'])

  try {
    if (level) {
      level = _.isString(level) ? lookUpLevel(level) : level
      users.where('authLevel', level)
    }
    return users
  } catch (err) { return Promise.reject(err) }
}

function lookUpLevel (level) {
  let result = authLevels[level]
  if (result === undefined) throw new Error(`Authority level undefined: ${level}`)

  return result
}

// Sets the authority level of a user
// where authority = {'student', 'teacher', 'ta', 'admin'}
function setAuthority (id, level) {
  const rawLevel = authLevels[level]
  if (!rawLevel) throw new Error(`Cannot set unknown authority level: ${level}`)

  return knex(USERS_TABLE)
    .where('id', id)
    .update('authLevel', rawLevel)
}
