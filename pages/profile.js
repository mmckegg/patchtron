const renderFeed = require('../views/feed')
const extend = require('xtend')
const {h} = require('mutant')
const image = require('../views/image')
const person = require('../views/person')

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

  return renderFeed(connection.pull((sbot, opts) => {
    return sbot.patchtron.profile.roots(extend(opts, {
      id,
      filterReplyAuthors: [id]
    }))
  }), {connection, i18n, prepend})
}