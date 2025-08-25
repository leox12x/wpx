const { getUserData, getGroupData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "all",
    version: "1.3",
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
      // Safely get the group/chat ID
      const groupId = event?.chatId || event?.groupID || event?.remoteJid;
      if (!groupId) return message.reply("❌ Cannot determine group ID.");

      const senderId = event?.senderID || event?.from;
      if (!senderId) return message.reply("❌ Cannot determine sender ID.");

      // Fetch user & group data (MongoDB)
      await getUserData(senderId);
      await getGroupData(groupId);

      const content = args.join(" ") || "@all";

      // Get participants safely
      const participants = event?.participantIDs || (await api.getGroupInfo(groupId))?.participantIDs;
      if (!participants || participants.length === 0)
        return message.reply("❌ No group participants found.");

      const mentions = participants.map(id => ({ tag: content, id }));

      await message.reply({ body: content, mentions });

    } catch (error) {
      log(`❌ Error in all.js: ${error.message}`, "error");
      await message.reply("⚠️ Failed to tag all members.");
    }
  }
};
