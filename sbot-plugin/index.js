
var Roots = require('./roots')
var Thread = require('./thread')
var About = require('./about')
var Likes = require('./likes')
var Profile = require('./profile')

var pull = require('pull-stream')
var Subscriptions = require('./subscriptions')

exports.name = 'patchtron'
exports.version = require('../package.json').version
exports.manifest = {
  roots: 'source',
  profile: {
    roots: 'source'
  },
  thread: {
    read: 'source'
  },
  about: {
    read: 'source',
    socialValue: 'async',
    socialValues: 'async'
  },
  likes: {
    read: 'source',
    current: 'async',
    counts: 'async'
  },
  getSubscriptions: 'async'
}

exports.init = function (ssb, config) {
  var roots = Roots(ssb, config)
  var thread = Thread(ssb, config)
  var subscriptions = Subscriptions(ssb, config)
  var about = About(ssb, config)
  var likes = Likes(ssb, config)
  var profile = Profile(ssb, config)

  // prioritize pubs that we actually follow
  pull(
    ssb.friends.createFriendStream({hops: 1, live: false}),
    pull.collect((err, contacts) => {
      if (!err) {
        ssb.gossip.peers().forEach(function (peer) {
          if (contacts.includes(peer.key)) {
            ssb.gossip.add(peer, 'friends')
          }
        })
      }
    })
  )

  return {
    roots: roots.read,
    thread,
    about,
    likes,
    profile,
    getSubscriptions: subscriptions.get
  }
}
