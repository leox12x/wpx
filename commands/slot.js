const { getUserData, updateUserData } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "slot",
    version: "1.3",
    author: "Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "🎰 Slot machine game"
    },
    category: "game",
    guide: {
      en: "{pn} <bet amount>"
    }
  },

  onStart: async function ({ message, event, args }) {
    const userId = event.senderID || event.senderId || event.userID;
    if (!userId) return message.reply("❌ Cannot identify user.");

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) {
      return message.reply("❌ Please enter a valid bet amount.");
    }

    // Get user data
    const user = await getUserData(userId);

    if (user.coins < bet) {
      return message.reply(`❌ You don't have enough coins. Your balance: ${user.coins}`);
    }

    // Slot symbols
    const slots = ["🍒", "🍋", "🍊", "🍇", "🔔", "⭐"];
    const spin = () => Array.from({ length: 3 }, () => slots[Math.floor(Math.random() * slots.length)]);
    const result = spin();

    const [a, b, c] = result;
    let win = 0;

    if (a === b && b === c) {
      win = bet * 5;
    } else if (a === b || b === c || a === c) {
      win = bet * 2;
    } else {
      win = -bet;
    }

    const newBalance = user.coins + win;
    await updateUserData(userId, { coins: newBalance });

    const resultMessage = `🎰 [ ${a} | ${b} | ${c} ] 🎰\n` +
      (win > 0 ? `🎉 You won ${win} coins!` : `😢 You lost ${bet} coins.`) +
      `\n💰 Balance: ${newBalance}`;

    return message.reply(resultMessage);
  }
};
