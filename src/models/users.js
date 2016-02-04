import {default as Knex} from 'knex'

export {
  init, getById, getByGoogleId, insert, update, doesUserExist, getAll,
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

const USERS_TABLE = 'users'

// Create table (if it doesn't exist)
function buildUsers () {
  return knex.schema.createTableIfNotExists(USERS_TABLE, function (table) {
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
    table.int('authLevel').notNullable()
    table.timestamps()
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

// Get's a user by looking up thier database ID (much faster)
function getById (id) {
  return knex(USERS_TABLE).where('id', id)
}

// Get's a user by looking up their GOOGLE id
function getByGoogleId (id) {
  return knex(USERS_TABLE).where('authId', id)
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
      authLevel: level
    })
}

// Updates a user's profile information with new information
function update (user) {
  return knex(USERS_TABLE)
    .where('authId', user.authId)
    .update({
      profile: user.oauthProfile,
      name: user.displayName,
      email: user.email
    })
}

// Returns whether a user exists
function doesUserExist (id) {
  return getById(id)
    .then(user => !!user)
}

// Gets every single user that is registered
function getAll () {
  return knex(USERS_TABLE)
    .select('*')
}

// Sets the authority level of a user
// where authority = {'student', 'teacher', 'ta', 'admin'}
function setAuthority (id, level) {
  const levels = {
    'student': 0,
    'ta': 1,
    'teacher': 2,
    'admin': 3
  }
  const rawLevel = levels[level]
  if (!rawLevel) throw new Error(`Cannot set unknown authority level: ${level}`)

  return knex(USERS_TABLE)
    .where('id', id)
    .update('authLevel', rawLevel)
}
