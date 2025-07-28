const { getUserData, updateUserData } = require('../scripts/helpers');

function getSenderId(message) {
  if (!message) return null;
  if (message.from.endsWith('@g.us')) {
    return message.author || null;
  }
  return message.from || null;
}

module.exports = {
  config: {
    name: "slot",
    version: "1.4",
    author: "Mahmud",
    countDown: 5,
    role: 0,
    description: "Play slot machine to win or lose coins by betting an amount.",
    category: "economy",
    guide: {
      en: "Usage: !slot <betAmount> (e.g., !slot 100)"
    }
  },

  onStart: async function ({ message, args }) {
    const senderID = getSenderId(message);
    if (!senderID) return message.reply("❌ Cannot determine your ID.");

    const bet = args.length ? parseInt(args[0]) : null;
    if (!bet || isNaN(bet) || bet <= 0) {
      return message.reply("❌ Please enter a valid positive bet amount. Example: !slot 100");
    }

    try {
      const userData = await getUserData(senderID);
      if (!userData) return message.reply("❌ User data not found.");

      if (userData.coins < bet) {
        return message.reply(`❌ You don't have enough coins to bet ${bet}. Your balance: ${userData.coins}`);
      }

      const symbols = ["🍒", "🍋", "🔔", "🍇", "💎"];
      const result = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      let reward = 0;
      if (result[0] === result[1] && result[1] === result[2]) {
        reward = bet * 10;
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        reward = bet * 2;
      } else {
        reward = -bet;
      }

      const newCoins = userData.coins + reward;
      await updateUserData(senderID, { coins: newCoins });

      const slotResult = result.join(" | ");
      const winLoseMessage = reward > 0
        ? `🎉 You won ${reward} coins!`
        : `😢 You lost ${-reward} coins.`;

      return message.reply(`🎰 ${slotResult}\n${winLoseMessage}\n💰 Balance: ${newCoins}`);
    } catch (error) {
      console.error("Slot error:", error);
      return message.reply("❌ An error occurred while playing slot.");
    }
  }
};
