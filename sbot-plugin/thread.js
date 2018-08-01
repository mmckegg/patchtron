var pull = require('pull-stream')
var getRoot = require('../lib/get-root')

module.exports = function (ssb, config) {
  return {
    read,
    summary: function ({dest, limit = 3, filterAuthors}, cb) {
      var authors = {}
      var totalReplies = 0
      var latestReplies = []
      pull(
        read({reverse: true, live: false, dest}),
        pull.drain(msg => {
          if (!filterAuthors || filterAuthors.includes(msg.value.author)) {
            if (totalReplies < limit) {
              latestReplies.unshift(msg)
            }
          }
          authors[msg.value.author] = true
          totalReplies += 1
        }, (err) => {
          if (err) return cb(err)
          cb(null, {
            authors: Object.keys(authors),
            totalReplies,
            latestReplies
          })
        })
      )
    }
  }

  function read ({reverse = false, limit, live, old, dest}) {
    // TODO: properly handle truncation
    return pull(
      ssb.backlinks.read({
        reverse,
        live,
        index: 'DTA',
        query: [{$filter: { dest }}]
      }),
      pull.filter(msg => {
        if (msg.sync) return msg
        var type = msg.value.content.type
        var root = getRoot(msg)
        return root === dest && (type === 'post' || type === 'about')
      }),
      limit ? pull.limit(limit) : pull.through()
    )
  }
}