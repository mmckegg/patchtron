'use strict'
var pull = require('pull-stream')
var FlumeViewLevel = require('flumeview-level')
var HLRU = require('hashlru')
var extend = require('xtend')
var normalizeChannel = require('ssb-ref').normalizeChannel
var Defer = require('pull-defer')
var pullResume = require('../lib/pull-resume')
var getRoot = require('../lib/get-root')
var getTimestamp = require('../lib/get-timestamp')
var threadSummary = require('../lib/thread-summary')

module.exports = function (ssb, config) {
  var create = FlumeViewLevel(0, function (msg, seq) {
    var result = [
      [getTimestamp(msg), getRoot(msg) || msg.key]
    ]
    return result
  })

  var index = ssb._flumeUse('patchtron-roots', create)

  // cache mostly just to avoid reading the same roots over and over again
  // not really big enough for multiple refresh cycles
  var cache = HLRU(100)

  return {
    read: function ({ids = [ssb.id], reverse, limit, resume}) {
      var seen = new Set()
      var included = new Set()

      var stream = Defer.source()

      getFilter((err, filter) => {
        if (err) return stream.abort(err)

        // use resume option if specified
        var opts = {reverse, old: true}
        if (resume) {
          opts[reverse ? 'lt' : 'gt'] = [resume]
        }

        stream.resolve(pullResume.source(index.read(opts), {
          limit,
          getResume: (item) => item && item.key && item.key[0],
          filterMap: pull(
            // BUMP FILTER
            pull.filter(item => {
              if (filter && item.value && item.value) {
                var filterResult = filter(ids, item.value)
                if (filterResult) {
                  item.value.filterResult = filterResult
                  return true
                }
              }
            }),
  
            // LOOKUP AND ADD ROOTS
            LookupRoots(),
  
            // FILTER ROOTS
            pull.filter(item => {
              var root = item.root || item
              var isPrivate = root.value && root.value.private
  
              // skip this item if it has already been included
              if (!included.has(root.key) && filter && root && root.value && !isPrivate) {
                if (checkReplyForcesDisplay(item)) { // include this item if it has matching tags or the author is you
                  // update filter result so that we can display the correct bump message
                  root.filterResult = extend(item.filterResult, {forced: true})
                  included.add(root.key)
                  return true
                } else if (!seen.has(root.key)) {
                  seen.add(root.key)
                  var filterResult = filter(ids, root)
                  if (shouldShow(filterResult)) {
                    root.filterResult = filterResult
                    included.add(root.key)
                    return true
                  }
                }
              }
            }),
  
            // MAP ROOT ITEMS
            pull.map(item => {
              var root = item.root || item
              return root
            }),
  
            // ADD THREAD SUMMARY
            pull.asyncMap((item, cb) => {
              threadSummary(item.key, {
                recentLimit: 3,
                readThread: ssb.patchtron.thread.read,
                bumpFilter
              }, (err, summary) => {
                if (err) return cb(err)
                cb(null, extend(item, summary, {
                  filterResult: undefined,
                  rootBump: bumpFromFilterResult(item, item.filterResult)
                }))
              })
            })
          )
        }))

        function bumpFilter (msg) {
          let filterResult = filter(ids, msg)
          return bumpFromFilterResult(msg, filterResult)
        }
      })

      return stream
    }
  }

  function shouldShow (filterResult) {
    return !!filterResult
  }

  function getThruCache (key, cb) {
    if (cache.has(key)) {
      cb(null, cache.get(key))
    } else {
      // don't do an ooo lookup
      ssb.get({id: key, raw: true}, (_, value) => {
        var msg = {key, value}
        if (msg.value) {
          cache.set(key, msg)
        }
        cb(null, msg)
      })
    }
  }

  function getFilter (cb) {
    // TODO: rewrite contacts stream
    ssb.friends.get((err, friends) => {
      if (err) return cb(err)
      ssb['patchtron'].getSubscriptions((err, subscriptions) => {
        if (err) return cb(err)
        cb(null, function (ids, msg) {
          var type = msg.value.content.type
          if (type === 'vote') return false // filter out likes
          var hasChannel = !!msg.value.content.channel
          var matchesChannel = (type !== 'channel' && checkChannel(subscriptions, ids, msg.value.content.channel))
          var matchingTags = getMatchingTags(subscriptions, ids, msg.value.content.mentions)
          var isYours = ids.includes(msg.value.author)
          var mentionsYou = getMentionsYou(ids, msg.value.content.mentions)

          var following = checkFollowing(friends, ids, msg.value.author)
          if (isYours || matchesChannel || matchingTags.length || following || mentionsYou) {
            return {
              matchingTags, matchesChannel, isYours, following, mentionsYou, hasChannel
            }
          }
        })
      })
    })
  }

  function LookupRoots () {
    return pull.asyncMap((item, cb) => {
      var msg = item.value
      var key = item.key[1]

      if (key === msg.key) {
        // already a root
        return cb(null, msg)
      }
      getThruCache(key, (_, value) => {
        cb(null, extend(msg, {
          root: value
        }))
      })
    })
  }
}

function getMatchingTags (lookup, ids, mentions) {
  if (Array.isArray(mentions)) {
    return mentions.reduce((result, mention) => {
      if (mention && typeof mention.link === 'string' && mention.link.startsWith('#')) {
        if (checkChannel(lookup, ids, mention.link.slice(1))) {
          result.push(normalizeChannel(mention.link.slice(1)))
        }
      }
      return result
    }, [])
  }
  return []
}

function getMentionsYou (ids, mentions) {
  if (Array.isArray(mentions)) {
    return mentions.some((mention) => {
      if (mention && typeof mention.link === 'string') {
        return ids.includes(mention.link)
      }
    })
  }
}

function checkReplyForcesDisplay (item) {
  var filterResult = item.filterResult || {}
  var matchesTags = filterResult.matchingTags && !!filterResult.matchingTags.length
  return matchesTags || filterResult.isYours
}

function checkFollowing (lookup, ids, target) {
  // TODO: rewrite contacts index (for some reason the order is different)
  if (!lookup) return false
  // HACK: only lookup the first ID until a method is added to ssb-friends to
  // correctly identify latest info
  var value = ids.slice(0, 1).map(id => lookup[id] && lookup[id][target])
  return value && value[0]
}

function checkChannel (lookup, ids, channel) {
  if (!lookup) return false
  channel = normalizeChannel(channel)
  if (channel) {
    var value = mostRecentValue(ids.map(id => lookup[`${id}:${channel}`]))
    return value && value[1]
  }
}

function mostRecentValue (values, timestampIndex = 0) {
  var mostRecent = null
  values.forEach(value => {
    if (value && (!mostRecent || mostRecent[timestampIndex] < value[timestampIndex])) {
      mostRecent = value
    }
  })
  return mostRecent
}

function bumpFromFilterResult (msg, filterResult) {
  if (filterResult) {
    if (filterResult.following) {
      return {type: 'reply'}
    } else if (filterResult.matchesChannel || filterResult.matchingTags.length) {
      var channels = new Set()
      if (filterResult.matchesChannel) channels.add(msg.value.content.channel)
      if (Array.isArray(filterResult.matchingTags)) filterResult.matchingTags.forEach(x => channels.add(x))
      return {type: 'matches-channel', channels: Array.from(channels)}
    }
  }
}
