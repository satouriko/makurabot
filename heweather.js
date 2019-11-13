const fetch = require('node-fetch')

async function heweather6 (req) {
  const res =
    await fetch(`https://free-api.heweather.net/s6/weather/${req}&key=${process.env.HEWEATHER_KEY}`)
  if (!res.ok) {
    throw new Error(res.statusText)
  }
  const json = await res.json()
  if (!json.HeWeather6) {
    throw new Error('Bad api response from Heweather.')
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
  return getFirst(`now?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
}

async function forecast (loc, lang) {
  return getFirst(`forecast?location=${encodeURIComponent(loc)}&lang=${encodeURIComponent(lang)}`)
}

async function queryCity (loc) {
  try {
    const he = await heweather6(`now?location=${encodeURIComponent(loc)}`)
    return he.map(data => {
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
      return []
    }
    throw err
  }
}

module.exports = {
  getWeatherNow: now,
  getWeatherForecast: forecast,
  queryCity
}
