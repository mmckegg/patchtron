const { h, Value, when, Proxy, computed } = require('mutant')
const Scroller = require('../lib/scroller')
const renderMessage = require('../views/message')
const pull = require('pull-stream')

module.exports = function renderThread (id, {connection, i18n}) {
  var done = Value(false)
  var loading = Proxy(false)
  var content = h('section.content')
  var container = h('Scroller', {
    style: { overflow: 'auto' }
  }, [
    h('div.wrapper', [
      content,
      when(loading, h('Loading -large'))
    ])
  ])

  connection.get(id, (err, value) => {
    if (err) return
    content.prepend(renderMessage({key: id, value}, {connection, i18n}))
  })

  var scroller = Scroller(container, content, (msg) => {
    return renderMessage(msg, {connection, i18n})
  }, {
    onDone: () => done.set(true),
    onItemVisible: (item) => {}
  })

  loading.set(computed([done, scroller.queue], (done, queue) => {
    return !done && queue < 5
  }))

  var pullThread = connection.pull((sbot, opts) => {
    return sbot.patchtron.thread.read(opts)
  })

  pull(
    pullThread({dest: id}),
    pull.through(msg => console.log(msg)),
    // GroupWhile((result, msg) => result.length < 20),
    // pull.flatten(),
    scroller
  )

  container.done = done

  return container
}
