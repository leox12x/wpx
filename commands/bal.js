const { getUserData } = require("../scripts/helpers");

// Format number into compact units
function formatNumber(num) {
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "wallet", "money", "cash"],
    version: "1.5",
    author: "RL + Modified by MahMUD",
    countDown: 5,
    role: 0,
    description: "Check your balance or a mentioned user's.",
    category: "economy",
    guide: {
      en: "{prefix}bal or {prefix}bal @mention"
    }
  },

  langs: {
    en: {
      money: "𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞: %1$",
      moneyOf: "💰 %1 has %2$"
    }
  },

  onStart: async function ({ message, getLang, client }) {
    const mentionIds = message.mentionedIds || [];

    if (mentionIds.length) {
      const results = await Promise.all(mentionIds.map(async id => {
        const data = await getUserData(id);
        const coins = formatNumber(data?.coins || 0);
        let name = id.split("@")[0];

        try {
          const c = await client.getContactById(id);
          name = c.name || c.pushname || name;
        } catch {}

        return getLang("moneyOf").replace("%1", name).replace("%2", coins);
      }));

      return message.reply(results.join("\n"));
    }

    const uid = message.author;
    const data = await getUserData(uid);
    const coins = formatNumber(data?.coins || 0);
    return message.reply(getLang("money").replace("%1", coins));
  }
};
