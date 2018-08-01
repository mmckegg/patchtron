var pull = require('pull-stream')

module.exports = function (ssb, config) {
  return {
    read,
    counts: function ({dest}, cb) {
      current({dest}, (err, values) => {
        if (err) return cb(err)
        var result = {
          total: Object.keys(values).length,
          expressionCounts: {}
        }
        Object.keys(values).forEach(key => {
          let value = values[key]
          result.expressionCounts[value] = (result.expressionCounts[value] || 0) + 1
        })
        cb(null, result)
      })
    },
    current
  }

  function current ({dest}, cb) {
    var values = {}
    pull(
      read({dest}),
      pull.drain(msg => {
        let author = msg.value.author
        let vote = msg.value.content.vote
        if (vote) {
          if (vote.value > 0) {
            values[author] = String(vote.expression || 'Like')
          } else {
            delete values[author]
          }
        }
      }, (err) => {
        if (err) return cb(err)
        cb(null, values)
      })
    )
  }

  function read ({reverse = false, limit, live, old, dest}) {
    return pull(
      ssb.backlinks.read({
        reverse,
        live,
        limit,
        query: [{$filter: {
          dest,
          value: {content: {type: 'vote', vote: {link: dest}}}
        }}]
      })
    )
  }
}
