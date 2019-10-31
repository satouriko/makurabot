const TelegramBot = require('node-telegram-bot-api')
const Twitter = require('twitter')

const bot = new TelegramBot(process.env.TOKEN, { polling: true })

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

bot.on('callback_query', async callbackQuery => {
  if (!callbackQuery.message) {
    await bot.answerCallbackQuery(callbackQuery.id)
    return
  }

  if (callbackQuery.from.id !== callbackQuery.message.reply_to_message.from.id) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '不要！',
      show_alert: true
    })
    return
  }

  if (callbackQuery.data !== 'cancel') {
    const fwdMsg = await bot.forwardMessage(
      +process.env.ID,
      callbackQuery.message.chat.id,
      callbackQuery.message.reply_to_message.message_id
    )
    await bot.sendMessage(
      +process.env.ID,
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

  await bot.answerCallbackQuery(callbackQuery.id)
})

bot.on('edited_message', async msg => {
  // bot command
  if (msg.entities && msg.entities.length &&
    msg.entities.findIndex(e => e.type === 'bot_command') !== -1) {
    await defaultReply(bot, msg)
    return
  }

  // not me
  if (msg.chat.id !== +process.env.ID) {
    const fwdMsg = await bot.forwardMessage(
      +process.env.ID,
      msg.chat.id,
      msg.message_id
    )
    await bot.sendMessage(
      +process.env.ID,
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
    await defaultReply(bot, msg)
    return
  }

  // not me
  if (msg.chat.id !== +process.env.ID) {
    await bot.sendMessage(msg.chat.id,
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

async function sendTwitter (bot, msg) {
  // text message
  if (msg.text) {
    try {
      const tweet = await client.post('statuses/update', { status: msg.text })
      console.log(tweet)
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
