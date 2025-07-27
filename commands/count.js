const mongoose = require("mongoose");

// MongoDB connection inside the command
const MONGO_URI = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ [count.js] MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const messageCountSchema = new mongoose.Schema({
  threadID: String,
  userID: String,
  name: String,
  count: { type: Number, default: 0 }
});

const MessageCount = mongoose.models.MessageCount || mongoose.model("MessageCount", messageCountSchema);

module.exports = {
  config: {
    name: "count",
    aliases: ["c"],
    version: "1.0",
    author: "Mahmud (WhatsApp MongoDB)",
    countDown: 5,
    role: 0,
    description: "Show message count using MongoDB",
    category: "group",
    guide: "{pn} - your count\n{pn} all - leaderboard\n{pn} @mention - mentioned users"
  },

  onStart: async function ({ api, args, message, event }) {
    try {
      const threadID = event.key.remoteJid;
      const senderID = event.key.participant || event.key.remoteJid;
      const mentions = event.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const isAll = args[0]?.toLowerCase() === "all";

      if (isAll) {
        // Show leaderboard (top 50)
        const allUsers = await MessageCount.find({ threadID }).sort({ count: -1 }).limit(50);
        if (!allUsers.length) return message.reply("❌ No message data found for this group.");

        let msg = "💬 Group Message Leaderboard:\n";
        let index = 1;
        for (const user of allUsers) {
          const rankEmoji = index === 1 ? "🥇" : index === 2 ? "🥈" : index === 3 ? "🥉" : `${index}.`;
          msg += `\n${rankEmoji} ${user.name}: ${user.count}`;
          index++;
        }
        return message.reply(msg);
      }

      // If mentions present, show mentioned users count else show sender count
      const targetIDs = mentions.length ? mentions : [senderID];
      let replyMsg = "";

      for (const id of targetIDs) {
        const userData = await MessageCount.findOne({ threadID, userID: id });
        if (!userData) {
          replyMsg += `\n❌ ${id} has no message data.`;
        } else {
          replyMsg += `\n✅ ${userData.name}: ${userData.count} messages`;
        }
      }

      return message.reply(replyMsg);
    } catch (err) {
      console.error("❌ count command error:", err);
      return message.reply("❌ An error occurred: " + err.message);
    }
  },

  onChat: async function ({ event }) {
    try {
      const threadID = event.key.remoteJid;
      const senderID = event.key.participant || event.key.remoteJid;
      const pushName = event.pushName || "Unknown";

      const existing = await MessageCount.findOne({ threadID, userID: senderID });

      if (!existing) {
        await MessageCount.create({
          threadID,
          userID: senderID,
          name: pushName,
          count: 1
        });
      } else {
        existing.count += 1;
        existing.name = pushName || existing.name;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
