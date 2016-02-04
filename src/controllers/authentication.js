const users = require('../models/users')

module.exports.serializeUser = function (user, done) {
  return done(null, user.authId)
}

module.exports.deserializeUser = function (id, done) {
  users.getByAuthId(id)
    .then(done.bind(null, null))
    .catch(done)
}

module.exports.ensureAuth = function (signinUrl) {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    } else {
      req.session.afterAuthRedirectTo = req.baseUrl + req.url
      res.redirect(signinUrl)
    }
  }
}

module.exports.backToRequestedUrl = function (req, res, next) {
  if (req.session.afterAuthRedirectTo) {
    var url = req.session.afterAuthRedirectTo
    delete req.session.afterAuthRedirectTo
  } else {
    url = '/home'
  }
  res.redirect(url)
}
