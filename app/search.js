var h = require('mutant/h')
var addSuggest = require('suggest-box')

module.exports = function Search ({navigate, i18n}) {
  // var getProfileSuggestions = api.profile.async.suggest()
  // var getChannelSuggestions = api.channel.async.suggest()
  var searchBox = h('input.search', {
    type: 'search',
    placeholder: i18n('word, @key, #channel'),
    'ev-suggestselect': (ev) => {
      navigate(ev.detail.id)
      searchBox.value = ev.detail.id
    },
    'ev-keydown': (ev) => {
      if (ev.key === 'Enter') {
        doSearch()
        ev.preventDefault()
      }
    }
  })

  // setImmediate(() => {
  //   addSuggest(searchBox, (inputText, cb) => {
  //     if (inputText[0] === '@') {
  //       cb(null, getProfileSuggestions(inputText.slice(1)), {idOnly: true})
  //     } else if (inputText[0] === '#') {
  //       cb(null, getChannelSuggestions(inputText.slice(1)))
  //     } else if (inputText[0] === '/') {
  //       cb(null, getPageSuggestions(inputText))
  //     }
  //   }, {cls: 'SuggestBox'})
  // })

  return searchBox

  function doSearch () {
    var value = searchBox.value.trim()
    if (value.startsWith('/') || value.startsWith('?') || value.startsWith('@') || value.startsWith('#') || value.startsWith('%') || value.startsWith('&')) {
      if (value.startsWith('@') && value.length < 30) {
        // probably not a key
      } else if (value.length > 2) {
        navigate(value)
      }
    } else if (value.trim()) {
      if (value.length > 2) {
        navigate(`?${value.trim()}`)
      }
    }
  }

  function getPageSuggestions (input) {
    return pages.sort().filter(p => p.startsWith(input.toLowerCase())).map(p => {
      return {
        id: p,
        value: p,
        title: p
      }
    })
  }
}