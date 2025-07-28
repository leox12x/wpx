// balance.js
// Author: Rahaman Leon (fixed by ChatGPT)

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
      money: "𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞: %1",
      moneyOf: "💰 %1 has %2"
    }
  },

  onStart: async function ({ message, usersData, getLang, client }) {
    try {
      const mentions = message.mentionedIds || [];

      if (mentions.length > 0) {
        // Reply with balances of all mentioned users
        const replyLines = await Promise.all(
          mentions.map(async (uid) => {
            try {
              const contact = await client.getContactById(uid).catch(() => null);
              const name = contact?.pushname || contact?.name || uid.replace('@c.us', '');

              const money = await usersData.get(uid, "money") || 0;
              // Replace placeholders
              return getLang("moneyOf").replace("%1", name).replace("%2", money);
            } catch (error) {
              console.error(`Error getting balance for ${uid}:`, error);
              return `❌ Could not retrieve balance for user ${uid}`;
            }
          })
        );

        return message.reply(replyLines.join("\n"));
      }

      // No mentions: get sender's money
      const senderId = message.author || message.from;
      const userMoney = await usersData.get(senderId, "money") || 0;

      return message.reply(getLang("money").replace("%1", userMoney));
    } catch (error) {
      console.error("Error in balance command:", error);
      return message.reply("❌ Error retrieving balance. Please try again later.");
    }
  }
};
