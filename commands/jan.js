module.exports = {
  config: {
    name: "all",
    version: "1.3",
    author: "Mahmud",
    countDown: 5,
    role: 1,
    description: "Tag all members in your WhatsApp group chat",
    category: "box chat",
    guide: {
      en: "Usage: !all [optional message]"
    }
  },

  onStart: async function ({ message, args, client }) {
    try {
      const chat = await message.getChat();
      if (!chat.isGroup) {
        return message.reply("❌ This command only works in group chats.");
      }

      const text = args.join(" ") || "🟢 Attention everyone!";
      const mentions = [];

      for (const participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);
        mentions.push(contact);
      }

      await message.reply(text, undefined, { mentions });

    } catch (err) {
      console.error("❌ Error in !all command:", err);
      message.reply("❌ Failed to mention everyone. Please try again.");
    }
  }
};
