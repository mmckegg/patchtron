const pull = require('pull-stream')
const extend = require('xtend')
const HLRU = require('hashlru')
const LookupRoots = require('../lib/lookup-roots')
const UniqueRoots = require('../lib/unique-roots')
const getRoot = require('../lib/get-root')
const threadSummary = require('../lib/thread-summary')

module.exports = function (ssb, config) {
  var cache = HLRU(100)

  return {
    roots: function ({id, limit, old, live, filterReplyAuthors}) {
      return pull(
        ssb.createUserStream({id, reverse: true, limit, old, live}),

        LookupRoots({ssb, cache}),

        // DON'T REPEAT THE SAME THREAD
        UniqueRoots(),

        // DON'T INCLUDE UN-ROOTED MESSAGES (e.g. missing conversation root)
        pull.filter(msg => {
          return !getRoot(msg.root)
        }),

        // JUST RETURN THE ROOT OF THE MESSAGE
        pull.map(msg => {
          return msg.root || msg
        }),

        // ADD THREAD SUMMARY
        pull.asyncMap((item, cb) => {
          threadSummary(item.key, {
            readThread: ssb.patchtron.thread.read,
            recentLimit: 3,
            bumpFilter,
            recentFilter
          }, (err, summary) => {
            if (err) return cb(err)
            cb(null, extend(item, summary))
          })
        })
      )

      function recentFilter (msg) {
        let content = msg.value.content
        let type = content.type
        return type !== 'vote'
      }

      function bumpFilter (msg) {
        // match summary bumps to actual bumps
        if (msg.value.author === ssb.id) {
          let content = msg.value.content
          let type = content.type
          if (type === 'vote') {
            let vote = content.vote
            if (vote) {
              return {type: 'reaction', reaction: vote.expression, value: vote.value}
            }
          } else if (type === 'post') {
            return {type: 'reply'}
          } else if (type === 'about') {
            return {type: 'update'}
          }
        }
      }
    }
  }
}
