const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  kufurEngel: { type: Boolean, default: false },
  linkEngel: { type: Boolean, default: false },
  reklamEngel: { type: Boolean, default: false }
});

module.exports = mongoose.model('Guild', GuildSchema);
