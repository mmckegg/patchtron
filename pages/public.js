const renderFeed = require('../views/feed')
const renderItem = require('../views/feed-item')

module.exports = function (href, {i18n, connection, navigate}) {
  return renderFeed(connection.pull((sbot, opts) => {
    return sbot['patchtron'].roots(opts)
  }), {connection, i18n, renderItem})
}
