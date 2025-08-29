const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  coins: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastActive: { type: Date, default: Date.now },
  commandCount: { type: Number, default: 0 },
  lastDailyReward: { type: Date, default: null },
  joinDate: { type: Date, default: Date.now },

  // limiter fields (initialized by getUserData if missing)
  slots: {
    count: { type: Number, default: 0 },
    firstSlot: { type: Date, default: null }
  },

  dice: {
    count: { type: Number, default: 0 },
    firstRoll: { type: Date, default: null }
  },

  roulette: {
    count: { type: Number, default: 0 },
    firstPlay: { type: Date, default: null }
  }
});

module.exports = mongoose.model("User", userSchema);
