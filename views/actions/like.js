const { h } = require('mutant')

module.exports = function renderLikeAction (msg, {connection, i18n}) {
  var result = h('a.like', {
    href: '#',
    state: {
      dest: msg.key,
      connection,
      i18n
    }
  }, i18n('Like'))

  result.addEventListener('click', handleClick)
  result.update = updateSelf
  result.update()
  return result
}

function updateSelf () {
  let element = this
  let {dest, connection, i18n} = element.state
  connection.obtain(sbot => {
    sbot['patchtron'].likes.current({dest}, (err, values) => {
      if (err) return
      if (values[connection.id]) {
        element.className = 'unlike'
        element.innerText = i18n('Unlike')
      } else {
        element.className = 'like'
        element.innerText = i18n('Like')
      }
    })
  })
}

function handleClick (ev) {
  let element = this
  let {dest, connection} = element.state

  let vote = element.classList.contains('like')
    ? { link: dest, value: 1, expression: 'Like' }
    : { link: dest, value: 0, expression: 'Unlike' }

  connection.publish({ type: 'vote', vote })
}
