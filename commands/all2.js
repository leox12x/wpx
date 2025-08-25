const { getUserData, trackCommand, getGroupData, getParticipants, log, getGroupId } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "all2",
    version: "1.7",
    author: "Mahmud",
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
      // ---------------------- Get Group & Sender IDs ----------------------
      const groupId = getGroupId({ message, event });
      if (!groupId) return message.reply("❌ Cannot determine group ID.");

      const senderId = message?.senderId || event?.senderID || event?.from;
      if (!senderId) return message.reply("❌ Cannot determine sender ID.");

      await trackCommand(senderId, message?.senderName || null);

      // ---------------------- Fetch Participants ----------------------
      const participants = await getParticipants({ message, event, api });
      if (!participants.length) return message.reply("❌ No group participants found.");

      // ---------------------- Build Message ----------------------
      const content = args.join(" ") || "@all";
      const mentions = participants.map(id => ({ tag: content, id }));

      await message.reply({ body: content, mentions });

    } catch (error) {
      log(`❌ Error in all.js: ${error.message}`, 'error');
      await message.reply("⚠️ Failed to tag all members.");
    }
  }
};
