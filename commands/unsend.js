// File: unsend.js
// Author: Rahaman Leon
// Description: Unsend the last message sent by the bot or the replied message.

module.exports = {
  config: {
    name: "unsend",
    aliases: ["u", "uns"],
    version: "1.0",
    author: "Rahaman Leon",
    description: "Unsend the last sent bot message or a replied message.",
    usage: "unsend",
    longDescription: "Use this to delete the bot's previous message or the message you're replying to.",
    category: "utility",
    coolDown: 3,
    role: 0
  },

  onStart: async function ({ message, client }) {
    try {
      const chat = await message.getChat();

      let targetMsg;

      if (message.hasQuotedMsg) {
        targetMsg = await message.getQuotedMessage();
      } else {
        const messages = await chat.fetchMessages({ limit: 10 });
        // Find the most recent bot message excluding the current command message
        targetMsg = messages.find(msg => msg.fromMe && msg.id._serialized !== message.id._serialized);
      }

      if (!targetMsg) {
        return await client.sendMessage(message.from, "❌ No message found to unsend.");
      }

      await targetMsg.delete(true);
      await client.sendMessage(message.from, "✅ Message unsent successfully.");
    } catch (error) {
      console.error("Unsend command error:", error);
      await client.sendMessage(message.from, "⚠️ Failed to unsend the message.");
    }
  }
};
