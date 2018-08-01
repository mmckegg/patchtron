const messageHeader = require('./message-header')
const markdown = require('./markdown')
const likes = require('./likes')
const actions = require('./actions')
const { h } = require('mutant')

module.exports = function renderMessage (msg, {connection, i18n}) {
  return h('Message', {
    attributes: {'data-id': msg.key}
  }, [
    messageHeader(msg, {
      connection,
      i18n,
      meta: meta(msg, {connection, i18n})
    }),
    h('section', [
      markdown(msg.value.content, {connection})
    ]),
    h('footer', [
      h('div.actions', [
        actions(msg, {connection, i18n})
      ])
    ])
  ])
}

function meta (msg, {connection, i18n}) {
  var result = []
  result.push(likes(msg, {connection, i18n}))
  const { channel } = msg.value.content
  if (channel && msg.value.content.type !== 'channel') {
    result.push(h('a.channel', {href: `#${channel}`}, [`#${channel}`]))
  }
  return result
}
