const { Value, onceTrue } = require('mutant')
const loadConfig = require('ssb-config/inject')
const createClient = require('ssb-client')
const ssbKeys = require('ssb-keys')
const Path = require('path')
const extend = require('xtend')
const minimist = require('minimist')
const ref = require('ssb-ref')
const emojis = require('emoji-named-characters')
const emojiNames = Object.keys(emojis)
const pullDefer = require('pull-defer')
const Event = require('geval/event')
const pullResume = require('./pull-resume')

module.exports = function (appName, opts) {
  let result = Value()
  const config = loadConfig(appName, minimist(process.argv))
  console.log(process.argv)
  const keyPath = Path.join(config.path, 'secret')
  const keys = ssbKeys.loadOrCreateSync(keyPath)

  var publishEvent = Event()

  console.log('CONFIG:', config)

  opts = extend({
    path: config.path,
    remote: config.remote,
    host: config.host,
    port: config.port,
    key: config.key,
    appKey: config.caps.shs,
    timers: config.timers,
    caps: config.caps,
    friends: config.friends
  }, opts)

  result.publish = function (content, cb) {
    result.obtain(sbot => {
      sbot.publish(content, (err, result) => {
        if (err) return cb && cb(err)
        cb && cb(err, result)
        publishEvent.broadcast(result)
      })
    })
  }

  result.like = function (dest, like = true, cb) {
    let vote = like
      ? { link: dest, value: 1, expression: 'Like' }
      : { link: dest, value: 0, expression: 'Unlike' }

    result.publish({ type: 'vote', vote }, cb)
  }

  result.about = function (dest, key, cb) {
    result.obtain(sbot => {
      sbot['patchtron'].about.socialValue({dest, key}, cb)
    })
  }

  result.get = function (id, cb) {
    if (typeof key === 'string') {
      id = {id, raw: true}
    }
    result.obtain(sbot => {
      sbot.get(id, cb)
    })
  }

  result.pull = function (fn) {
    return function (opts) {
      var stream = pullDefer.source()
      result.obtain(sbot => {
        stream.resolve(fn(sbot, opts))
      })
      return stream
    }
  }

  result.pullResume = function (fn, baseOpts) {
    var Stream = result.pull(fn)
    return function (opts) {
      return pullResume.remote((opts) => {
        return Stream(opts)
      }, extend(baseOpts, opts))
    }
  }

  result.obtain = function (cb) {
    if (result()) {
      cb(result())
    } else {
      onceTrue(result, cb)
    }
  }

  result.blobUrl = function (link) {
    var prefix = config.blobsPrefix != null ? config.blobsPrefix : `http://localhost:${config.ws.port}/blobs/get`
    if (link && typeof link.link === 'string') {
      link = link.link
    }

    var parsed = ref.parseLink(link)
    if (parsed && ref.isBlob(parsed.link)) {
      return `${prefix}/${parsed.link}`
    }
  }

  result.onPublish = publishEvent.listen

  result.emojiUrl = function (emoji) {
    return emoji in emojiNames && result.blobUrl(emoji).replace(/\/blobs\/get/, '/img/emoji') + '.png'
  }

  result.id = keys.id

  createClient(keys, opts, function (err, sbot) {
    if (err) throw err
    result.set(sbot)
  })
  return result
}
