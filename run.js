const defaultMenu = require('electron-default-menu')
const WindowState = require('electron-window-state')
const electron = require('electron')
const Menu = electron.Menu
const Path = require('path')

// keep references to open app windows
let windows = {}

// for macOS: track whether the app is quitting or just hiding main window
let quitting = false

console.log('starting scuttleshell')

// spawn scuttleshell and load custom plugins

electron.app.on('ready', () => {
  windows.background = startServer()

  var menu = defaultMenu(electron.app, electron.shell)
  var view = menu.find(x => x.label === 'View')
  view.submenu = [
    { role: 'reload' },
    { role: 'toggledevtools' },
    { label: 'Background Process Inspector', 
      click () {
        if (windows.background) {
          windows.background.webContents.openDevTools({detach: true})
        }
      }
    },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
  var win = menu.find(x => x.label === 'Window')
  win.submenu = [
    { role: 'minimize' },
    { role: 'zoom' },
    { role: 'close', label: 'Close Window', accelerator: 'CmdOrCtrl+Shift+W' },
    { type: 'separator' },
    {
      label: 'Close Tab',
      accelerator: 'CmdOrCtrl+W',
      click () {
        windows.main.webContents.send('closeTab')
      }
    },
    {
      label: 'Select Next Tab',
      accelerator: 'CmdOrCtrl+Shift+]',
      click () {
        windows.main.webContents.send('nextTab')
      }
    },
    {
      label: 'Select Previous Tab',
      accelerator: 'CmdOrCtrl+Shift+[',
      click () {
        windows.main.webContents.send('previousTab')
      }
    },
    { type: 'separator' },
    { role: 'front' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))

  electron.app.on('activate', function (e) {
    if (windows.main) {
      windows.main.show()
    }
  })

  electron.app.on('before-quit', function () {
    quitting = true
  })

  electron.ipcMain.once('server-started', function (ev) {
    openMainWindow()
  })

  // electron.session.defaultSession.webRequest.onBeforeRequest(['ssb://*'], (details, done) => {
  //   details.url = 'file://' + Path.join(__dirname, 'assets', 'base.html')
  //   done({cancel: false, url: details.url})
  // })
})

function openMainWindow () {
  if (!windows.main) {
    var windowState = WindowState({
      defaultWidth: 1024,
      defaultHeight: 768
    })
    windows.main = openWindow(Path.join(__dirname, 'main-window.js'), {
      minWidth: 800,
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      titleBarStyle: 'hiddenInset',
      autoHideMenuBar: true,
      title: 'PatchTron 3000',
      show: true,
      backgroundColor: '#EEE',
      icon: Path.join(__dirname, 'assets/icon.png')
    })
    windowState.manage(windows.main)
    windows.main.setSheetOffset(40)
    windows.main.on('close', function (e) {
      if (!quitting && process.platform === 'darwin') {
        e.preventDefault()
        windows.main.hide()
      }
    })
    windows.main.on('closed', function () {
      windows.main = null
      if (process.platform !== 'darwin') electron.app.quit()
    })
  }
}

function startServer () {
  var customConfig = {
    plugins: [
      Path.join(__dirname, 'sbot-plugin')
    ] // ,
    // friends: {
    //   hops: 2
    // }
  }

  var window = new electron.BrowserWindow({
    connect: false,
    center: true,
    fullscreen: false,
    fullscreenable: false,
    height: 150,
    maximizable: false,
    minimizable: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    title: 'patchtron-server',
    useContentSize: true,
    width: 150
  })
 
  window.webContents.on('dom-ready', function () {
    window.webContents.executeJavaScript(`
      // copy argv from main process
      process.argv = ${JSON.stringify(process.argv)}

      //const electron = require('electron')
      const scuttleShell = require('scuttle-shell')

      // spawn scuttle-shell
      scuttleShell.start(${JSON.stringify(customConfig)})
      electron.ipcRenderer.send('server-started')
    `)
  })

  window.loadURL('file://' + Path.join(__dirname, 'assets', 'base.html'))
  return window
}

function openWindow (path, opts) {
  var window = new electron.BrowserWindow(opts)
  window.webContents.on('dom-ready', function () {
    window.webContents.executeJavaScript(`
      // copy argv from main process
      process.argv = ${JSON.stringify(process.argv)}
      
      var electron = require('electron')
      var h = require('mutant/h')
      electron.webFrame.setVisualZoomLevelLimits(1, 1)
      var title = ${JSON.stringify(opts.title || 'PatchTron 3000')}
      document.documentElement.querySelector('head').appendChild(
        h('title', title)
      )
      require(${JSON.stringify(path)})
    `)
  })

  // window.webContents.on('will-navigate', function (e, url) {
  //   e.preventDefault()
  //   electron.shell.openExternal(url)
  // })

  // window.webContents.on('new-window', function (e, url) {
  //   e.preventDefault()
  //   electron.shell.openExternal(url)
  // })

  window.loadURL('file://' + Path.join(__dirname, 'assets', 'base.html'))
  return window
}
