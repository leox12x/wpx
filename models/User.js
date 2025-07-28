const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  coins: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastActive: { type: Number, default: Date.now },
  commandCount: { type: Number, default: 0 },
  lastDailyReward: { type: String, default: null }, // ✅ fixed: changed from Number to String
  joinDate: { type: Number, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
