var walk = require('mutant/lib/walk')

module.exports = function (root, opts) {
  walk(root, (element) => {
    if (element && typeof element.update === 'function') {
      element.update(opts)
    }
  })
}
