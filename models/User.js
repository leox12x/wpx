const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // WhatsApp ID
  name: { type: String, default: "" },                // User's display name
  coins: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastActive: { type: Number, default: Date.now },
  commandCount: { type: Number, default: 0 },
  lastDailyReward: { type: String, default: null },
  joinDate: { type: Number, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
