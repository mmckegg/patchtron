const pull = require('pull-stream')
const extend = require('extend')

module.exports = function (dest, {recentLimit = 3, bumpFilter, recentFilter, readThread}, cb) {
  var bumps = []
  var totalReplies = 0
  var latestReplies = []
  return pull(
    readThread({reverse: true, live: false, dest}),
    pull.drain(msg => {
      try {
        // bump filter can return values other than true that will be passed to view
        if (msg && msg.value && msg.value.content) {
          let type = msg.value.content.type

          let bump = !bumpFilter || bumpFilter(msg)
          if (bump) {
            if (latestReplies.length < recentLimit && (!recentFilter || recentFilter(msg))) {
              // collect the most recent bump messages
              latestReplies.unshift(msg)
            }

            // summarize all bumps, extend with result of bumpFilter
            bumps.push(extend({
              id: msg.key, author: msg.value.author
            }, bump instanceof Object ? bump : {}))
          }

          if (type !== 'vote') {
            totalReplies += 1
          }
        }
      } catch (ex) {
        cb(ex)
      }
    }, (err) => {
      if (err) return cb(err)
      cb(null, {
        bumps,
        totalReplies,
        latestReplies
      })
    })
  )
}
