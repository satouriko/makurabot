const TelegramBot = require('node-telegram-bot-api')
const Twitter = require('twitter')
const AbortController = require('abort-controller')
const fetch = require('node-fetch')
const store = require('./store')
const statistic = require('./statistic')
const { toISOTZ } = require('./time')
const { getWeatherNow, getWeatherForecast, queryCity } = require('./heweather')
const { formatWeather, formatLegend, formatDaily, formatDaily2 } = require('./format_weather')
const { scheduleDateTime } = require('./schedule')

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

const bot = new TelegramBot(process.env.TOKEN, { polling: true })

bot._sendMessage = bot.sendMessage
bot.sendMessage = async function (chatId, text, form) {
  await this.sendChatAction(chatId, 'typing')
  return this._sendMessage(chatId, text, form)
}
bot._sendPhoto = bot.sendPhoto
bot.sendPhoto = async function (chatId, photo, options, fileOptions) {
  await this.sendChatAction(chatId, 'upload_photo')
  return this._sendPhoto(chatId, photo, options, fileOptions)
}
bot._sendMediaGroup = bot.sendMediaGroup
bot.sendMediaGroup = async function (chatId, media, options) {
  await this.sendChatAction(chatId, 'upload_photo')
  return this._sendMediaGroup(chatId, media, options)
}

function topLevelTry (f) {
  return async (...arg) => {
    try {
      let res = f(...arg)
      if (res instanceof Promise) {
        res = await res
      }
      return res
    } catch (err) {
      statistic.spank(err)
    }
  }
}

bot.on('callback_query', topLevelTry(async callbackQuery => {
  if (!callbackQuery.message) {
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  let session
  if (store.state.session[callbackQuery.message.chat.id + ''] &&
    store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  ) {
    session = store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  } else if (callbackQuery.data === "mornin'") {
    session = { cmd: 'weather_push', data: { cids: [], expireAt: '2019-11-18T04:15:40.739Z' } }
  } else {
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    if (callbackQuery.message.text) {
      await bot.editMessageText(
        '会话已过期, 请重新请求. 给您带来不便十分抱歉.',
        {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id
        }
      )
    } else {
      await bot.editMessageCaption(
        '会话已过期, 请重新请求. 给您带来不便十分抱歉.',
        {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id
        }
      )
    }
    return
  }
  const { cmd, data } = session

  if (cmd !== 'action' && callbackQuery.message.reply_to_message &&
    callbackQuery.from.id !== callbackQuery.message.reply_to_message.from.id) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '不要碰那里!(｡◕ˇ﹏ˇ◕）对, 对不起, 请原谅我的失礼.',
      show_alert: true
    })
    return
  }

  if (cmd === '/add_city') {
    if (!store.state.weather[callbackQuery.message.chat.id + '']) {
      store.state.weather[callbackQuery.message.chat.id + ''] = []
    }
    store.state.weather[callbackQuery.message.chat.id + ''].push(callbackQuery.data)
    const dailyOn = isDailyOn(callbackQuery.message.chat.id)
    if (dailyOn) {
      await addWeatherPushCity(callbackQuery.data, callbackQuery.message.chat.id)
    }
    delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
    await store.save()
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.editMessageText(
      '早苗已经把您的城市加上惹!ଘ(੭ˊᵕˋ)੭* ੈ✩‧₊˚',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (cmd === '/remove_city') {
    if (!store.state.weather[callbackQuery.message.chat.id + '']) {
      store.state.weather[callbackQuery.message.chat.id + ''] = []
    }
    let deleted = false
    if (store.state.weather[callbackQuery.message.chat.id + ''].indexOf(callbackQuery.data) !== -1) {
      store.state.weather[callbackQuery.message.chat.id + ''] =
        store.state.weather[callbackQuery.message.chat.id + ''].filter(cid => cid !== callbackQuery.data)
      deleted = true
      if (store.state.weatherPush[callbackQuery.data]) {
        delete store.state.weatherPush[callbackQuery.data].chats[callbackQuery.message.chat.id + '']
      }
    }
    delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
    await store.save()
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.editMessageText(
      deleted ? '早苗已经帮您把城市删惹!๐·°(৹˃̵﹏˂̵৹)°·๐' : '您有订阅这个城市吗(´｀;) ？',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (cmd === '/weather' || cmd === '/tenki' || cmd === '/tianqi') {
    if (!data) {
      await bot.editMessageReplyMarkup(null, {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      })
      await bot.editMessageText(
        '早苗正在帮您查询……请您稍等',
        {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id
        }
      )
      await bot.answerCallbackQuery(callbackQuery.id)
      await queryWeather(callbackQuery.message, cmd, [callbackQuery.data])
      return
    }
    const { cites, cityWeathers } = data
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '早苗正在重试拉取更新, 请, 请您稍……( >﹏<。)候'
    })
    await queryWeather(callbackQuery.message, cmd, cites, cityWeathers)
    return
  }

  if (cmd === 'weather_push') {
    const text = await handleMornin(callbackQuery.message.chat.id, data)
    await bot.answerCallbackQuery(callbackQuery.id, {
      text
    })
    return
  }

  delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  await store.save()
  await bot.answerCallbackQuery(callbackQuery.id)
}))

