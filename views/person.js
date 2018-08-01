const { h } = require('mutant')
module.exports = function person (id, {connection}) {
  var result = h('a', {href: id}, [id.slice(0, 10), '...'])
  connection.about(id, 'name', (err, name) => {
    if (err) return
    if (name) {
      result.innerText = name
    }
  })
  return result
}
