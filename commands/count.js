const mongoose = require("mongoose");
const MessageCount = require("../models/MessageCount");

// MongoDB Connect (you can move this to a separate file if needed)
mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports = {
  config: {
    name: "count",
    aliases: ["c"],
    version: "2.0",
    author: "MahMUD (mod from NTKhang)",
    countDown: 5,
    role: 0,
    description: "Count user's message from DB",
    category: "group",
    guide: "count, count all"
  },

  onStart: async function ({ message, event, args }) {
    const { threadID, senderID, mentions } = event;

    if (args[0] && args[0].toLowerCase() === "all") {
      const allCounts = await MessageCount.find({ threadID });

      if (!allCounts.length) return message.reply("❌ No message records found in this group.");

      allCounts.sort((a, b) => b.count - a.count);
      let msg = "📊 Message Count Leaderboard:\n";

      allCounts.forEach((user, i) => {
        let rank = i + 1;
        let emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
        msg += `${emoji} ${user.name || "Unknown"}: ${user.count} messages\n`;
      });

      return message.reply(msg);
    }

    if (Object.keys(mentions).length > 0) {
      let replyMsg = "";

      for (const id in mentions) {
        const data = await MessageCount.findOne({ threadID, userID: id });
        if (data) {
          replyMsg += `👤 ${data.name}: ${data.count} messages\n`;
        } else {
          replyMsg += `👤 ${mentions[id]}: No messages recorded.\n`;
        }
      }

      return message.reply(replyMsg);
    }

    // Default: Show user's own message count
    const self = await MessageCount.findOne({ threadID, userID: senderID });

    if (!self) return message.reply("😶 You haven't sent any message yet.");
    return message.reply(`📈 You have sent ${self.count} messages in this group.`);
  },

  onChat: async function ({ event }) {
    const { threadID, senderID } = event;

    const existing = await MessageCount.findOne({ threadID, userID: senderID });

    if (existing) {
      existing.count += 1;
      await existing.save();
    } else {
      await MessageCount.create({
        threadID,
        userID: senderID,
        name: event.pushName || "Unknown",
        count: 1
      });
    }
  }
};