bot.on('edited_message', topLevelTry(async msg => {
  // bot command
  if (msg.entities && msg.entities.length &&
    msg.entities.findIndex(e => e.type === 'bot_command') !== -1) {
    if (msg.chat.type === 'private') {
      await bot.sendMessage(msg.chat.id,
        '编辑是没什么卵用的',
        { reply_to_message_id: msg.message_id }
      )
    }
    return
  }

  if (msg.chat.type !== 'private') return

  // not me
  if (msg.chat.id !== +process.env.GM0) {
    const fwdMsg = await bot.forwardMessage(
      +process.env.GM0,
      msg.chat.id,
      msg.message_id
    )
    await bot.sendMessage(
      +process.env.GM0,
      `[${msg.from.id}](tg://user?id=${msg.from.id}) 这个手残编辑了一条消息`,
      {
        reply_to_message_id: fwdMsg.message_id,
        parse_mode: 'Markdown'
      }
    )
  } else {
    await bot.sendMessage(msg.chat.id,
      '编辑是没什么卵用的',
      { reply_to_message_id: msg.message_id }
    )
  }
}))

bot.on('message', topLevelTry(async msg => {
  // bot command
  if (msg.entities && msg.entities.length &&
    msg.entities.findIndex(e => e.type === 'bot_command') !== -1) {
    const cmdEntity = msg.entities.find(e => e.type === 'bot_command')
    let cmd = msg.text.substr(cmdEntity.offset, cmdEntity.length)
    if (cmd.indexOf('@') !== -1) {
      cmd = cmd.substring(0, cmd.indexOf('@'))
    }

    if (cmd === '/about') {
      await bot.sendMessage(msg.chat.id,
        `◎ 梨子的私人助理早苗\n◎ 可播报天气\n◎ 私聊咱可代为客官传达消息\n\n${statistic}`,
        {
          parse_mode: 'Markdown'
        }
      )
      return
    }

    if (cmd === '/publish_2645lab' &&
      (msg.chat.id === +process.env.GM0 || msg.chat.id === +process.env.GM1)) {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => { controller.abort() },
        10000
      )
      try {
        const res = await fetch(
          process.env.NETLIFY_WEBHOOK_2645LAB,
          { method: 'POST', body: JSON.stringify({}), signal: controller.signal }
        )
        if (!res.ok) {
          statistic.spank(res)
          await bot.sendMessage(msg.chat.id,
            `构建请求失败. ${res.statusText}`,
            { reply_to_message_id: msg.message_id }
          )
        } else {
          await bot.sendMessage(msg.chat.id,
            '已开始构建. ',
            { reply_to_message_id: msg.message_id }
          )
        }
      } catch (err) {
        statistic.spank(err)
        await bot.sendMessage(msg.chat.id,
          `构建请求失败. ${err.toString()}`,
          { reply_to_message_id: msg.message_id }
        )
      } finally {
        clearTimeout(timeout)
      }
      return
    }

    const promptUserChooseCity = async (args) => {
      const sentMsg = await bot.sendMessage(msg.chat.id, '请您稍候, 早苗正在帮您查询中……', {
        reply_to_message_id: msg.message_id
      })
      let result
      try {
        result = await queryCity(args)
      } catch (err) {
        let text = err.message
        if (err.message === 'invalid param') {
          text = `请在输入的命令后面加上城市名, 中英文都可以, 例如: ${cmd} 上海`
        }
        await bot.editMessageText(text, {
          chat_id: msg.chat.id,
          message_id: sentMsg.message_id
        })
        return
      }
      await bot.editMessageText(
        result.length === 0 ? '没有找到您查询的城市, 真的非常抱歉.'
          : result.length === 1 ? '久等了, 是这里吗?'
            : '久等了, 是哪一个呢? ',
        {
          chat_id: msg.chat.id,
          message_id: sentMsg.message_id
        }
      )
      if (result.length > 0) {
        await pushSession(sentMsg, cmd)
        await bot.editMessageReplyMarkup({
          inline_keyboard: result.map(city => (
            [{ text: city.fullname, callback_data: city.cid }]
          ))
        }, {
          chat_id: msg.chat.id,
          message_id: sentMsg.message_id
        })
      }
    }

    if (cmd === '/add_city' || cmd === '/remove_city') {
      if (!store.state.weather[msg.chat.id + '']) {
        store.state.weather[msg.chat.id + ''] = []
        await store.save()
      }
      const args = msg.text
        .substr(cmdEntity.offset + cmdEntity.length).trim()
      await promptUserChooseCity(args)
      return
    }

    if (cmd === '/weather' || cmd === '/tenki' || cmd === '/tianqi') {
      const args = msg.text
        .substr(cmdEntity.offset + cmdEntity.length).trim()
      if (args) {
        await promptUserChooseCity(args)
        return
      }
      const cites = store.state.weather[msg.chat.id + '']
      if (!cites || !cites.length) {
        await bot.sendMessage(
          msg.chat.id,
          '您还没有添加城市, 用 /add_city <城市名> 来添加一个城市吧!'
        )
        return
      }
      const sentMsg = await bot.sendMessage(msg.chat.id, '早苗正在拉取更新……请您稍等')
      await queryWeather(sentMsg, cmd, cites)
      return
    }

    if (cmd === '/legend' || cmd === '/hanrei' || cmd === '/tuli') {
      const args = msg.text
        .substr(cmdEntity.offset + cmdEntity.length).trim()
      const lang = cmd === '/legend' ? 'en'
        : cmd === '/hanrei' ? 'ja' : 'zh'
      await bot.sendMessage(msg.chat.id, formatLegend(args, lang))
      return
    }

    if (cmd === '/toggle_daily') {
      const on = isDailyOn(msg.chat.id)
      if (on) { // switch to off
        for (const wpCity of Object.values(store.state.weatherPush)) {
          delete wpCity.chats[msg.chat.id + '']
        }
        await store.save()
        await bot.sendMessage(msg.chat.id, '打扰了๐·°(৹˃̵﹏˂̵৹)°·๐非常抱歉.', {
          reply_to_message_id: msg.message_id
        })
      } else { // switch to on
        if (!store.state.weather[msg.chat.id + ''] || store.state.weather[msg.chat.id + ''].length === 0) {
          await bot.sendMessage(msg.chat.id, '您还没有添加城市, 用 /add_city <城市名> 来添加一个城市吧!', {
            reply_to_message_id: msg.message_id
          })
          return
        }
        for (const cid of store.state.weather[msg.chat.id + '']) {
          await addWeatherPushCity(cid, msg.chat.id)
        }
        await bot.sendMessage(msg.chat.id, '早苗今后每天都会跟主人问好哦~(*ෆ´ ˘ `ෆ*)♡', {
          reply_to_message_id: msg.message_id
        })
      }
      return
    }

    if (cmd === '/toggle_notification') {
      if (!store.state.notification[msg.chat.id + '']) {
        store.state.notification[msg.chat.id + ''] = {}
      }
      if (!store.state.notification[msg.chat.id + ''].disabled) {
        store.state.notification[msg.chat.id + ''].disabled = true
        await store.save()
        await bot.sendMessage(msg.chat.id, '打扰了, 非常抱歉ヽ(*。>Д<)o゜', {
          reply_to_message_id: msg.message_id
        })
      } else {
        store.state.notification[msg.chat.id + ''].disabled = false
        await store.save()
        await bot.sendMessage(msg.chat.id, '(*ෆ´ ˘ `ෆ*)♡', {
          reply_to_message_id: msg.message_id
        })
      }
    }

    if (msg.chat.type === 'private') await defaultReply(bot, msg)
    return
  }

  if (msg.reply_to_message &&
    store.state.session[msg.reply_to_message.chat.id + ''] &&
    store.state.session[msg.reply_to_message.chat.id + ''][msg.reply_to_message.message_id]) {
    const session = store.state.session[msg.reply_to_message.chat.id + ''][msg.reply_to_message.message_id]
    const { cmd, data } = session
    if (cmd === 'weather_push') {
      const text = await handleMornin(msg.reply_to_message.chat.id, data)
      await bot.sendMessage(msg.chat.id,
        text,
        { reply_to_message_id: msg.message_id }
      )
      return
    }
  }

  if (msg.reply_to_message && !msg.reply_to_message.forward_from &&
    msg.chat.id === +process.env.GM0
  ) {
    const matches = /来自用户 ([0-9]+)./g.exec(msg.reply_to_message.text)
    if (matches && +matches[1]) {
      const userId = +matches[1]
      await bot.sendMessage(userId, msg.text)
      await bot.sendMessage(
        msg.chat.id,
        `已投递给 [${userId}](tg://user?id=${userId}).`,
        {
          reply_to_message_id: msg.message_id,
          parse_mode: 'Markdown'
        }
      )
    } else {
      await defaultReply(bot, msg)
    }
    return
  }

  if (msg.chat.id === +process.env.GM0) {
    // send twitter
    if (msg.text) {
      let tweet
      try {
        tweet = await client.post('statuses/update', { status: msg.text })
      } catch (err) {
        statistic.spank(err)
        await bot.sendMessage(msg.chat.id,
            `推文发送失败. ${err.toString()}`,
            { reply_to_message_id: msg.message_id }
        )
        return
      }
      await bot.sendMessage(msg.chat.id,
          `推文已发送. https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
          { reply_to_message_id: msg.message_id }
      )
    } else {
      console.log(msg)
      await bot.sendMessage(msg.chat.id,
        '暂不支持这种格式的推文.',
        { reply_to_message_id: msg.message_id }
      )
    }
    return
  }

  if (msg.chat.type !== 'private') {
    return
  }

  // not me
  const fwdMsg = await bot.forwardMessage(
    +process.env.GM0,
    msg.chat.id,
    msg.message_id
  )
  await bot.sendMessage(
    +process.env.GM0,
    `来自用户 [${msg.from.id}](tg://user?id=${msg.from.id}).`,
    {
      reply_to_message_id: fwdMsg.message_id,
      parse_mode: 'Markdown'
    }
  )
  await bot.sendMessage(msg.chat.id,
    '早苗已经把您的重要指示上报啦!\\(๑╹◡╹๑)ﾉ♬',
    {
      reply_to_message_id: msg.message_id
    }
  )
}))

async function pushSession (sentMsg, cmd, data) {
  if (!store.state.session[sentMsg.chat.id + '']) {
    store.state.session[sentMsg.chat.id + ''] = {}
  }
  const date = new Date()
  for (const msgId of Object.keys(store.state.session[sentMsg.chat.id + ''])) {
    let expireAt = store.state.session[sentMsg.chat.id + ''][msgId].expireAt
    expireAt = new Date(expireAt)
    if (date > expireAt) {
      delete store.state.session[sentMsg.chat.id + ''][msgId]
    }
  }
  date.setDate(date.getDate() + 2)
  store.state.session[sentMsg.chat.id + ''][sentMsg.message_id + ''] = {
    cmd, data, expireAt: date.toISOString()
  }
  await store.save()
}

async function queryWeather (sentMsg, cmd, cites, cityWeathers) {
  const lang = cmd === '/weather' ? 'en'
    : cmd === '/tenki' ? 'ja' : 'zh'
  if (!cityWeathers) cityWeathers = []
  let error
  let needUpdate = false
  let lastUpdateCnt = 0
  let timer = setTimeout(() => {
    needUpdate = true
  }, 10000)
  const update = async (isFinal) => {
    if (!isFinal && cityWeathers.length === lastUpdateCnt) return
    cityWeathers.sort((a, b) => (b.lat - a.lat))
    const title = sentMsg.chat.type !== 'private' ? '你群天气:' : '你城天气:'
    let result = `${title}\n${cityWeathers.map(d => d.text).join('\n')}`
    if (!isFinal) result = `${result}\n早苗仍在拉取天气更新……感谢您的耐心(´;ω;)`
    await bot.editMessageText(
      result,
      {
        chat_id: sentMsg.chat.id,
        message_id: sentMsg.message_id
      }
    )
    lastUpdateCnt = cityWeathers.length
  }
  let retryCnt = 5
  while (retryCnt > 0 && cites.length > 0) {
    error = false
    const retryCites = []
    for (const cid of cites) {
      if (needUpdate) {
        needUpdate = false
        await update(false)
        timer = setTimeout(() => {
          needUpdate = true
        }, 10000)
      }
      try {
        const weatherNow = await getWeatherNow(cid, lang)
        const weatherForecast = await getWeatherForecast(cid, 'zh', true)
        const formattedWeather = formatWeather(weatherNow, weatherForecast)
        cityWeathers.push({
          cid,
          ok: true,
          lat: weatherNow.basic.lat,
          text: formattedWeather
        })
      } catch (err) {
        if (retryCnt > 1 && err.name === 'TimeoutError') {
          retryCites.push(cid)
        } else {
          cityWeathers.push({
            cid,
            ok: false,
            lat: -Infinity,
            text: `${cid}: ${err}`
          })
        }
        error = true
      }
    }
    cites = retryCites
    retryCnt--
  }
  clearTimeout(timer)
  await update(true)
  if (error) {
    await pushSession(sentMsg, cmd, {
      cites: cityWeathers.filter(cw => !cw.ok).map(cw => cw.cid),
      cityWeathers: cityWeathers.filter(cw => cw.ok)
    })
    await bot.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '重试', callback_data: 'retry' }]
      ]
    }, {
      chat_id: sentMsg.chat.id,
      message_id: sentMsg.message_id
    })
  }
}

