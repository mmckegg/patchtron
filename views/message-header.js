const image = require('./image')
const person = require('./person')
const timestamp = require('./timestamp')
const { h } = require('mutant')

module.exports = function renderMessageHeader (msg, {connection, i18n, priority, replyInfo, meta}) {
  var yourId = connection.id
  var additionalMeta = []
  if (priority === 2) {
    additionalMeta.push(h('span.flag -new', {title: i18n('New Message')}))
  } else if (priority === 1) {
    additionalMeta.push(h('span.flag -unread', {title: i18n('Unread Message')}))
  }

  return h('header', [
    h('div.main', [
      h('a.avatar', {href: `${msg.value.author}`}, [
        image(msg.value.author, {connection, i18n})
      ]),
      h('div.main', [
        h('div.name', [
          person(msg.value.author, {connection, i18n}),
          msg.value.author === yourId ? [' ', h('span.you', {}, i18n('(you)'))] : null
        ]),
        h('div.meta', [
          h('a', {href: msg.key}, [timestamp(msg, {i18n})]), ' ',
          replyInfo
        ])
      ])
    ]),
    h('div.meta', [
      meta, additionalMeta
    ])
  ])
}
