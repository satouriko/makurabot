/**
 * toISOTZ
 * @param  {string} tzStr Timezone in format of '-7.00'
 * @return {string}       Timezone in format of '-0700'
 */
function toISOTZ (tzStr) {
  const decimal = (+tzStr / 100).toFixed(4)
  const str = `${decimal < 0 ? '-' : '+'}${decimal.substr(decimal.indexOf('.') + 1)}`
  return str === '+0000' || str === '-0000' ? 'Z' : str
}

/**
 * toTZOffset
 * @param  {string} tzStr Timezone in format of '-7.00'
 * @return {number}       Timezone offset like Date.prototype.getTimezoneOffset()
 */
function toTZOffset (tzStr) {
  return -60 * +tzStr
}

/**
 * getLocalDate
 * @param  {string} tzStr Timezone in format of '-7.00'
 * @return {string}       Date in format of '2019-11-25
 */
function getLocalDate (tzStr) {
  const now = new Date()
  now.setMinutes(now.getMinutes() - toTZOffset(tzStr))
  return now.toISOString().split('T')[0]
}

module.exports = {
  toISOTZ,
  toTZOffset,
  getLocalDate
}
