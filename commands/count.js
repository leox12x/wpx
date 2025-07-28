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
    aliases: ["msgcount", "messages", "c"],
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    shortDescription: "Count user's messages",
    longDescription: "Tracks how many messages each user sends in a WhatsApp group",
    category: "group",
    guide: {
      en: "{pn} - Show your message count\n{pn} all - Show leaderboard"
    }
  },

  onStart: async function ({ message, args, command }) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat?.id?._serialized;
      const userID = contact?.id?._serialized;
      const userName = contact?.pushname || "Unknown";
      const commandName = command?.config?.name || "unknown";

      // Safely track command usage
      if (userID) {
        if (!global.commandCount) global.commandCount = {};
        if (!global.commandCount[userID]) global.commandCount[userID] = {};
        if (!global.commandCount[userID][commandName]) global.commandCount[userID][commandName] = 0;
        global.commandCount[userID][commandName]++;
      }

      if (!threadID || !userID) return message.reply("❌ Unable to identify user or group.");

      if (args[0]?.toLowerCase() === "all") {
        const allUsers = await MessageCount.find({ threadID }).sort({ count: -1 }).limit(50);
        if (!allUsers.length)
          return message.reply("❌ No message data found for this group.");

        let msg = "📊 Group Message Leaderboard:\n";
        allUsers.forEach((user, i) => {
          const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          msg += `\n${rank} ${user.name}: ${user.count} msg`;
        });

        return message.reply(msg);
      }

      const userData = await MessageCount.findOne({ threadID, userID });

      if (!userData)
        return message.reply("❌ No message data found for you.");

      return message.reply(`✅ ${userName}, you have sent ${userData.count} messages in this group.`);
    } catch (err) {
      console.error("❌ count command error:", err);
      return message.reply("❌ An error occurred: " + err.message);
    }
  },

  onChat: async function ({ message }) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat?.id?._serialized;
      const userID = contact?.id?._serialized;
      const userName = contact?.pushname || "Unknown";

      if (!threadID || !userID) return;

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
        if (userName && userName !== existing.name)
          existing.name = userName;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
