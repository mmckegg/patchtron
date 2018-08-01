module.exports = function getTimestamp (msg) {
  if (!msg || !msg.value || !msg.value.timestamp) return
  if (msg.timestamp) {
    return Math.min(msg.timestamp, msg.value.timestamp)
  } else {
    return msg.value.timestamp
  }
}
