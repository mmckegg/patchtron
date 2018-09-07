const renderFeed = require('../views/feed')
const extend = require('xtend')
const {h} = require('mutant')
const image = require('../views/image')
const person = require('../views/person')
const renderItem = require('../views/feed-item')

module.exports = function ProfilePage (id, {i18n, connection, navigate}) {
  var prepend = h('header', {className: 'ProfileHeader'}, [
    h('div.image', image(id, {connection, i18n})),
    h('div.main', [
      h('div.title', [
        h('h1', [person(id, {connection, i18n})]),
        h('div.meta', [

        ])
      ]),
      h('section -publicKey', [
        h('pre', {title: i18n('Public key for this profile')}, id)
      ])
    ])
  ])

  let getStream = connection.pullResume((sbot, opts) => {
    return sbot.patchtron.profile.roots(extend(opts, {
      id, filterReplyAuthors: [id]
    }))
  }, {limit: 20, reverse: true})

  return renderFeed({connection, i18n, prepend, renderItem, getStream})
}
