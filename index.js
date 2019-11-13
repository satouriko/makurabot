const TelegramBot = require('node-telegram-bot-api')
const fetch = require('node-fetch')
const store = require('./store')
const { sendTwitter } = require('./twitter')
const { getWeatherNow, getWeatherForecast, queryCity } = require('./heweather')
const { formatWeather, formatLegend } = require('./format_weather')

const bot = new TelegramBot(process.env.TOKEN, { polling: true })

bot.on('callback_query', async callbackQuery => {
  if (!callbackQuery.message) {
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (callbackQuery.message.reply_to_message &&
      callbackQuery.from.id !== callbackQuery.message.reply_to_message.from.id) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '不要！',
      show_alert: true
    })
    return
  }

  let cmd
  if (store.state.session[callbackQuery.message.chat.id + ''] &&
    store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  ) {
    cmd = store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  } else {
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.editMessageText(
      '会话已过期，请重新请求。',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    return
  }

  if (cmd === '/add_city') {
    if (!store.state.weather[callbackQuery.message.chat.id + '']) {
      store.state.weather[callbackQuery.message.chat.id + ''] = []
    }
    store.state.weather[callbackQuery.message.chat.id + ''].push(callbackQuery.data)
    store.save()
    delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.editMessageText(
      '妹抖酱已经把乃的城市加上惹!\\(๑╹◡╹๑)ﾉ♬',
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
      store.save()
    }
    delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.editMessageText(
      deleted ? '妹抖酱已经把乃的城市删惹!\\(๑╹◡╹๑)ﾉ♬' : '你有订阅这个城市吗(ノ｀Д´)ノ彡┻━┻',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (callbackQuery.data !== 'cancel') {
    const fwdMsg = await bot.forwardMessage(
      +process.env.GM0,
      callbackQuery.message.chat.id,
      callbackQuery.message.reply_to_message.message_id
    )
    await bot.sendMessage(
      +process.env.GM0,
      `来自用户 [${callbackQuery.from.id}](tg://user?id=${callbackQuery.from.id}) ，转发授权：${callbackQuery.data}`,
      {
        reply_to_message_id: fwdMsg.message_id,
        parse_mode: 'Markdown'
      }
    )
  }
  await bot.editMessageReplyMarkup(null, {
    chat_id: callbackQuery.message.chat.id,
    message_id: callbackQuery.message.message_id
  })
  await bot.editMessageText(
    callbackQuery.data !== 'cancel' ? '妹抖酱已经把乃的指示传达给主人啦!\\(๑╹◡╹๑)ﾉ♬' : '乃刚刚取消了发送(ノ｀Д´)ノ彡┻━┻',
    {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    }
  )
  delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  await bot.answerCallbackQuery(callbackQuery.id)
})

bot.on('edited_message', async msg => {
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
})

bot.on('message', async msg => {
  const pushSession = (sentMsg, cmd) => {
    if (!store.state.session[msg.chat.id + '']) {
      store.state.session[msg.chat.id + ''] = {}
    }
    store.state.session[msg.chat.id + ''][sentMsg.message_id + ''] = cmd
  }

  // bot command
  if (msg.entities && msg.entities.length &&
    msg.entities.findIndex(e => e.type === 'bot_command') !== -1) {
    const cmdEntity = msg.entities.find(e => e.type === 'bot_command')
    let cmd = msg.text.substr(cmdEntity.offset, cmdEntity.length)
    if (cmd.indexOf('@') !== -1) {
      cmd = cmd.substring(0, cmd.indexOf('@'))
    }
    if (cmd === '/publish_2645lab' &&
      (msg.chat.id === +process.env.GM0 || msg.chat.id === +process.env.GM1)) {
      try {
        const res = await fetch(
          process.env.NETLIFY_WEBHOOK_2645LAB,
          { method: 'POST', body: JSON.stringify({}) }
        )
        if (!res.ok) {
          console.error(res)
          await bot.sendMessage(msg.chat.id,
            `构建请求失败。${res.statusText}`,
            { reply_to_message_id: msg.message_id }
          )
        } else {
          await bot.sendMessage(msg.chat.id,
            '已开始构建。',
            { reply_to_message_id: msg.message_id }
          )
        }
      } catch (err) {
        console.error(err)
        await bot.sendMessage(msg.chat.id,
          `构建请求失败。${err.toString()}`,
          { reply_to_message_id: msg.message_id }
        )
      }
      return
    }
    if (cmd === '/add_city' || cmd === '/remove_city') {
      const args = msg.text
        .substr(cmdEntity.offset + cmdEntity.length).trim()
      const sentMsg = await bot.sendMessage(msg.chat.id, '请稍候……', {
        reply_to_message_id: msg.message_id
      })
      try {
        const result = await queryCity(args)
        await bot.editMessageText(
          result.length === 0 ? '没有找到你查询的城市……'
            : result.length === 1 ? '是这里吗？'
              : '是哪一个呢？',
          {
            chat_id: msg.chat.id,
            message_id: sentMsg.message_id
          }
        )
        if (result.length > 0) {
          await bot.editMessageReplyMarkup({
            inline_keyboard: result.map(city => (
              [{ text: city.fullname, callback_data: city.cid }]
            ))
          }, {
            chat_id: msg.chat.id,
            message_id: sentMsg.message_id
          })
        }
        if (result.length > 0) pushSession(sentMsg, cmd)
      } catch (err) {
        console.error(err)
        await bot.editMessageText(err.message, {
          chat_id: msg.chat.id,
          message_id: sentMsg.message_id
        })
      }
      return
    }

    if (cmd === '/weather' || cmd === '/tenki' || cmd === '/tianqi') {
      const lang = cmd === '/weather' ? 'en'
        : cmd === '/tenki' ? 'ja' : 'zh'
      const cites = store.state.weather[msg.chat.id + '']
      if (!cites || !cites.length) {
        await bot.sendMessage(
          msg.chat.id,
          '乃还没有添加城市，用 /add_city <城市名> 来添加一个城市吧！'
        )
        return
      }
      const sentMsg = await bot.sendMessage(msg.chat.id, '请稍候……')
      const cityWeathers = []
      for (const city of cites) {
        try {
          const weatherNow = await getWeatherNow(city, lang)
          const weatherDaily = await getWeatherForecast(city, 'en')
          const formattedWeather = formatWeather(weatherNow, weatherDaily)
          cityWeathers.push({
            lat: weatherNow.basic.lat,
            text: formattedWeather
          })
        } catch (err) {
          cityWeathers.push({
            lat: -Infinity,
            text: `${city}: ${err}`
          })
        }
      }
      cityWeathers.sort((a, b) => (b.lat - a.lat))
      const title = msg.chat.type !== 'private' ? '你群天气：' : '你城天气：'
      await bot.editMessageText(
        `${title}\n${cityWeathers.map(d => d.text).join('\n')}`,
        {
          chat_id: msg.chat.id,
          message_id: sentMsg.message_id
        }
      )
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

    if (msg.chat.type === 'private') await defaultReply(bot, msg)
    return
  }

  if (msg.chat.type !== 'private') return

  // not me
  if (msg.chat.id !== +process.env.GM0) {
    const sentMsg = await bot.sendMessage(msg.chat.id,
      '请回答妹抖酱的问题以完成消息发送\n\n乃将如何授权主人使用乃的消息',
      {
        reply_to_message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '可以引用我的名字转发', callback_data: 'quote fwd' }],
            [{ text: '可以转发内容，不要提我', callback_data: 'anonymous fwd' }],
            [{ text: '请勿转发', callback_data: 'no fwd' }, { text: '算了', callback_data: 'cancel' }]
          ]
        }
      }
    )
    pushSession(sentMsg, 'plain_text')
  } else {
    if (msg.reply_to_message) {
      if (msg.text && msg.reply_to_message.entities) {
        for (const entity of msg.reply_to_message.entities) {
          if (entity.type === 'text_mention') {
            await bot.sendMessage(entity.user.id, msg.text)
            await bot.sendMessage(
              msg.chat.id,
              `已投递给 [${entity.user.id}](tg://user?id=${entity.user.id})。`,
              {
                reply_to_message_id: msg.message_id,
                parse_mode: 'Markdown'
              }
            )
          }
        }
      } else {
        await defaultReply(bot, msg)
      }
    } else {
      await sendTwitter(bot, msg)
    }
  }
})

async function defaultReply (bot, msg) {
  await bot.sendSticker(msg.chat.id, 'CAADBQAD2gYAAvjGxQo7kXhU-BM5fQI', {
    reply_to_message_id: msg.message_id
  })
}
