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
    aliases: ["msgcount", "messages"],
    version: "1.2",
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

  onStart: async function ({ message, args }) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat.id._serialized;
      const userID = contact.id._serialized;
      const userName = contact.pushname || "Unknown";

      if (args[0]?.toLowerCase() === "all") {
        const allUsers = await MessageCount.find({ threadID }).sort({ count: -1 }).limit(50);
        if (!allUsers.length)
          return await message.reply("❌ No message data found for this group.");

        let msg = "📊 Group Message Leaderboard:\n";
        let index = 1;
        for (const user of allUsers) {
          const rank = index === 1 ? "🥇" : index === 2 ? "🥈" : index === 3 ? "🥉" : `${index}.`;
          msg += `\n${rank} ${user.name}: ${user.count} msg`;
          index++;
        }
        return await message.reply(msg);
      }

      const userData = await MessageCount.findOne({ threadID, userID });
      if (!userData)
        return await message.reply("❌ No message data found for you.");

      return await message.reply(`✅ ${userName}, you have sent ${userData.count} messages in this group.`);
    } catch (err) {
      console.error("❌ count command error:", err);
      return await message.reply("❌ An error occurred: " + err.message);
    }
  },

  onChat: async function ({ message }) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat.id._serialized;
      const userID = contact.id._serialized;
      const userName = contact.pushname || "Unknown";

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
        existing.name = userName || existing.name;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
