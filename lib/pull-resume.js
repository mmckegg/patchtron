const pull = require('pull-stream')
const pullCat = require('pull-cat')
const Next = require('pull-next')
const extend = require('xtend')

module.exports = {
  source: function (stream, {getResume, limit, filterMap}) {
    if (limit) {
      let marker = {marker: true}
      let count = 0
      return pullCat([
        pull(
          stream,
          pull.through(msg => {
            if (!msg.sync) {
              marker.resume = getResume(msg)
            }
          }),
          filterMap,
          pull.take(limit),
          pull.through(() => {
            count += 1
          })
        ),

        pull(
          // send truncated marker for resuming search
          pull.values([marker]),
  
          // don't emit the resume if we're at the end of the stream
          pull.filter(() => count === limit)
        )
      ])
    } else {
      return pull(
        stream,
        filterMap
      )
    }
  },
  remote: function (getStream, opts) {
    var started = false
    var lastMessage = null

    return Next(function () {
      if (started && (!lastMessage || lastMessage.resume == null)) return
      started = true

      let subOpts = extend(opts, {
        resume: (lastMessage && lastMessage.resume) || undefined
      })

      lastMessage = null

      return pull(
        getStream(subOpts),
        pull.through(function (msg) {
          lastMessage = msg
        })
      )
    })
  }
}