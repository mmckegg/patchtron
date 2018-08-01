var like = require('./like')
var reply = require('./reply')

module.exports = function actions (msg, {connection, i18n}) {
  return [
    like(msg, {connection, i18n}),
    reply(msg, {connection, i18n})
  ]
}
