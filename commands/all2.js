const { getUserData, getGroupData, log, trackCommand } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "all2",
    version: "1.5",
    author: "NTKhang (Modified by Mahmud)",
    countDown: 5,
    role: 1,
    description: {
      vi: "Tag tất cả thành viên trong nhóm chat của bạn",
      en: "Tag all members in your group chat"
    },
    category: "box chat",
    guide: {
      vi: "{pn} [nội dung | để trống]",
      en: "{pn} [content | empty]"
    }
  },

  onStart: async function ({ message, event, args }) {
    try {
      // Determine group ID safely
      const groupId = event?.chatId || event?.groupID || event?.remoteJid || event?.threadID || message?.chat?.id;
      if (!groupId) return message.reply("❌ Cannot determine group ID.");

      // Determine sender ID safely
      const senderId = event?.senderID || event?.from || message?.sender?.id;
      if (!senderId) return message.reply("❌ Cannot determine sender ID.");

      // Track the command usage
      await trackCommand(senderId, event?.senderName || null);

      // Fetch group info from DB
      const group = await getGroupData(groupId);
      const participants = group.members || [];
      if (!participants.length) return message.reply("❌ No group participants found.");

      const content = args.join(" ") || "@all";

      // Build mentions array
      const mentions = participants.map(id => ({ tag: content, id }));

      await message.reply({ body: content, mentions });

    } catch (error) {
      log(`❌ Error in all.js: ${error.message}`, 'error');
      await message.reply("⚠️ Failed to tag all members.");
    }
  }
};
