module.exports = {
  config: {
    name: "u2",
    version: "2.0",
    author: "MahMUD",
    role: 0,
    category: "group",
    description: { en: "Unsend bot's message" },
    guide: { en: "Reply to the bot's message and use {pn}" }
  },

  langs: {
    en: {
      syntaxError: "❌ Please reply to a bot message you want to unsend.",
      notBotMsg: "⚠️ That message was not sent by the bot."
    }
  },

  onStart: async function({ message, event, api, getLang }) {
    try {
      // WA Web reply detection
      let replyMsg;
      if (event.messageReply) replyMsg = event.messageReply;
      else if (event.quotedMsg) replyMsg = event.quotedMsg;
      else if (message.getQuotedMessage) replyMsg = await message.getQuotedMessage(); // whatsapp-web.js
      if (!replyMsg) return message.reply(getLang("syntaxError"));

      // Detect bot ID
      const botID = api.getCurrentUserID ? await api.getCurrentUserID() : null;
      if (!botID) return message.reply("❌ Could not detect bot ID.");

      if (replyMsg.senderID !== botID) return message.reply(getLang("notBotMsg"));

      // WA Web compatible unsend
      await api.unsendMessage(replyMsg.chatId || event.threadID, replyMsg.messageID);

      return message.reply("✅ Message unsent successfully.");
    } catch (err) {
      console.error("❌ Unsend Error:", err);
      return message.reply("❌ Failed to unsend the message.");
    }
  }
};
