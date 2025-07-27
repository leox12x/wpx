const mongoose = require("mongoose");

// ✅ MongoDB Connect (Inside Command)
const MONGO_URI = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ [count.js] MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// ✅ Schema and Model
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
    author: "Mahmud (MongoDB CMD version)",
    countDown: 5,
    role: 0,
    description: "Show message count from MongoDB",
    category: "group",
    guide: "{pn} - Show your count\n{pn} all - All members\n{pn} @mention - Mentioned users"
  },

  onStart: async function ({ api, args, message, event }) {
    const { threadID, senderID, mentions } = event;
    const mentionIDs = Object.keys(mentions || {});
    const isAll = args[0]?.toLowerCase() === "all";

    try {
      if (isAll) {
        const all = await MessageCount.find({ threadID }).sort({ count: -1 }).limit(50);
        if (!all.length) return message.reply("❌ No message data found for this group.");

        let msg = "💬 Group Message Leaderboard:\n";
        let index = 1;
        for (const item of all) {
          const rank = index === 1 ? "🥇" : index === 2 ? "🥈" : index === 3 ? "🥉" : `${index}.`;
          msg += `\n${rank} ${item.name}: ${item.count}`;
          index++;
        }
        return message.reply(msg);
      }

      const targetIDs = mentionIDs.length ? mentionIDs : [senderID];
      let msg = "";

      for (const id of targetIDs) {
        const data = await MessageCount.findOne({ threadID, userID: id });
        if (!data) {
          msg += `\n❌ ${mentions[id] || "User"} has no data.`;
        } else {
          msg += `\n✅ ${data.name}: ${data.count} messages`;
        }
      }

      return message.reply(msg);

    } catch (err) {
      console.error("❌ Error in count.js:", err);
      return message.reply("❌ An error occurred: " + err.message);
    }
  },

  onChat: async function ({ event }) {
    const { threadID, senderID, pushName } = event;

    try {
      const existing = await MessageCount.findOne({ threadID, userID: senderID });

      if (!existing) {
        await MessageCount.create({
          threadID,
          userID: senderID,
          name: pushName || "Unknown",
          count: 1
        });
      } else {
        existing.count += 1;
        existing.name = pushName || existing.name;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err.message);
    }
  }
};
