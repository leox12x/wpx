// balance.js
const { getUserData } = require("../scripts/helpers");

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
      moneyOf: "💰 %1 has %2 coins"
    }
  },

  onStart: async function ({ message, getLang, client }) {
    try {
      const mentions = message.mentionedIds || [];

      if (mentions.length > 0) {
        const replyLines = await Promise.all(
          mentions.map(async (uid) => {
            try {
              const userData = await getUserData(uid);
              const contact = await client.getContactById(uid).catch(() => null);
              const name = contact?.pushname || contact?.name || uid.replace('@c.us', '');
              const money = userData?.coins || 0;
              return getLang("moneyOf").replace("%1", name).replace("%2", money);
            } catch (error) {
              return `❌ Could not retrieve balance for ${uid}`;
            }
          })
        );

        return message.reply(replyLines.join("\n"));
      }

      const senderId = message.author || message.from;
      const userData = await getUserData(senderId);
      const money = userData?.coins || 0;

      return message.reply(getLang("money").replace("%1", money));
    } catch (error) {
      console.error("Error in balance command:", error);
      return message.reply("❌ Error retrieving balance.");
    }
  }
};