function isDailyOn (chatId) {
  let on = false
  for (const wpCity of Object.values(store.state.weatherPush)) {
    if (Object.keys(wpCity.chats).indexOf(chatId + '') !== -1) {
      on = true
    }
  }
  return on
}

async function addWeatherPushCity (cid, chatId) {
  if (!store.state.weatherPush[cid]) {
    store.state.weatherPush[cid] = {
      chats: {
        [chatId + '']: { importantOnly: false }
      }
    }
    checkAndScheduleWeatherPush(cid)
  } else {
    store.state.weatherPush[cid].chats[chatId + ''] = { importantOnly: false }
  }
  await store.save()
}

const weatherPushQueue = []
async function triggerWeatherPush (cid) {
  weatherPushQueue.push(cid)
  if (weatherPushQueue.length === 1) {
    runWeatherPushEventLoop()
  }
}
async function runWeatherPushEventLoop () {
  while (weatherPushQueue[0]) {
    await weatherPush(weatherPushQueue[0])
    await new Promise(resolve => { setTimeout(resolve, 60000) })
    weatherPushQueue.shift()
  }
}

async function weatherPush (cid) {
  if (!store.state.weatherPush[cid]) return
  if (Object.keys(store.state.weatherPush[cid].chats).length === 0) {
    delete store.state.weatherPush[cid]
    await store.save()
    return
  }
  const { chats, yesterday } = store.state.weatherPush[cid]
  let forecast
  try {
    forecast = await getWeatherForecast(cid, 'zh', true)
  } catch (err) {
    if (err.name === 'InsufficientForecastError') { // retry in an hour
      setTimeout(() => triggerWeatherPush(cid), 3600000)
    } else { // retry in a minute
      weatherPushQueue.push(cid)
    }
    return
  }
  const f1 = formatDaily(forecast.daily_forecast[0], yesterday, forecast.basic)
  const expireAt = new Date(`${forecast.daily_forecast[0].date}T12:00${toISOTZ(forecast.basic.tz)}`)
  for (const chatId of Object.keys(chats)) {
    if (chats[chatId].importantOnly && !f1.suggestion) continue
    try {
      const f1s = []; const cids = []
      if (store.state.session[chatId]) {
        for (const msgId of Object.keys(store.state.session[chatId])) {
          if (store.state.session[chatId][msgId].cmd === 'weather_push' &&
            store.state.session[chatId][msgId].data.expireAt === expireAt.toISOString()) {
            if (store.state.session[chatId][msgId].data.f1s) {
              f1s.push(...store.state.session[chatId][msgId].data.f1s)
            }
            if (store.state.session[chatId][msgId].data.cids) {
              cids.push(...store.state.session[chatId][msgId].data.cids)
            }
            await bot.deleteMessage(chatId, msgId)
            delete store.state.session[chatId][msgId]
          }
        }
        await store.save()
      }
      f1s.push(f1)
      cids.push(cid)
      const toSend = formatDaily2(f1s)
      const sentMsg = await bot.sendMessage(chatId,
        toSend,
        {
          disable_notification: store.state.notification[chatId] && store.state.notification[chatId].disabled,
          reply_markup: {
            inline_keyboard: [
              [{ text: '早', callback_data: "mornin'" }]
            ]
          }
        }
      )
      await pushSession(sentMsg, 'weather_push',
        {
          cids,
          f1s,
          expireAt: expireAt.toISOString()
        }
      )
      chats[chatId].importantOnly = true
    } catch (err) {
      statistic.spank(err)
    }
  }
  await store.save()
  checkAndScheduleWeatherPush(cid)
}

