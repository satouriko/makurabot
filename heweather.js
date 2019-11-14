const fetch = require('node-fetch')

const heweatherCache = {}

async function heweather6 (req) {
  let res
  try {
    res =
      await fetch(`https://free-api.heweather.net/s6/weather/${req}&key=${process.env.HEWEATHER_KEY}`)
  } catch (e) {
    console.error(e)
    throw new Error('天气卖完了( >﹏<。) 真的很抱歉, 客人大人可以私聊我联系主人')
  }
  if (!res.ok) {
    throw new Error(res.statusText)
  }
  const json = await res.json()
  if (!json.HeWeather6) {
    console.error(json)
    throw new Error('这是一个意外( >﹏<。) 真的很抱歉, 客人大人可以私聊我联系主人')
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
  const cache = heweatherCache[`now://${loc},${lang}`]
  if (cache) {
    const lastUpdate = new Date(cache.update.utc.replace(/ /, 'T') + 'Z')
    lastUpdate.setHours(lastUpdate.getHours() + 1)
    const now = new Date()
    if (now < lastUpdate) {
      return cache
    }
  }
  const result = await getFirst(`now?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
  heweatherCache[`now://${loc},${lang}`] = result
  return result
}

async function forecast (loc, lang) {
  const toISOTZ = (tzStr) => {
    const decimal = (+tzStr / 100).toFixed(4)
    const str = `${decimal < 0 ? '-' : '+'}${decimal.substr(decimal.indexOf('.') + 1)}`
    return str === '+0000' || str === '-0000' ? 'Z' : str
  }
  const cache = heweatherCache[`forecast://${loc},${lang}`]
  if (cache) {
    const lastUpdate = new Date(`${cache.daily_forecast[0].date}T00:00${toISOTZ(cache.basic.tz)}`)
    lastUpdate.setDate(lastUpdate.getDate() + 1)
    const now = new Date()
    if (now < lastUpdate) {
      return cache
    }
  }
  const result = await getFirst(`forecast?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
  heweatherCache[`forecast://${loc},${lang}`] = result
  return result
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
  queryCity
}
