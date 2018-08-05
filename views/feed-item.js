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

  // explain why this message is in your feed
  if (mostRecentBumpType !== 'matches-channel' && msg.rootBump && msg.rootBump.type === 'matches-channel') {
    // the root post was in a channel that you subscribe to
    meta = h('div.meta', [
      many(msg.rootBump.channels, {renderItem: channel, i18n}), ' ', i18n('mentioned in your network')
    ])
  } else if (bumps && bumps.length) {
    let authors = getAuthors(bumps)
    if (mostRecentBumpType === 'matches-channel') {
      // a reply to this post matches a channel you subscribe to
      let channels = new Set()
      bumps.forEach(bump => bump.channels && bump.channels.forEach(c => channels.add(c)))
      meta = h('div.meta', [
        i18n.plural('%s people from your network replied to this message on ', authors.length),
        many(channels, {
          i18n, renderItem: channel
        })
      ])
    } else {
      // someone you follow replied to this message
      var description = i18n(bumpMessages[mostRecentBumpType] || 'added changes')
      meta = h('div.meta', [
        many(authors, {
          i18n,
          renderItem: author => person(author, {connection})
        }), ' ', description
      ])
    }
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

function channel (id) {
  return h('a.channel', {href: `#${id}`}, `#${id}`)
}
