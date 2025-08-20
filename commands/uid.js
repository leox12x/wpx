module.exports = {
  config: {
    name: "uid",
    version: "1.2",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "general",
    guide: "{pn} - Show your WhatsApp UID\n{pn} @tag - Show UID of tagged user\nReply a message with {pn} - Show UID of that user"
  },

  onStart: async function ({ message, args }) {
    try {
      let replyText = "";

      // ✅ Case 1: Replying to someone's message
      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        const uid = quoted.author || quoted.from;
        return message.reply(`🔑 UID: ${uid}`);
      }

      // ✅ Case 2: Tagged users
      if (args.length > 0 && message.mentionedIds.length > 0) {
        message.mentionedIds.forEach(id => {
          replyText += `👤 UID: ${id}\n`;
        });
        return message.reply(replyText.trim());
      }

      // ✅ Case 3: Default → own UID
      return message.reply(`🔑 Your UID: ${message.from}`);

    } catch (err) {
      console.error("[UID Command Error]", err.message);
      return message.reply("❌ Failed to get WhatsApp UID.");
    }
  }
};
