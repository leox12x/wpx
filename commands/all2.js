const { trackCommand, getGroupData, getParticipants, log, getGroupId } = require('../scripts/helpers');

function getSenderId({ message, event }) {
  return message?.senderId || message?.from || event?.senderID || event?.from || event?.author || null;
}

module.exports = {
  config: {
    name: "all",
    version: "1.8",
    author: "Mahmud",
    countDown: 5,
    role: 1,
    description: { vi: "Tag tất cả thành viên trong nhóm chat", en: "Tag all members" },
    category: "box chat",
    guide: { vi: "{pn} [nội dung | để trống]", en: "{pn} [content | empty]" }
  },

  onStart: async function ({ message, event, args, api }) {
    try {
      const groupId = getGroupId({ message, event });
      if (!groupId) return message.reply("❌ Cannot determine group ID.");

      const senderId = getSenderId({ message, event });
      if (!senderId) return message.reply("❌ Cannot determine sender ID.");

      await trackCommand(senderId, message?.senderName || null);

      const participants = await getParticipants({ message, event, api });
      if (!participants.length) return message.reply("❌ No participants found.");

      const content = args.join(" ") || "@all";
      const mentions = participants.map(id => ({ tag: content, id }));

      await message.reply({ body: content, mentions });

    } catch (error) {
      log(`❌ all.js error: ${error.message}`, 'error');
      await message.reply("⚠️ Failed to tag all members.");
    }
  }
};
