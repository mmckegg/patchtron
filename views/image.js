const colorHash = new (require('color-hash'))()
const fallbackImageUrl = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
const { h } = require('mutant')

module.exports = function image (id, {connection}) {
  var result = h('img', {
    className: 'Avatar',
    style: { 'background-color': colorHash.hex(id) },
    src: fallbackImageUrl
  })

  connection.about(id, 'image', (err, link) => {
    if (err) return
    if (link) {
      result.src = connection.blobUrl(link)
    }
  })

  return result
}
