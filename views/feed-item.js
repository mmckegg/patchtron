const renderMessage = require('./message')
const { h } = require('mutant')

module.exports = function renderItem (msg, {connection, i18n}) {
  return h('FeedEvent', [
    renderMessage(msg, {connection, i18n}),
    msg.totalReplies > msg.latestReplies.length ? h('a.full', {href: msg.key}, ['View full thread' + ' (', msg.totalReplies, ')']) : null,
    h('div.replies', [
      msg.latestReplies.map(msg => renderMessage(msg, {connection, i18n}))
    ])
  ])
}
