const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');

// MongoDB Şeması
const Guild = mongoose.model('Guild', new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  kufurEngel: { type: Boolean, default: false },
  linkEngel: { type: Boolean, default: false }
}));

const client = new Client({ intents: [3276799] });
const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Bağlantısı Başarılı"))
  .catch(err => console.error("❌ MongoDB Hatası:", err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ['identify', 'guilds']
}, (at, rt, profile, done) => done(null, profile)));

app.use(session({ secret: 'guard-secret-123', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// --- DASHBOARD ROTALARI ---
app.get('/', (req, res) => res.render('index', { user: req.user }));
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
  res.render('dashboard', { user: req.user, guilds: adminGuilds, client });
});

app.get('/manage/:id', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const isAuth = req.user.guilds.find(g => g.id === req.params.id && (g.permissions & 0x8) === 0x8);
  if (!isAuth || !client.guilds.cache.has(req.params.id)) return res.redirect('/dashboard');

  let data = await Guild.findOne({ guildId: req.params.id }) || await Guild.create({ guildId: req.params.id });
  res.render('manage', { guild: isAuth, data });
});

app.post('/manage/:id', async (req, res) => {
  await Guild.findOneAndUpdate({ guildId: req.params.id }, { 
    kufurEngel: !!req.body.kufur,
    linkEngel: !!req.body.link 
  });
  res.redirect('/dashboard');
});

// --- GUARD SİSTEMİ ---
const yasakli = ["amk", "amınakoyayım", "mal", "şerefsiz", "it", "köpek", "salak", "gerizekalı", "orospu", "faişe", "angut", "aq", "oe", "pezevenk", "œ", "31", "meme", "yarak", "yarrak", "göt", "sik", "siktir"];

client.on('messageCreate', async (msg) => {
  if (!msg.guild || msg.author.bot || msg.member.permissions.has(PermissionFlagsBits.Administrator)) return;
  
  const data = await Guild.findOne({ guildId: msg.guild.id });
  if (!data) return;

  const cleanContent = msg.content.toLowerCase().replace(/\s+/g, ''); // "a m k" yazsa bile yakalar
  
  if (data.kufurEngel && yasakli.some(k => cleanContent.includes(k))) {
    await msg.delete().catch(() => {});
    return msg.channel.send(`⚠️ **${msg.author.username}**, sunucuda küfür yasak!`).then(m => setTimeout(() => m.delete(), 3000));
  }
});

client.login(process.env.TOKEN);
app.listen(process.env.PORT || 3000);
      
