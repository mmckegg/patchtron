var electron = require('electron')
var {Value} = require('mutant')

module.exports = function () {
  var win = electron.remote.getCurrentWindow()
  var isFullScreen = Value(win.isFullScreen())
  win.on('enter-full-screen', function () {
    isFullScreen.set(true)
  })
  win.on('leave-full-screen', function () {
    isFullScreen.set(false)
  })
  return isFullScreen
}