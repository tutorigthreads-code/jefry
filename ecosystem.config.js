module.exports = {
  apps: [{
    name: 'telegram-bot',
    script: 'bot.js',
    env: {
      BOT_TOKEN: process.env.BOT_TOKEN
    }
  }]
}
