const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();

// Cron-job.org pingleri için HTTP sunucusu
app.get('/', (req, res) => res.send('Bot 7/24 Aktif!'));
app.listen(process.env.PORT || 3000, () => console.log("Ping sunucusu hazır."));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
});

client.on('messageCreate', (message) => {
  if (message.content === '!ping') {
    message.reply('Pong! 🏓');
  }
});

client.login(process.env.TOKEN);
