const { getUserData, updateUserData } = require('../scripts/helpers');

function getSenderId(message) {
  if (!message || !message.key) return null;
  const isGroup = message.key.remoteJid.endsWith("@g.us");
  return isGroup ? message.key.participant : message.key.remoteJid;
}

module.exports = {
  config: {
    name: "slot",
    version: "1.3",
    author: "Mahmud",
    countDown: 5,
    role: 0,
    description: "Play the slot machine to win or lose coins!",
    category: "economy",
    guide: {
      en: "Type 'slot' to spin and win coins!"
    }
  },

  onStart: async function ({ message }) {
    const senderID = getSenderId(message);
    if (!senderID) return message.reply("❌ Cannot determine your ID.");

    try {
      const userData = await getUserData(senderID);

      const symbols = ["🍒", "🍋", "🔔", "🍇", "💎"];
      const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      let reward = 0;
      if (result[0] === result[1] && result[1] === result[2]) {
        reward = 100;
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        reward = 20;
      } else {
        reward = -10;
      }

      const newBalance = userData.coins + reward;
      await updateUserData(senderID, { coins: newBalance });

      let msg = `🎰 ${result.join(" | ")} 🎰\n`;
      msg += reward > 0
        ? `\n🎉 You won ${reward} coins!`
        : `\n😢 You lost ${Math.abs(reward)} coins.`;
      msg += `\n💰 Balance: ${newBalance} coins`;

      return message.reply(msg);
    } catch (err) {
      console.error("Slot error:", err);
      return message.reply("❌ An error occurred while playing slot.");
    }
  }
};
