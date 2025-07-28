const { getUserData, updateUserData } = require('../scripts/helpers');

// Get sender ID from WhatsApp message
function getSenderId(message) {
  try {
    return message.key.participant || message.key.remoteJid;
  } catch {
    return null;
  }
}

module.exports = {
  config: {
    name: "slot",
    version: "1.3",
    author: "Mahmud",
    countDown: 5,
    role: 0,
    description: "Play the slot machine for coins",
    category: "economy",
    guide: {
      en: "Use: slot <bet amount>\nExample: slot 100"
    }
  },

  onStart: async function ({ message, args }) {
    const senderId = getSenderId(message);
    if (!senderId) return message.reply("❌ Cannot determine your ID.");

    // Get user data
    const user = await getUserData(senderId);
    const bet = parseInt(args[0]) || 10;

    if (isNaN(bet) || bet <= 0) {
      return message.reply("⚠️ Please enter a valid number to bet.");
    }

    if (user.coins < bet) {
      return message.reply(`❌ You don't have enough coins! You currently have ${user.coins} 💰.`);
    }

    const emojis = ["🍒", "🍋", "🍊", "🍇", "⭐", "🍉"];
    const result = Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]);

    let win = false;
    if (result[0] === result[1] && result[1] === result[2]) {
      win = true;
    }

    let updatedCoins = user.coins;
    if (win) {
      updatedCoins += bet * 2;
    } else {
      updatedCoins -= bet;
    }

    await updateUserData(senderId, { coins: updatedCoins });

    const slotResult = result.join(" | ");
    const response = win
      ? `🎰 ${slotResult}\n🎉 You won! +${bet * 2} coins\n💰 Balance: ${updatedCoins}`
      : `🎰 ${slotResult}\n😢 You lost -${bet} coins\n💰 Balance: ${updatedCoins}`;

    return message.reply(response);
  }
};
