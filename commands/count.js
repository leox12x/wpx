const mongoose = require("mongoose");

// ========================
// MongoDB কানেকশন (একবার বট চালুর সময় একবার করুন)
if (!mongoose.connection.readyState) {
  mongoose.connect("mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log("✅ MongoDB connected for count command"))
    .catch(err => console.error("❌ MongoDB connection error:", err));
}
// ========================

// Schema ডিফাইন
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
    author: "Mahmud (whatsapp-web.js)",
    countDown: 5,
    role: 0,
    description: "Show message count using MongoDB",
    category: "group",
    guide: "{pn} - your count\n{pn} all - leaderboard\n{pn} @mention - mentioned users"
  },

  // কমান্ড চালানোর সময়
  onStart: async function ({ api, event, message, args }) {
    try {
      // WhatsApp-web.js event থেকে threadID এবং senderID পাওয়া
      const threadID = event.from;
      const senderID = event.author || event.from;
      if (!threadID || !senderID) return await message.reply("❌ Could not get thread or sender ID.");

      // ট্যাগ করা ইউজার আইডি সংগ্রহ (event.message থেকে)
      const mentions = event.message?.mentionedIds || [];

      // যদি 'all' আর্গুমেন্ট থাকে, তাহলে লিডারবোর্ড দেখাও
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

      // যদি ট্যাগ করা থাকে, তাদের ডেটা দেখাও, নাহলে নিজের
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

      return await message.reply(replyMsg.trim());
    } catch (err) {
      console.error("❌ count command error:", err);
      return await message.reply("❌ An error occurred: " + err.message);
    }
  },

  // প্রতিটি মেসেজ আসার সময় কল হয়
  onChat: async function ({ event }) {
    try {
      const threadID = event.from;
      const senderID = event.author || event.from;
      // ইউজারের নাম (notifyName)
      const pushName = event._data?.notifyName || "Unknown";

      if (!threadID || !senderID) return;

      // MongoDB তে ডেটা খুঁজে বের করা
      const existing = await MessageCount.findOne({ threadID, userID: senderID });

      if (!existing) {
        // নতুন ডেটা তৈরি
        await MessageCount.create({
          threadID,
          userID: senderID,
          name: pushName,
          count: 1
        });
      } else {
        // কাউন্ট বৃদ্ধি এবং নাম আপডেট
        existing.count += 1;
        existing.name = pushName || existing.name;
        await existing.save();
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
