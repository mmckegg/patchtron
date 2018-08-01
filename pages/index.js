var mainPages = {
  '/public': require('./public'),
  '/private': require('./private'),
  '/mentions': require('./mentions')
}

var ThreadPage = require('./thread')
var ProfilePage = require('./profile')

module.exports = function renderPage (href, opts, cb) {
  console.log('rendering', href)
  if (mainPages[href]) {
    return cb(null, mainPages[href](href, opts))
  } else if (href.startsWith('%')) {
    return cb(null, ThreadPage(href, opts))
  } else if (href.startsWith('@')) {
    return cb(null, ProfilePage(href, opts))
  }
  cb(null, false)
}
