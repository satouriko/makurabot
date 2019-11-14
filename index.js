const TelegramBot = require('node-telegram-bot-api')
const Twitter = require('twitter')
const fetch = require('node-fetch')
const store = require('./store')
const { getWeatherNow, getWeatherForecast, queryCity } = require('./heweather')
const { formatWeather, formatLegend } = require('./format_weather')

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

const bot = new TelegramBot(process.env.TOKEN, { polling: true })

bot.on('callback_query', async callbackQuery => {
  if (!callbackQuery.message) {
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (callbackQuery.message.reply_to_message &&
      callbackQuery.from.id !== callbackQuery.message.reply_to_message.from.id) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '不要碰那里!(｡◕ˇ﹏ˇ◕）啊, 请原谅我的失礼. 妹抖酱 参上',
      show_alert: true
    })
    return
  }

  let session
  if (store.state.session[callbackQuery.message.chat.id + ''] &&
    store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  ) {
    session = store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  } else {
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.editMessageText(
      '会话已过期, 请重新请求. 给您带来不便十分抱歉. 妹抖酱 参上',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    return
  }
  const { cmd, data } = session

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
      '妹抖酱已经把您的城市加上惹!ଘ(੭ˊᵕˋ)੭* ੈ✩‧₊˚ 妹抖酱 参上',
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
      deleted ? '妹抖酱已经帮您把城市删惹!๐·°(৹˃̵﹏˂̵৹)°·๐ 妹抖酱 参上' : '您有订阅这个城市吗(´｀;) ？ 妹抖酱 参上',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (cmd === '/weather' || cmd === '/tenki' || cmd === '/tianqi') {
    const cites = data
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '妹抖酱正在重试拉取更新, 请, 请您稍……( >﹏<。)候'
    })
    await queryWeather(callbackQuery.message, cmd, cites)
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
    callbackQuery.data !== 'cancel' ? '妹抖酱已经把您的指示传达给主人啦!\\(๑╹◡╹๑)ﾉ♬ 妹抖酱 参上' : '您刚刚取消了发送ヽ(*。>Д<)o゜ 妹抖酱 参上',
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
        '梨子的私人助理妹抖天气酱; 可播报天气; 私聊咱可代为主人传达消息; 裙底有[胖次](https://github.com/rikakomoe/makurabot)偷窥是变态(口嫌体直); 妹抖酱 参上',
        {
          parse_mode: 'Markdown'
        }
      )
      return
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
      const sentMsg = await bot.sendMessage(msg.chat.id, '请您稍候, 妹抖酱正在帮您查询中……', {
        reply_to_message_id: msg.message_id
      })
      try {
        const result = await queryCity(args)
        await bot.editMessageText(
          result.length === 0 ? '没有找到您查询的城市, 真的非常抱歉. 妹抖酱 参上'
            : result.length === 1 ? '久等了, 是这里吗? 妹抖酱 参上'
              : '久等了，是哪一个呢?  妹抖酱 参上',
          {
            chat_id: msg.chat.id,
            message_id: sentMsg.message_id
          }
        )
        if (result.length > 0) {
          pushSession(sentMsg, cmd)
          await bot.editMessageReplyMarkup({
            inline_keyboard: result.map(city => (
              [{ text: city.fullname, callback_data: city.cid }]
            ))
          }, {
            chat_id: msg.chat.id,
            message_id: sentMsg.message_id
          })
        }
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
      const cites = store.state.weather[msg.chat.id + '']
      if (!cites || !cites.length) {
        await bot.sendMessage(
          msg.chat.id,
          '您还没有添加城市, 用 /add_city <城市名> 来添加一个城市吧! 妹抖酱 参上'
        )
        return
      }
      const sentMsg = await bot.sendMessage(msg.chat.id, '妹抖酱正在拉取更新……请您稍作休息')
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

    if (msg.chat.type === 'private') await defaultReply(bot, msg)
    return
  }

  if (msg.chat.type !== 'private') return

  // not me
  if (msg.chat.id !== +process.env.GM0) {
    const sentMsg = await bot.sendMessage(msg.chat.id,
      '妹抖酱会把您的重要指示报告给主人, 请您先回答问题\n\n您将如何授权主人使用您的消息',
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
      // send twitter
      if (msg.text) {
        try {
          const tweet = await client.post('statuses/update', { status: msg.text })
          await bot.sendMessage(msg.chat.id,
            `推文已发送。https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
            { reply_to_message_id: msg.message_id }
          )
        } catch (err) {
          console.error(err)
          await bot.sendMessage(msg.chat.id,
            `推文发送失败。${err.toString()}`,
            { reply_to_message_id: msg.message_id }
          )
        }
      } else {
        await bot.sendMessage(msg.chat.id,
          '暂不支持这种格式的推文。',
          { reply_to_message_id: msg.message_id }
        )
      }
    }
  }
})

function pushSession (sentMsg, cmd, data) {
  if (!store.state.session[sentMsg.chat.id + '']) {
    store.state.session[sentMsg.chat.id + ''] = {}
  }
  store.state.session[sentMsg.chat.id + ''][sentMsg.message_id + ''] = { cmd, data }
}

async function queryWeather (sentMsg, cmd, cites) {
  const lang = cmd === '/weather' ? 'en'
    : cmd === '/tenki' ? 'ja' : 'zh'
  const cityWeathers = []
  let error
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
      error = true
    }
  }
  cityWeathers.sort((a, b) => (b.lat - a.lat))
  const title = sentMsg.chat.type !== 'private' ? '你群天气：' : '你城天气：'
  await bot.editMessageText(
    `${title}\n${cityWeathers.map(d => d.text).join('\n')}`,
    {
      chat_id: sentMsg.chat.id,
      message_id: sentMsg.message_id
    }
  )
  if (error) {
    pushSession(sentMsg, cmd, cites)
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

async function defaultReply (bot, msg) {
  await bot.sendSticker(msg.chat.id, 'CAADBQAD2gYAAvjGxQo7kXhU-BM5fQI', {
    reply_to_message_id: msg.message_id
  })
}
