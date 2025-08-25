const { getUserData, getGroupData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "all2",
    version: "1.4",
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

  onStart: async function ({ message, event, args, api }) {
    try {
      // Try multiple ways to get group/chat ID
      const groupId = event?.chatId || event?.groupID || event?.remoteJid || event?.threadID || message?.chat?.id;
      if (!groupId) return message.reply("❌ Cannot determine group ID.");

      const senderId = event?.senderID || event?.from || message?.sender?.id;
      if (!senderId) return message.reply("❌ Cannot determine sender ID.");

      await getUserData(senderId);
      await getGroupData(groupId);

      const content = args.join(" ") || "@all";

      // Get participants
      let participants = event?.participantIDs;
      if (!participants || participants.length === 0) {
        // fallback: fetch from API if your framework allows
        participants = (await api.getGroupInfo?.(groupId))?.participantIDs || [];
      }

      if (!participants.length) return message.reply("❌ No group participants found.");

      const mentions = participants.map(id => ({ tag: content, id }));
      await message.reply({ body: content, mentions });

    } catch (error) {
      log(`❌ Error in all.js: ${error.message}`, "error");
      await message.reply("⚠️ Failed to tag all members.");
    }
  }
};
