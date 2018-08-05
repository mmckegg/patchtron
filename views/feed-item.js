const renderMessage = require('./message')
const person = require('./person')
const many = require('./many')
const { h } = require('mutant')

var bumpMessages = {
  'reaction': 'liked this message',
  'reply': 'replied to this message',
  'updated': 'added changes',
  'mention': 'mentioned you',
  'channel-mention': 'mentioned this channel',
  'attending': 'can attend'
}

module.exports = function renderItem (msg, {connection, i18n}) {
  let mostRecentBumpType = (msg.bumps && msg.bumps[0] && msg.bumps[0].type) || 'reply'
  let bumps = getBumps(msg)[mostRecentBumpType]

  var meta = null

  if (bumps && bumps.length) {
    var description = i18n(bumpMessages[mostRecentBumpType] || 'added changes')
    meta = h('div.meta', [
      many(getAuthors(bumps), {
        i18n,
        renderItem: author => person(author, {connection})
      }), ' ', description
    ])
  }

  return h('FeedEvent -post', [
    meta,
    renderMessage(msg, {connection, i18n}),
    msg.totalReplies > msg.latestReplies.length ? h('a.full', {href: msg.key}, ['View full thread' + ' (', msg.totalReplies, ')']) : null,
    h('div.replies', [
      msg.latestReplies.map(msg => renderMessage(msg, {connection, i18n}))
    ])
  ])
}

function getBumps (msg) {
  var bumps = {}
  if (Array.isArray(msg.bumps)) {
    msg.bumps.forEach(bump => {
      let type = bump.type || 'reply'
      bumps[type] = bumps[type] || []
      bumps[type].push(bump)
    })
  }
  return bumps
}

function getAuthors (items) {
  var authors = {}
  items.forEach(item => {
    authors[item.author] = true
  })
  return Object.keys(authors)
}
