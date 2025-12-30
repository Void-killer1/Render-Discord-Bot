const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');

// Şemayı dosya hatası olmaması için buraya gömüyoruz (Kısa ve öz)
const Guild = mongoose.model('Guild', new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  kufurEngel: { type: Boolean, default: false },
  linkEngel: { type: Boolean, default: false }
}));

const client = new Client({ intents: [3276799] });
const app = express();

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Bağlantısı Başarılı"))
  .catch(err => console.error("❌ MongoDB Hatası:", err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Auth Ayarları
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ['identify', 'guilds']
}, (at, rt, profile, done) => done(null, profile)));

app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// --- ROTALAR (ROUTES) ---
app.get('/', (req, res) => res.send('Bot ve Panel Çalışıyor! <a href="/login">Giriş Yap</a>'));

app.get('/login', passport.authenticate('discord'));

app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
  res.send(`<h1>Hoş geldin ${req.user.username}</h1>` + adminGuilds.map(g => `<p>${g.name} - <a href="/manage/${g.id}">Yönet</a></p>`).join(''));
});

app.get('/manage/:id', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const guildId = req.params.id;
  let data = await Guild.findOne({ guildId }) || await Guild.create({ guildId });
  res.send(`<h2>Sunucu: ${guildId}</h2><form method="POST">Küfür Engel: <input type="checkbox" name="kufur" ${data.kufurEngel ? 'checked' : ''}><button>Kaydet</button></form>`);
});

app.post('/manage/:id', async (req, res) => {
  await Guild.findOneAndUpdate({ guildId: req.params.id }, { kufurEngel: !!req.body.kufur });
  res.redirect('/dashboard');
});

// Bot Girişi
client.login(process.env.TOKEN).catch(err => console.error("❌ Bot Token Hatası:", err));
app.listen(process.env.PORT || 3000);
