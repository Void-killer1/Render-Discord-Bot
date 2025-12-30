const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { Strategy } = require('passport-discord');
const path = require('path');
const Guild = require('./models/Guild');

const client = new Client({ intents: [3276799] });
const app = express();

// Database
mongoose.connect(process.env.MONGO_URI);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Auth
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ['identify', 'guilds']
}, (at, rt, profile, done) => done(null, profile)));

app.use(session({ secret: 'guard-bot-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
app.get('/', (req, res) => res.render('index', { user: req.user }));
app.get('/login', passport.authenticate('discord'));
app.get('/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
  if (!req.user) return res.redirect('/login');
  const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
  res.render('dashboard', { user: req.user, guilds: adminGuilds });
});

app.get('/manage/:id', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  const isAuth = req.user.guilds.find(g => g.id === req.params.id && (g.permissions & 0x8) === 0x8);
  if (!isAuth) return res.send("Yetkin yok!");

  let data = await Guild.findOne({ guildId: req.params.id }) || await Guild.create({ guildId: req.params.id });
  res.render('manage', { guild: isAuth, data });
});

app.post('/manage/:id', async (req, res) => {
  await Guild.findOneAndUpdate(
    { guildId: req.params.id },
    { 
      kufurEngel: !!req.body.kufur, 
      linkEngel: !!req.body.link,
      reklamEngel: !!req.body.reklam 
    }
  );
  res.redirect(`/manage/${req.params.id}`);
});

// --- BOT GUARD ---
const yasakli = ["amk", "mal", "aq", "orospu", "pezevenk"]; // Önceki listenin tamamını buraya koy

client.on('messageCreate', async (msg) => {
  if (!msg.guild || msg.author.bot || msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
  
  const data = await Guild.findOne({ guildId: msg.guild.id });
  if (!data) return;

  const content = msg.content.toLowerCase();
  let sil = false;

  if (data.kufurEngel && yasakli.some(k => content.includes(k))) sil = true;
  if (data.linkEngel && /(https?:\/\/|www\.)/.test(content)) sil = true;

  if (sil) {
    msg.delete().catch(() => {});
    msg.channel.send(`⚠️ **${msg.author.username}**, Yasaklı içerik tespit edildi!`).then(m => setTimeout(() => m.delete(), 2000));
  }
});

client.login(process.env.TOKEN);
app.listen(process.env.PORT || 3000);
