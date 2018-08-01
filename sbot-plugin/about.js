var pull = require('pull-stream')

module.exports = function (ssb, config) {
  return {
    read,
    socialValue: function ({key, dest}, cb) {
      socialValues({key, dest}, (err, values) => {
        if (err) return cb(err)
        if (values[ssb.id]) {
          // you assigned a value, use this!
          cb(null, values[ssb.id])
        } else if (values[dest]) {
          // they assigned a name, use this!
          cb(null, values[dest])
        } else {
          // TODO: choose a value from selection based on most common
          cb(null, null)
        }
      })
    },
    socialValues
  }

  function socialValues ({key, dest}, cb) {
    var values = {}
    pull(
      read({dest}),
      pull.drain(msg => {
        if (msg.value.content[key]) {
          values[msg.value.author] = msg.value.content[key]
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
          value: {content: {type: 'about', about: dest}}
        }}]
      })
    )
  }
}
