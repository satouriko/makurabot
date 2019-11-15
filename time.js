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

module.exports = {
  toISOTZ,
  toTZOffset
}
