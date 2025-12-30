const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Render ve Cron-job.org için canlı tutma sistemi
app.get('/', (req, res) => res.send('Bot Durumu: Aktif 🚀'));
app.listen(process.env.PORT || 3000, () => console.log("Ping sunucusu hazır."));

client.on('ready', () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  client.user.setActivity('!yardım | Render 7/24');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'ping':
      message.reply(`🏓 Pong! Gecikme: **${client.ws.ping}ms**`);
      break;

    case 'sil':
      if (!message.member.permissions.has('ManageMessages')) return message.reply('Yetkin yok!');
      const miktar = parseInt(args[0]);
      if (!miktar || miktar < 1 || miktar > 100) return message.reply('1-100 arası sayı gir!');
      await message.channel.bulkDelete(miktar + 1);
      message.channel.send(`✅ ${miktar} mesaj temizlendi.`).then(m => setTimeout(() => m.delete(), 3000));
      break;

    case 'yardım':
      const yardımEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('🤖 Bot Komutları')
        .setDescription('`!ping` - Gecikmeyi ölçer\n`!sil [sayı]` - Mesajları temizler\n`!profil` - Bilgilerini gösterir');
      message.reply({ embeds: [yardımEmbed] });
      break;

    case 'profil':
      const user = message.mentions.users.first() || message.author;
      message.reply(`👤 **Kullanıcı:** ${user.username}\n🆔 **ID:** ${user.id}`);
      break;
  }
});

// Render'da Environment Variables kısmına TOKEN eklemeyi unutma!
client.login(process.env.TOKEN);
