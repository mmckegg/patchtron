const { h } = require('mutant')

module.exports = function renderLikeAction (msg, {connection, i18n}) {
  var result = h('a.reply', {
    state: {
      dest: msg.key,
      connection,
      i18n
    }
  }, i18n('Reply'))

  result.addEventListener('click', handleClick)
  result.update = updateSelf
  result.update()
  return result
}

function updateSelf () {
  // let element = this
  // let {dest, connection, i18n} = element.state
}

function handleClick (ev) {
  // let element = this
  // let {dest, connection} = element.state
}
