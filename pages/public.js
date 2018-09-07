const renderFeed = require('../views/feed')
const renderItem = require('../views/feed-item')

module.exports = function (href, {i18n, connection, navigate}) {
  let getStream = connection.pullResume((sbot, opts) => {
    return sbot.patchtron.publicFeed.roots(opts)
  }, {limit: 20, reverse: true})

  return renderFeed({connection, i18n, renderItem, getStream})
}
