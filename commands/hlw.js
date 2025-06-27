module.exports = {
  config: {
    name: "hlw",
    version: "1.0",
    author: "tas33n",
    countDown: 0,
    role: 0,
    description: {
      en: "Replies with 'hola' quoting your message",
    },
    category: "utility",
    guide: {
      en: "Use {prefix}hlw to get a greeting reply.",
    },
  },

  onStart: async function ({ message, client }) {
    try {
      if (message.id && message.id._serialized) {
        await client.sendMessage(message.from, "hola", {
          quotedMessageId: message.id._serialized
        });
      } else {
        // fallback to normal send (no quote)
        await client.sendMessage(message.from, "hola");
      }
    } catch (err) {
      console.error("❌ hlw.js error:", err.message);
      try {
        await client.sendMessage(message.from, "❌ An error occurred while processing the command.");
      } catch {}
    }
  }
};