async function checkAndScheduleWeatherPush (cid) {
  let forecast
  try {
    forecast = await getWeatherForecast(cid, 'zh')
  } catch (err) {
    if (err.name === 'InsufficientForecastError') { // retry in an hour
      setTimeout(() => checkAndScheduleWeatherPush(cid), 3600000)
    } else { // retry in a minute
      setTimeout(() => checkAndScheduleWeatherPush(cid), 60000)
    }
    return
  }
  const today = forecast.daily_forecast[0]
  const tomorrow = forecast.daily_forecast[1]
  const srtd = new Date(`${today.date}T${today.sr}${toISOTZ(forecast.basic.tz)}`)
  const now = new Date()
  if (now < srtd) {
    scheduleDateTime(today.date, today.sr, forecast.basic.tz, () => triggerWeatherPush(cid))
  } else {
    // today is the yesterday of tomorrow
    store.state.weatherPush[cid].yesterday = today
    await store.save()
    scheduleDateTime(tomorrow.date, tomorrow.sr, forecast.basic.tz, () => triggerWeatherPush(cid))
  }
}

for (const cid of Object.keys(store.state.weatherPush)) {
  checkAndScheduleWeatherPush(cid)
}

async function handleMornin (chatId, data) {
  let { cid, cids, expireAt } = data
  expireAt = new Date(expireAt)
  if (!cids) cids = [cid]
  for (const cid of cids) {
    if (
      store.state.weatherPush[cid] &&
      store.state.weatherPush[cid].chats[chatId + '']
    ) {
      store.state.weatherPush[cid].chats[chatId + ''].importantOnly = false
    }
  }
  await store.save()
  const now = new Date()
  let text
  if (now <= expireAt) {
    const texts = [
      '主人早!', '主人早上好!', '主人早安!', '主人早~', '主人早喵~', '主人早上好喵~', '主人早安喵~',
      '主人早安~', '主人早上好~', '主人早喵!', '主人早上好喵~'
    ]
    text = texts[Math.floor(Math.random() * texts.length)]
  } else text = '不早了, 主人!'
  return text
}

async function defaultReply (bot, msg) {
  await bot.sendSticker(msg.chat.id, 'CAADBQAD2wYAAvjGxQp6TGCYLVGZohYE', {
    reply_to_message_id: msg.message_id
  })
}
