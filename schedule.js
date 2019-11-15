const { toISOTZ, toTZOffset } = require('./time')

/**
 * schedule
 * @param  {string}   timeStr     Time in format of '06:47'
 * @param  {string}   tzStr       Timezone in format of '-7.00'
 * @param  {function} [callback]  Callback function
 * @return {Promise | void}       If callback isn't provide, return Promise
 */
function scheduleTime (timeStr, tzStr, callback) {
  const now = new Date()
  now.setMinutes(now.getMinutes() - toTZOffset(tzStr))
  const date = now.toISOString().split('T')[0]
  now.setMinutes(now.getMinutes() + toTZOffset(tzStr))
  const scheduleTime = new Date(`${date}T${timeStr}${toISOTZ(tzStr)}`)
  if (now > scheduleTime) {
    scheduleTime.setDate(scheduleTime.getDate() + 1)
  }
  if (callback) {
    setTimeout(callback, scheduleTime.getTime() - now.getTime())
    return
  }
  return new Promise(resolve => {
    setTimeout(resolve, scheduleTime.getTime() - now.getTime())
  })
}

/**
 * schedule
 * @param  {string}   dateStr     Date in format of '2019-11-15'
 * @param  {string}   timeStr     Time in format of '06:47'
 * @param  {string}   tzStr       Timezone in format of '-7.00'
 * @param  {function} [callback]  Callback function
 * @return {Promise | void}       If callback isn't provide, return Promise
 */
function scheduleDateTime (dateStr, timeStr, tzStr, callback) {
  const scheduleTime = new Date(`${dateStr}T${timeStr}${toISOTZ(tzStr)}`)
  const now = new Date()
  if (now < scheduleTime && callback === undefined) {
    return new Promise(() => {})
  }
  if (callback) {
    setTimeout(callback, scheduleTime.getTime() - now.getTime())
    return
  }
  return new Promise(resolve => {
    setTimeout(resolve, scheduleTime.getTime() - now.getTime())
  })
}

module.exports = {
  scheduleTime,
  scheduleDateTime
}
