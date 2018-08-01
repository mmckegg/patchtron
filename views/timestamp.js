const humanTime = require('human-time')
const getTimestamp = require('../lib/get-timestamp')

module.exports = function timestamp (msg, {i18n}) {
  var timestamp = getTimestamp(msg)
  return humanTime(new Date(timestamp)).replace(/minute/, 'min').replace(/second/, 'sec')
}
