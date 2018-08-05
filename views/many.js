module.exports = function many (ids, {renderItem, i18n}) {
  ids = Array.from(ids)
  var featuredIds = ids.slice(0, 4)

  if (ids.length) {
    if (ids.length > 4) {
      return [
        renderItem(featuredIds[0]), ', ',
        renderItem(featuredIds[1]), ', ',
        renderItem(featuredIds[2]), i18n(' and '),
        ids.length - 3, i18n(' others')
      ]
    } else if (ids.length === 4) {
      return [
        renderItem(featuredIds[0]), ', ',
        renderItem(featuredIds[1]), ', ',
        renderItem(featuredIds[2]), i18n(' and '),
        renderItem(featuredIds[3])
      ]
    } else if (ids.length === 3) {
      return [
        renderItem(featuredIds[0]), ', ',
        renderItem(featuredIds[1]), i18n(' and '),
        renderItem(featuredIds[2])
      ]
    } else if (ids.length === 2) {
      return [
        renderItem(featuredIds[0]), i18n(' and '),
        renderItem(featuredIds[1])
      ]
    } else {
      return renderItem(featuredIds[0])
    }
  }
}
