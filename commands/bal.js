// balance.js
// Author: Rahaman Leon

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "wallet", "money", "cash"],
    version: "1.3",
    author: "Rahaman Leon",
    countDown: 5,
    role: 0,
    description: "Check your balance or the mentioned user's balance.",
    category: "economy",
    guide: {
      en: "{prefix}balance - Check your own money\n{prefix}balance @mention - Check mentioned user's money"
    }
  },

  langs: {
    en: {
      money: "𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 %1$",
      moneyOf: "💰 %1 has %2$"
    }
  },

  onStart: async function ({ message, usersData, getLang, client }) {
    try {
      // Get mentions safely (whatsapp-web.js uses message.mentionedIds)
      const mentions = message.mentionedIds || [];

      if (mentions.length > 0) {
        // Prepare reply for each mentioned user
        const replyLines = await Promise.all(
          mentions.map(async (uid) => {
            try {
              // Get display name from contact if possible
              const contact = await client.getContactById(uid).catch(() => null);
              const name = contact?.pushname || contact?.name || uid.replace('@c.us', '');

              // Get user's money (default 0)
              const money = await usersData.get(uid, "money") || 0;

              return getLang("moneyOf", name, money);
            } catch (error) {
              console.error(`Error getting balance for ${uid}:`, error);
              return `❌ Could not retrieve balance for user`;
            }
          })
        );

        return message.reply(replyLines.join("\n"));
      }

      // No mentions: get sender's money
      const senderId = message.author || message.from;
      const userMoney = await usersData.get(senderId, "money") || 0;

      return message.reply(getLang("money", userMoney));
    } catch (error) {
      console.error("Error in balance command:", error);
      return message.reply("❌ Error retrieving balance. Please try again later.");
    }
  }
};
