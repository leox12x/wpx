const User = require('../models/User');
const { log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "uid2",
    version: "2.0",
    author: "MahMUD | Fixed by Rahaman Leon",
    countDown: 5,
    role: 0,
    category: "general",
    guide: "{pn} - Show your WhatsApp UID\n{pn} @tag - Show UID of tagged user\nReply a message with {pn} - Show UID of that user"
  },

  onStart: async function ({ message, args }) {
    try {
      let uids = [];

      // ✅ Case 1: Replying to someone's message
      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        const uid = (quoted.author || quoted.from).split('@')[0];
        uids.push(uid);
      }

      // ✅ Case 2: Tagged users
      else if (args.length > 0 && message.mentionedIds.length > 0) {
        message.mentionedIds.forEach(id => {
          const uid = id.split('@')[0];
          uids.push(uid);
        });
      }

      // ✅ Case 3: Default → own UID
      else {
        const uid = message.from.split('@')[0];
        uids.push(uid);
      }

      // Send UID(s) as reply
      const replyText = uids.map((u, i) => `🔑 UID: ${u}`).join('\n');
      await message.reply(replyText);

      // Log UID(s)
      uids.forEach(u => log(`UID fetched: ${u}`));

      // Save to DB
      for (const uid of uids) {
        await User.create({ uid }).catch(err => log(`[DB Error] ${err.message}`));
      }

    } catch (err) {
      console.error("[UID Command Error]", err.message);
      return message.reply("❌ Failed to get UID.");
    }
  }
};
