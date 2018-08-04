const { h, Value, when, Proxy, computed } = require('mutant')
const Scroller = require('../lib/scroller')
const pull = require('pull-stream')
const pullChunk = require('../lib/pull-chunk')

module.exports = function renderFeed (getStream, {connection, i18n, prepend, renderItem}) {
  var done = Value(false)
  var loading = Proxy(true)

  var content = h('section.content')
  var container = h('Scroller', {
    style: { overflow: 'auto' }
  }, [
    h('div.wrapper', [
      h('section.prepend', prepend),
      content,
      when(loading, h('Loading -large'))
    ])
  ])

  var scroller = Scroller(container, content, (msg) => renderItem(msg, {connection, i18n}), {
    onDone: () => done.set(true),
    onItemVisible: (item) => {}
  })

  loading.set(computed([done, scroller.queue], (done, queue) => {
    return !done && queue < 5
  }))

  pull(
    pullChunk(getStream, {reverse: true, limit: 200}),
    pull.filter(msg => msg.value && msg.value.content.type === 'post'),
    // GroupWhile((result, msg) => result.length < 20),
    // pull.flatten(),
    scroller
  )

  container.done = done

  return container
}
