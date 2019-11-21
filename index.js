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

bot.on('callback_query', async callbackQuery => {
  if (!callbackQuery.message) {
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (callbackQuery.message.reply_to_message &&
    callbackQuery.from.id !== callbackQuery.message.reply_to_message.from.id) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '不要碰那里!(｡◕ˇ﹏ˇ◕）对, 对不起, 请原谅我的失礼. 妹抖酱 参上',
      show_alert: true
    })
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
    const result = await bot.editMessageText(
      '会话已过期, 请重新请求. 给您带来不便十分抱歉. 妹抖酱 参上',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
    if (result === true) {
      await bot.editMessageCaption(
        '会话已过期, 请重新请求. 给您带来不便十分抱歉. 妹抖酱 参上',
        {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id
        }
      )
    }
    return
  }
  const { cmd, data } = session

  if (cmd === '/album') {
    const r3 = [
      'AgADBQADxqgxG5pRmFatjowKDEaSnAyEAjMABAEAAwIAA3kAA-CCBQABFgQ',
      'AgADBQADgKoxG17amFa0n08rpj5_oqIxGzMABAEAAwIAA3kAA51ZAAIWBA',
      'AgADBQADxagxG5pRmFbfj8GayajUHruJAjMABAEAAwIAA3kAA7iLBQABFgQ',
      'AgADBQADf6oxG17amFYwS9HD8jNa2iEqGzMABAEAAwIAA3kAA1BaAAIWBA',
      'AgADBQADxKgxG5pRmFaxWYIt5wF6I9AXGzMABAEAAwIAA3kAA5tZAAIWBA',
      'AgADBQADEakxG4zSiFYqCMpqZKHPBMGAAjMABAEAAwIAA3kAAwhtBQABFgQ',
      'AgADBQADEKkxG4zSiFbz586GAs8DLoYzGzMABAEAAwIAA3kAAylEAAIWBA',
      'AgADBQADD6kxG4zSiFYtucZTOKaivtSHAjMABAEAAwIAA3kAA7N1BQABFgQ',
      'AgADBQADw6gxG5pRmFbYl0Jyxmbyt4ktGzMABAEAAwIAA3kAA89YAAIWBA',
      'AgADBQADfqoxG17amFbq0gnuXYyqIdQhGzMABAEAAwIAA3gAAxhbAAIWBA'
    ]
    const r15 = [
      'AgADBQADEqkxG4zSiFauKsyEHW_-LBQ0GzMABAEAAwIAA3kAA39FAAIWBA',
      'AgADBQADkKkxGyYhiVaInczSkHYfknqFAjMABAEAAwIAA3kAA09uBQABFgQ',
      'AgADBQADFKkxG4zSiFbeRT0Mt1wbEIqMAjMABAEAAwIAA3kAAwRyBQABFgQ',
      'AgADBQADFqkxG4zSiFYAAffYENOsvQS7ExszAAQBAAMCAAN5AANYRAACFgQ',
      'AgADBQADF6kxG4zSiFYgeyqH7I5yRRguGzMABAEAAwIAA3kAAwJGAAIWBA',
      'AgADBQADgaoxG17amFaEkbGpylkizGAyGzMABAEAAwIAA3kAA8xZAAIWBA',
      'AgADBQADi6oxG17amFbEUlYUIaL-KNkfGzMABAEAAwIAA3kAA-laAAIWBA',
      'AgADBQADFakxG4zSiFbco-vY2HWTgpsnGzMABAEAAwIAA3kAA3BEAAIWBA',
      'AgADBQADpqkxGyYhkVYGjBevxgQpab4RGzMABAEAAwIAA3kAA5lZAAIWBA',
      'AgADBQADgqoxG17amFY6sp5NbPtMUd2KAjMABAEAAwIAA3kAAz2JBQABFgQ'
    ]
    const r15g = [
      'AgADBQADl6oxG17amFaWlPN_Orn1CwhAGzMABAEAAwIAA3kAA19dAAIWBA',
      'AgADBQADmKoxG17amFat5O8cG8NMvDgqGzMABAEAAwIAA3kAA8BbAAIWBA',
      'AgADBQAD2KgxG5pRmFafHuKtlk9LEmYtGzMABAEAAwIAA3kAA09bAAIWBA',
      'AgADBQAD0KgxG5pRmFZSZTkXyILcYNg8GzMABAEAAwIAA3kAAwFaAAIWBA',
      'AgADBQADkakxGyYhiVbI9uzGJJhpkSkZGzMABAEAAwIAA3gAA8pEAAIWBA',
      'AgADBQADhqoxG17amFY6pfIG64n5U8U9GzMABAEAAwIAA3kAA_daAAIWBA',
      'AgADBQADh6oxG17amFbuyZn-pTwJ6_4eGzMABAEAAwIAA3kAA2daAAIWBA',
      'AgADBQADGqkxG4zSiFbrgx3P74dB53MrGzMABAEAAwIAA3kAAyxFAAIWBA',
      'AgADBQADGakxG4zSiFaKm9cTEzlEEZaAAjMABAEAAwIAA3kAAztxBQABFgQ',
      'AgADBQADz6gxG5pRmFbAw5nqnRtFeuEuGzMABAEAAwIAA3kAA-FYAAIWBA'
    ]
    const toSend = callbackQuery.data === 'r3'
      ? r3 : callbackQuery.data === 'r15'
        ? r15 : r15g
    for (let i = 0; i * 10 < toSend.length; i++) {
      await bot.sendMediaGroup(
        callbackQuery.message.chat.id,
        toSend.slice(i * 10, i * 10 + 10).map(s => ({ type: 'photo', media: s }))
      )
    }
    await bot.answerCallbackQuery(callbackQuery.id)
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
    const { cites, cityWeathers } = data
    await bot.editMessageReplyMarkup(null, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id
    })
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '妹抖酱正在重试拉取更新, 请, 请您稍……( >﹏<。)候'
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

  if (cmd === 'plain_text') {
    if (callbackQuery.data !== 'cancel') {
      const fwdMsg = await bot.forwardMessage(
        +process.env.GM0,
        callbackQuery.message.chat.id,
        callbackQuery.message.reply_to_message.message_id
      )
      await bot.sendMessage(
        +process.env.GM0,
        `来自用户 [${callbackQuery.from.id}](tg://user?id=${callbackQuery.from.id}) , 转发授权: ${callbackQuery.data}`,
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
      callbackQuery.data !== 'cancel' ? '妹抖酱已经把主人大人的指示上报啦!\\(๑╹◡╹๑)ﾉ♬ 妹抖酱 参上' : '您刚刚取消了发送ヽ(*。>Д<)o゜ 妹抖酱 参上',
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id
      }
    )
  }
  delete store.state.session[callbackQuery.message.chat.id + ''][callbackQuery.message.message_id]
  await store.save()
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
        `◎ 公用女仆绒布球兼梨子前辈的私人助理天气酱\n◎ 可播报天气\n◎ 私聊咱可代为主人传达消息\n◎ [胖次](https://github.com/rikakomoe/makurabot)\n◎ 原型是[东风谷早苗](https://zh.moegirl.org/zh-hans/%E4%B8%9C%E9%A3%8E%E8%B0%B7%E6%97%A9%E8%8B%97)\n\n${statistic}\n\n妹抖酱 参上`,
        {
          parse_mode: 'Markdown'
        }
      )
      return
    }

    if (cmd === '/album') {
      const sentMsg = await bot.sendPhoto(msg.chat.id, 'AgADBQADx6gxG5pRmFastHk5utJeOMsvGzMABAEAAwIAA3gAAyRaAAIWBA', {
        caption: '点击下面的按钮可以获得由画师[宮瀬まひろ](https://twitter.com/miyase_mahiro)创作的[东风谷早苗](https://zh.moegirl.org/zh-hans/%E4%B8%9C%E9%A3%8E%E8%B0%B7%E6%97%A9%E8%8B%97)插画, 主人大人若是喜欢的话请[买本子](http://www.77haru.com/)支持TA~',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '去幼儿园!', callback_data: 'r3' }, { text: '去小学!', callback_data: 'r15' }, { text: '去中学!', callback_data: 'r15g' }]
          ]
        }
      })
      await pushSession(sentMsg, cmd)
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
    if (cmd === '/add_city' || cmd === '/remove_city') {
      if (!store.state.weather[msg.chat.id + '']) {
        store.state.weather[msg.chat.id + ''] = []
        await bot.sendMessage(
          msg.chat.id,
          '来自 [MMM](https://scleox.github.io/Wearable-Technology/#%E9%81%93%E5%85%B7%E9%9B%86/%E7%8E%B0%E4%BB%A3%E5%A5%B3%E4%BB%86%E7%AE%A1%E7%90%86%E7%B3%BB%E7%BB%9F.html) (Modern Maid Manager, 现代女仆管理系统) 的消息:\nPlease note that this bot is for personal and gentle use only. Due to the limitation of a free weather API plan this bot uses, if you or your group add a large number of cities, or make too frequent requests, you may be banned from using this bot unconditionally and without notice. If you need to use the bot heavily, please talk to this bot about that in private.\n妹抖酱参上',
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          }
        )
        await store.save()
      }
      const args = msg.text
        .substr(cmdEntity.offset + cmdEntity.length).trim()
      const sentMsg = await bot.sendMessage(msg.chat.id, '请您稍候, 妹抖酱正在帮您查询中……', {
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
        result.length === 0 ? '没有找到您查询的城市, 真的非常抱歉. 妹抖酱 参上'
          : result.length === 1 ? '久等了, 是这里吗? 妹抖酱 参上'
            : '久等了, 是哪一个呢?  妹抖酱 参上',
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
      const sentMsg = await bot.sendMessage(msg.chat.id, '妹抖酱正在拉取更新……请您稍等')
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
        await bot.sendMessage(msg.chat.id, '打扰了๐·°(৹˃̵﹏˂̵৹)°·๐非常抱歉. 妹抖酱 参上', {
          reply_to_message_id: msg.message_id
        })
      } else { // switch to on
        if (!store.state.weather[msg.chat.id + ''] || store.state.weather[msg.chat.id + ''].length === 0) {
          await bot.sendMessage(msg.chat.id, '您还没有添加城市, 用 /add_city <城市名> 来添加一个城市吧! 妹抖酱 参上', {
            reply_to_message_id: msg.message_id
          })
          return
        }
        for (const cid of store.state.weather[msg.chat.id + '']) {
          await addWeatherPushCity(cid, msg.chat.id)
        }
        await bot.sendMessage(msg.chat.id, '妹抖酱今后每天都会跟主人问好, 记得回复哦~(*ෆ´ ˘ `ෆ*)♡ 妹抖酱 参上', {
          reply_to_message_id: msg.message_id
        })
      }
      return
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
    }
  }

  if (msg.chat.type !== 'private') return

  // not me
  if (msg.chat.id !== +process.env.GM0) {
    const sentMsg = await bot.sendMessage(msg.chat.id,
      '妹抖酱将把主人大人的重要指示上报到 [MMM](https://scleox.github.io/Wearable-Technology/#%E9%81%93%E5%85%B7%E9%9B%86/%E7%8E%B0%E4%BB%A3%E5%A5%B3%E4%BB%86%E7%AE%A1%E7%90%86%E7%B3%BB%E7%BB%9F.html) (Modern Maid Manager, 现代女仆管理系统), 在此之前, 请您先回答问题\n\n您将如何授权 MMM 及其委托方使用您的消息',
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_to_message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '可以引用我的名字转发', callback_data: 'quote fwd' }],
            [{ text: '可以转发内容, 不要提我', callback_data: 'anonymous fwd' }],
            [{ text: '请勿转发', callback_data: 'no fwd' }, { text: '算了', callback_data: 'cancel' }]
          ]
        }
      }
    )
    await pushSession(sentMsg, 'plain_text')
  } else {
    if (msg.reply_to_message) {
      if (msg.text && msg.reply_to_message.entities) {
        for (const entity of msg.reply_to_message.entities) {
          if (entity.type === 'text_mention') {
            await bot.sendMessage(entity.user.id, msg.text)
            await bot.sendMessage(
              msg.chat.id,
              `已投递给 [${entity.user.id}](tg://user?id=${entity.user.id}).`,
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
    }
  }
})

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
    if (!isFinal) result = `${result}\n妹抖酱仍在拉取更新……感谢您的耐心(´;ω;)`
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
        const weatherForecast = await getWeatherForecast(cid, 'zh')
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
  let retryCnt = 4
  while (true) {
    try {
      forecast = await getWeatherForecast(cid, 'zh')
      break
    } catch (err) {
      if (retryCnt > 0 && err.name === 'TimeoutError') retryCnt--
      else {
        console.warn('skipped weather push due to error')
        delete store.state.weatherPush[cid].yesterday
        await store.save()
        checkAndScheduleWeatherPush(cid)
        return
      }
    }
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
  store.state.weatherPush[cid].yesterday = forecast.daily_forecast[0]
  await store.save()
  checkAndScheduleWeatherPush(cid)
}

async function checkAndScheduleWeatherPush (cid) {
  let forecast
  try {
    forecast = await getWeatherForecast(cid, 'zh')
  } catch (err) {
    setTimeout(() => checkAndScheduleWeatherPush(cid), 60000)
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
