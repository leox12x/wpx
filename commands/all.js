module.exports = {
  config: {
    name: "all",
    version: "1.2",
    author: "Mahmud (adapted from NTKhang)",
    countDown: 5,
    role: 1,
    description: "Tag all members in your WhatsApp group chat",
    category: "box chat",
    guide: {
      en: "Usage: !all [message]",
    }
  },

  onStart: async function ({ message, args, client }) {
    const chat = await message.getChat();
    if (!chat.isGroup) {
      return message.reply("❌ This command only works in group chats.");
    }

    const participants = chat.participants;
    if (!participants || participants.length === 0) {
      return message.reply("❌ Could not fetch group participants.");
    }

    const text = args.join(" ") || "@all";
    const mentions = [];

    for (const participant of participants) {
      const contact = await client.getContactById(participant.id._serialized);
      mentions.push(contact);
    }

    await message.reply(text, undefined, { mentions });
  }
};
