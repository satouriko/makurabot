const TelegramBot = require('node-telegram-bot-api')
const Twitter = require('twitter')

const bot = new TelegramBot(process.env.TOKEN, { polling: true })

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

bot.on('message', msg => {

  // not me
  if (msg.chat.id !== +process.env.ID) {
    defaultReply(bot, msg)
    return
  }

  // bot command
  if (msg.entities && msg.entities.length
    && msg.entities.findIndex(e => e.type === 'bot_command') !== -1) {
    defaultReply(bot, msg)
    return
  }

  // text message
  if (msg.text) {
    client.post('statuses/update', { status: msg.text })
      .then(tweet => {
        console.log(tweet)
        bot.sendMessage(msg.chat.id,
          `推文已发送。https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
          { reply_to_message_id: msg.message_id }
        )
      })
      .catch(err => {
        console.error(err)
        bot.sendMessage(msg.chat.id,
          `推文发送失败。${err.toString()}`,
          { reply_to_message_id: msg.message_id }
        )
      })
    return
  }

  defaultReply(bot, msg)

})

function defaultReply(bot, msg) {
  bot.sendSticker(msg.chat.id, 'CAADBQAD2gYAAvjGxQo7kXhU-BM5fQI', {
    reply_to_message_id: msg.message_id,
  })
}
