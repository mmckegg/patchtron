const h = require('mutant/h')
const ref = require('ssb-ref')
const markdownRenderer = require('ssb-markdown')
const htmlEscape = require('html-escape')
const QueryString = require('querystring')

module.exports = function markdown (content, {connection}) {
  if (typeof content === 'string') { content = {text: content} }
  var mentions = {}
  var typeLookup = {}
  var emojiMentions = {}
  if (Array.isArray(content.mentions)) {
    content.mentions.forEach(function (link) {
      if (link && link.link && link.type) {
        typeLookup[link.link] = link.type
      }
      if (link && link.name && link.link) {
        if (link.emoji) {
          // handle custom emoji
          emojiMentions[link.name] = link.link
        } else {
          // handle old-style patchwork v2 mentions (deprecated)
          mentions['@' + link.name] = link.link
        }
      }
    })
  }

  return h('Markdown', {
    innerHTML: markdownRenderer.block(content.text, {
      emoji: (emoji) => {
        var url = emojiMentions[emoji]
          ? connection.blobUrl(emojiMentions[emoji])
          : connection.emojiUrl(emoji)
        return renderEmoji(emoji, url)
      },
      toUrl: (id) => {
        var link = ref.parseLink(id)
        if (link && ref.isBlob(link.link)) {
          var url = connection.blobUrl(link.link)
          var query = {}
          if (link.query && link.query.unbox) query['unbox'] = link.query.unbox
          if (typeLookup[link.link]) query['contentType'] = typeLookup[link.link]
          return url + '?' + QueryString.stringify(query)
        } else if (link || id.startsWith('#') || id.startsWith('?')) {
          return id
        } else if (mentions[id]) {
          // handle old-style patchwork v2 mentions (deprecated)
          return mentions[id]
        }
        return false
      },
      imageLink: (id) => id
    })
  })
}

function renderEmoji (emoji, url) {
  if (!url) return ':' + emoji + ':'
  return `
    <img
      src="${htmlEscape(url)}"
      alt=":${htmlEscape(emoji)}:"
      title=":${htmlEscape(emoji)}:"
      class="emoji"
    >
  `
}
