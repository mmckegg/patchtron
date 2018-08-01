const pull = require('pull-stream')
const extend = require('xtend')
const HLRU = require('hashlru')
var getRoot = require('../lib/get-root')

module.exports = function (ssb, config) {
  var cache = HLRU(100)

  return {
    roots: function ({id, limit, old, live, filterReplyAuthors}) {
      var included = new Set()
      return pull(
        ssb.createUserStream({id, reverse: true, limit, old, live}),

        LookupRoots(),

        // DON'T REPEAT THE SAME THREAD
        pull.filter(msg => {
          if (!included.has(msg.key) && !getRoot(msg)) {
            included.add(msg.key)
            return true
          }
        }),

        // ADD THREAD SUMMARY
        pull.asyncMap((item, cb) => {
          ssb.patchtron.thread.summary({
            dest: item.key,
            limit: 3,
            filterAuthors: filterReplyAuthors
          }, (err, summary) => {
            if (err) return cb(err)
            cb(null, extend(item, summary))
          })
        })
      )
    }
  }

  function LookupRoots () {
    return pull.asyncMap((msg, cb) => {
      let rootKey = getRoot(msg)
      if (!rootKey) {
        // already a root
        return cb(null, msg)
      }
      getThruCache(rootKey, (_, value) => {
        cb(null, value)
      })
    })
  }

  function getThruCache (key, cb) {
    if (cache.has(key)) {
      cb(null, cache.get(key))
    } else {
      // don't do an ooo lookup
      ssb.get({id: key, raw: true}, (_, value) => {
        var msg = {key, value}
        if (msg.value) {
          cache.set(key, msg)
        }
        cb(null, msg)
      })
    }
  }
}