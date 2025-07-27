const mongoose = require("mongoose");

if (!mongoose.connection.readyState) {
  mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log("✅ MongoDB connected for count command"))
    .catch(err => console.error("❌ MongoDB connection error:", err));
}

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
    version: "1.0",
    author: "MahMUD",
    role: 0,
    shortDescription: "Count user's messages",
    longDescription: "Tracks how many messages a user has sent in a group",
    category: "utility",
    guide: {
      en: "{pn} - show your count\n{pn} all - group leaderboard"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const threadID = event.threadID;
      const userID = event.senderID;

      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID]?.name || "Unknown";

      if (args[0]?.toLowerCase() === "all") {
        const allUsers = await MessageCount.find({ threadID }).sort({ count: -1 }).limit(50);
        if (!allUsers.length)
          return api.sendMessage("❌ No message data found for this group.", threadID, event.messageID);

        let msg = "📊 Message Leaderboard:\n";
        let index = 1;
        for (const user of allUsers) {
          const rank = index === 1 ? "🥇" : index === 2 ? "🥈" : index === 3 ? "🥉" : `${index}.`;
          msg += `\n${rank} ${user.name}: ${user.count} msg`;
          index++;
        }
        return api.sendMessage(msg, threadID, event.messageID);
      }

      const userData = await MessageCount.findOne({ threadID, userID });
      if (!userData)
        return api.sendMessage(`❌ No message data found for you.`, threadID, event.messageID);

      return api.sendMessage(`✅ ${userName}, you have sent ${userData.count} messages in this group.`, threadID, event.messageID);
    } catch (err) {
      console.error("❌ count command error:", err);
      return api.sendMessage("❌ An error occurred: " + err.message, event.threadID, event.messageID);
    }
  },

  onChat: async function ({ event, api }) {
    try {
      const threadID = event.threadID;
      const userID = event.senderID;

      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID]?.name || "Unknown";

      const existing = await MessageCount.findOne({ threadID, userID });
      if (!existing) {
        await MessageCount.create({
          threadID,
          userID,
          name: userName,
          count: 1
        });
      } else {
        existing.count += 1;
        existing.name = userName || existing.name;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
