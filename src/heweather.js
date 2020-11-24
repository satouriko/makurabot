const AbortController = require('abort-controller')
const fetch = require('node-fetch')
const { toISOTZ, getLocalDate } = require('./time')
const statistic = require('./statistic')

const heweatherCache = {}

const cloneDeep = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

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
        `https://heweather-free-api.cool2645.com/s6/weather/${req}&key=${process.env.HEWEATHER_KEY}`,
        { signal: controller.signal }
    )
  } catch (err) {
    statistic.spank(err)
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
    if (res.status <= 0 || res.status >= 500) {
      statistic.spank(res.statusText)
    }
    if (res.status >= 500 && retryCnt > 0) return heweather6(req, retryCnt - 1)
    throw new Error(res.statusText)
  }
  const json = await res.json()
  if (!json.HeWeather6) {
    statistic.spank(json)
    throw new Error('抱歉( >﹏<。)这是一个意外')
  }
  if (json.HeWeather6[0].status !== 'ok') {
    statistic.spank(json.HeWeather6[0].status)
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

async function forecast (loc, lang, todayOnly) {
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
  const originalResult = await getFirst(`forecast?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
  // make sure daily_forecast[0] is today
  const result = cloneDeep(originalResult)
  const localDate = getLocalDate(result.basic.tz)
  for (let i = 0; i < result.daily_forecast.length;) {
    if (result.daily_forecast[i].date !== localDate) {
      console.warn(`${new Date().toISOString()}\tHow could you do that to me???`)
      console.warn(JSON.stringify(originalResult))
      result.daily_forecast.splice(i, 1)
    } else break
  }
  if (result.daily_forecast.length < 2) {
    if (todayOnly && result.daily_forecast.length === 1) {
      return result
    } else {
      const err = new Error(JSON.stringify(originalResult.daily_forecast.map(f => f.date)))
      err.name = 'InsufficientForecastError'
      statistic.spank(err)
      throw err
    }
  }
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
  loc = loc.trim()
  if (!loc) {
    throw new Error('invalid param')
  }
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
