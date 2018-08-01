const { h } = require('mutant')

module.exports = function likes (msg, {connection, i18n}) {
  var result = h('a.likes', {
    style: {display: 'none'},
    dest: msg.key
  })
  result.update = updateSelf
  result.update({connection, i18n})
  return result
}

function updateSelf ({connection, i18n}) {
  let element = this
  connection.obtain(sbot => {
    sbot['patchtron'].likes.counts({dest: element.dest}, (err, counts) => {
      if (err) return
      element.innerText = i18n.plural(`%s likes`, counts.total)

      if (counts.total > 0) {
        element.style.display = ''
      } else {
        element.style.display = 'none'
      }
    })
  })
}
