const mongoose = require("mongoose");

if (!mongoose.connection.readyState) {
  mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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
  name: "count",
  description: "Count user messages in group",
  
  onCommand: async ({ message, args }) => {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat.id._serialized;
      const senderID = contact.id._serialized;
      const senderName = contact.pushname || "Unknown";

      if (!threadID || !senderID) return await message.reply("❌ Could not get chat or user ID.");

      if (args[0]?.toLowerCase() === "all") {
        const allUsers = await MessageCount.find({ threadID }).sort({ count: -1 }).limit(50);
        if (!allUsers.length) return await message.reply("❌ No message data found for this group.");

        let msg = "💬 Group Message Leaderboard:\n";
        let index = 1;
        for (const user of allUsers) {
          const rankEmoji = index === 1 ? "🥇" : index === 2 ? "🥈" : index === 3 ? "🥉" : `${index}.`;
          msg += `\n${rankEmoji} ${user.name}: ${user.count}`;
          index++;
        }
        return await message.reply(msg);
      }

      const userData = await MessageCount.findOne({ threadID, userID: senderID });
      if (!userData) {
        return await message.reply("❌ No message data found.");
      }

      return await message.reply(`✅ ${senderName}, you have sent ${userData.count} messages in this group.`);
    } catch (err) {
      console.error("❌ count command error:", err);
      return await message.reply("❌ An error occurred: " + err.message);
    }
  },

  onChat: async ({ message }) => {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat.id._serialized;
      const senderID = contact.id._serialized;
      const senderName = contact.pushname || "Unknown";

      if (!threadID || !senderID) return;

      const existing = await MessageCount.findOne({ threadID, userID: senderID });

      if (!existing) {
        await MessageCount.create({
          threadID,
          userID: senderID,
          name: senderName,
          count: 1
        });
      } else {
        existing.count += 1;
        existing.name = senderName || existing.name;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
