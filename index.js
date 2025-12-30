const Discord = require('discord.js-selfbot-v13');
const express = require('express');
const client = new Discord.Client();
const app = express();

// Render'ın portunu dinle veya 3000 kullan
const port = process.env.PORT || 3000;

// Cron-job.org için HTTP sunucusu
app.get('/', (req, res) => {
  res.send('Bot Aktif!');
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda hazır.`);
});

client.on('ready', () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

// Token'ı Render Environment Variables kısmına ekle
client.login(process.env.TOKEN);
