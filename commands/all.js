// File: all.js
// Author: Rahaman Leon
// Description: Tag all members in a WhatsApp group

module.exports = {
  config: {
    name: "all",
    aliases: ["everyone", "tagall"],
    version: "1.4",
    author: "NTKhang | Refined by Rahaman Leon",
    coolDown: 5,
    role: 1,
    description: {
      en: "Tag all members in your group chat"
    },
    category: "group",
    guide: {
      en: "{prefix}all [message or reply] - Mention everyone in the group"
    },
  },

  onStart: async function ({ client, message, args, isGroup, contact }) {
    try {
      if (!isGroup) {
        return message.reply("❌ This command only works in group chats.");
      }

      const groupChat = await client.getChatById(message.from);
      const members = groupChat?.participants;

      if (!members || members.length === 0) {
        return message.reply("❌ Could not retrieve group members.");
      }

      const mentions = members.map(p => p.id._serialized);
      let body = args.join(" ").trim() || "📣 Attention everyone!";
      const senderName = contact?.name || contact?.pushname || "Someone";

      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        const originalSender = quoted.author || quoted.from;

        if (originalSender && !mentions.includes(originalSender)) {
          mentions.push(originalSender);
        }

        try {
          const quotedContact = await client.getContactById(originalSender);
          const quotedName = quotedContact?.name || quotedContact?.pushname || originalSender.split("@")[0];
          body = `🔁 Replying to ${quotedName}: ${body}`;
        } catch (e) {
          // fallback name
          body = `🔁 Replying to ${originalSender.split("@")[0]}: ${body}`;
        }
      }

      const finalText = `${body}\n\n👤 Called by: ${senderName}`;

      await client.sendMessage(message.from, {
        text: finalText,
        mentions
      });

      console.log(`✅ Tagged ${mentions.length} users in: ${groupChat.name || message.from}`);
    } catch (err) {
      console.error("❌ Error in 'all' command:", err);
      await message.reply("❌ Something went wrong while tagging everyone.");
    }
  }
};
