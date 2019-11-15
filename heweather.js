const AbortController = require('abort-controller')
const fetch = require('node-fetch')
const { toISOTZ } = require('./time')

const heweatherCache = {}

async function heweather6 (req, retryCnt) {
  if (retryCnt === undefined) retryCnt = 5
  let res
  const controller = new AbortController()
  const timeout = setTimeout(
    () => { controller.abort() },
    10000
  )
  try {
    res = await fetch(
        `https://free-api.heweather.net/s6/weather/${req}&key=${process.env.HEWEATHER_KEY}`,
        { signal: controller.signal }
    )
  } catch (err) {
    console.error(err)
    if (err.name === 'AbortError') {
      const throwErr = new Error('抱歉( >﹏<。)天气网络超时')
      throwErr.name = 'TimeoutError'
      throw throwErr
    }
    if (retryCnt > 0) return heweather6(req, retryCnt - 1)
    const throwErr = new Error('抱歉( >﹏<。)天气卖完了')
    throwErr.name = 'NetworkError'
    throw throwErr
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) {
    console.error(res.statusText)
    if (res.status >= 500 && retryCnt > 0) return heweather6(req, retryCnt - 1)
    throw new Error(res.statusText)
  }
  const json = await res.json()
  if (!json.HeWeather6) {
    console.error(json)
    throw new Error('抱歉( >﹏<。)这是一个意外')
  }
  if (json.HeWeather6[0].status !== 'ok') {
    throw new Error(json.HeWeather6[0].status)
  }
  return json.HeWeather6
}

async function getFirst (req) {
  const he = await heweather6(req)
  return he[0]
}

async function now (loc, lang) {
  const cache = heweatherCache[`now://${loc}`]
  const basicCache = heweatherCache[`basic://${loc},${lang}`]
  if (cache && basicCache) {
    const lastUpdate = new Date(cache.update.utc.replace(/ /, 'T') + 'Z')
    lastUpdate.setMinutes(lastUpdate.getMinutes() + 10)
    const now = new Date()
    if (now < lastUpdate) {
      cache.basic = basicCache
      return cache
    }
  }
  const result = await getFirst(`now?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
  heweatherCache[`now://${loc}`] = result
  heweatherCache[`basic://${loc},${lang}`] = result.basic
  return result
}

async function forecast (loc, lang) {
  const cache = heweatherCache[`forecast://${loc}`]
  const basicCache = heweatherCache[`basic://${loc},${lang}`]
  if (cache && basicCache) {
    const lastUpdate = new Date(`${cache.daily_forecast[0].date}T00:00${toISOTZ(cache.basic.tz)}`)
    lastUpdate.setDate(lastUpdate.getDate() + 1)
    const now = new Date()
    if (now < lastUpdate) {
      cache.basic = basicCache
      return cache
    }
  }
  const result = await getFirst(`forecast?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
  heweatherCache[`forecast://${loc}`] = result
  heweatherCache[`basic://${loc},${lang}`] = result.basic
  return result
}

async function basic (loc, lang) {
  const basicCache = heweatherCache[`basic://${loc},${lang}`]
  if (basicCache) return basicCache
  const result = await getFirst(`forecast?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
  heweatherCache[`basic://${loc},${lang}`] = result.basic
  return result.basic
}

async function queryCity (loc) {
  const cache = heweatherCache[`city://${loc}`]
  if (cache) return cache
  let result
  try {
    const he = await heweather6(`now?location=${encodeURIComponent(loc)}`)
    result = he.map(data => {
      data = data.basic
      let fullname = data.location
      if (data.parent_city !== data.location) fullname += `, ${data.parent_city}`
      if (data.admin_area !== data.parent_city) fullname += `, ${data.admin_area}`
      if (data.cnty !== data.parent_city) fullname += `, ${data.cnty}`
      return {
        cid: data.cid,
        fullname
      }
    })
  } catch (err) {
    if (err.message === 'unknown location') {
      result = []
    } else throw err
  }
  heweatherCache[`city://${loc}`] = result
  return result
}

module.exports = {
  getWeatherNow: now,
  getWeatherForecast: forecast,
  getCityBasic: basic,
  queryCity
}
