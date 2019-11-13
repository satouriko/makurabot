const Twitter = require('twitter')

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

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

module.exports = {
  sendTwitter
}
