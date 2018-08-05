const { h, Value, when, Proxy, computed } = require('mutant')
const Scroller = require('../lib/scroller')
const pull = require('pull-stream')

module.exports = function renderFeed ({connection, i18n, prepend, renderItem, getStream}) {
  var done = Value(false)
  var error = Value(null)
  var loading = Proxy(true)
  var seen = new Set()

  var content = h('section.content')
  var container = h('Scroller', {
    style: { overflow: 'auto' }
  }, [
    h('div.wrapper', [
      h('section.prepend', prepend),
      when(error, computed(error, renderError)),
      content,
      when(loading, h('Loading -large'))
    ])
  ])

  var scroller = Scroller(container, content, (msg) => renderItem(msg, {connection, i18n}), {
    onDone: (err) => {
      if (err) error.set(err)
      done.set(true)
    },
    onItemVisible: (item) => {}
  })

  loading.set(computed([done, scroller.queue], (done, queue) => {
    return !done && queue < 5
  }))

  pull(
    getStream(),
    pull.filter(msg => {
      // only render posts
      if (!msg.value || msg.value.content.type !== 'post') return

      // only render a post the first time we see it (duplicates because of resume)
      if (!seen.has(msg.key)) {
        seen.add(msg.key)
        return true
      }
    }),
    // GroupWhile((result, msg) => result.length < 20),
    // pull.flatten(),
    scroller
  )

  container.done = done

  return container
}

function renderError (err) {
  if (err) {
    return h('ErrorMessage', [
      h('h1', '⚠️ An error occurred'),
      h('pre', err.stack)
    ])
  }
}
