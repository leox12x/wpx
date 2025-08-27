module.exports = {
  config: {
    name: "u2",
   version: "1.8",
    author: "MahMUD",
    role: 0,
    category: "group",
    description: {
      en: "Unsend bot's message"
    },
    guide: {
      en: "Reply to the bot's message and use {pn}"
    }
  },

  langs: {
    en: {
      syntaxError: "❌ Please reply to a bot message you want to unsend.",
      notBotMsg: "⚠️ That message was not sent by the bot."
    }
  },

  onStart: async function({ message, event, api, getLang }) {
    const replyMsg = event.messageReply;
    if (!replyMsg) return message.reply(getLang("syntaxError"));

    try {
      // WA Web bot ID
      const botID = api.getCurrentUserID ? await api.getCurrentUserID() : null;
      if (!botID) return message.reply("❌ Could not detect bot ID.");

      if (replyMsg.senderID !== botID) return message.reply(getLang("notBotMsg"));

      // WA Web API compatible unsend
      await api.unsendMessage(replyMsg.messageID);

      return message.reply("✅ Message unsent successfully.");
    } catch (err) {
      console.error("❌ Unsend Error:", err);
      return message.reply("❌ Failed to unsend the message.");
    }
  }
};
