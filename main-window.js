const connectToSbot = require('./lib/connection')
const { h, when, computed } = require('mutant')
const updateTree = require('./lib/update-tree')
const ObservFullScreen = require('./lib/observ-full-screen')
const catchLinks = require('./lib/catch-links')
const Views = require('./app/views')
const Search = require('./app/search')
const renderPage = require('./pages')

const connection = connectToSbot(process.env['ssb_appname'] || 'ssb')

connection.onPublish(msg => {
  let content = msg.value.content
  let type = content.type
  if (type === 'vote' && content.vote && content.vote.link) {
    invalidate(msg.value.content.vote.link)
  }
})

// add stylesheets
document.head.appendChild(h('style', {
  innerHTML: require('./styles')
}))

catchLinks(document, (href, external) => {
  if (!external) {
    navigate(href)
  }
})

var views = Views((href, cb) => {
  renderPage(href, {i18n, connection, navigate}, cb)
}, [
  '/public', '/private', connection.id, '/mentions'
])

var mainView = h(`MainWindow -${process.platform}`, {
  classList: [ when(ObservFullScreen(), '-fullscreen') ]
}, [
  h('div.top', [
    h('span.history', [
      h('a', {
        'ev-click': views.goBack,
        classList: [ when(views.canGoBack, '-active') ]
      }),
      h('a', {
        'ev-click': views.goForward,
        classList: [ when(views.canGoForward, '-active') ]
      })
    ]),
    h('span.nav', [
      tab(i18n('Public'), '/public'),
      tab(i18n('Private'), '/private'),
      // dropTab(i18n('More'), [
      //   getSubscribedChannelMenu,
      //   [i18n('Gatherings'), '/gatherings'],
      //   [i18n('Extended Network'), '/all'],
      //   {separator: true},
      //   [i18n('Settings'), '/settings']
      // ])
    ]),
    h('span.appTitle', [
      h('span.title', i18n('PATCHTRON 3000™️')),
      // api.app.html.progressNotifier()
    ]),
    h('span', [
      Search({navigate, i18n})
    ]),
    h('span.nav', [
      tab(i18n('Profile'), connection.id),
      tab(i18n('Mentions'), '/mentions')
    ])
  ]),
  views.html
])

document.body.appendChild(mainView)

function tab (name, view) {
  var instance = views.get(view)
  return h('a', {
    'ev-click': function (ev) {
      if (instance) {
        var isSelected = views.currentView() === view
        var needsRefresh = instance.pendingUpdates && instance.pendingUpdates()
  
        // refresh if tab is clicked when there are pending items or the page is already selected
        if ((needsRefresh || isSelected) && instance.reload) {
          instance.reload()
        }
      }
    },
    href: view,
    classList: [
      when(selected(view), '-selected')
    ]
  }, [
    name,
    when(instance && instance.pendingUpdates, [
      ' (', instance && instance.pendingUpdates, ')'
    ])
  ])
}

function selected (view) {
  return computed([views.currentView, view], (currentView, view) => {
    return currentView === view
  })
}

function i18n (text, ...args) {
  return text.replace(/%s/, (match, offset) => {
    return args[offset]
  })
}

function invalidate (id) {
  document.querySelectorAll(`[data-id="${id}"]`).forEach(element => {
    updateTree(element, {connection, i18n})
  })
}

function navigate (href, anchor) {
  views.setView(href, anchor)
}

i18n.plural = i18n
