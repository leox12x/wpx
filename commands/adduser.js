module.exports = {
  config: {
    name: "adduser",
    aliases: ["add"],
    version: "1.1",
    author: "Rahaman Leon",
    countDown: 5,
    role: 1,
    description: "Add a user to a WhatsApp group using phone number or UID",
    category: "group",
    guide: "{pn} <phone_number_without_+>\nExample: {pn} 8801234567890"
  },

  onStart: async function ({ message, args, client }) {
    try {
      const chat = await message.getChat();
      if (!chat.isGroup) {
        return await message.reply("❌ This command only works in group chats.");
      }

      if (args.length === 0) {
        return await message.reply("⚠ Please provide a phone number or UID.\nExample: adduser 8801234567890");
      }

      const input = args[0];
      const number = input.replace(/[^0-9]/g, "");
      const jid = `${number}@c.us`;

      const participants = await chat.participants;
      if (participants.some(p => p.id._serialized === jid)) {
        const contact = await client.getContactById(jid);
        return await message.reply(`ℹ️ ${contact.pushname || contact.number} is already in this group.`, {
          mentions: [contact]
        });
      }

      await chat.addParticipants([jid]);
      const contact = await client.getContactById(jid);

      await message.reply(`✅ Successfully added ${contact.pushname || contact.number} to the group.`, {
        mentions: [contact]
      });

    } catch (error) {
      console.error("AddUser Error:", error);
      if (/not authorized|403/i.test(error?.message)) {
        return message.reply("❌ Bot must be admin to add users.");
      }
      message.reply("⚠️ Failed to add user. They might have left recently, blocked the group, or restricted group joins.");
    }
  }
};
