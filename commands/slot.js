const { getUserData, updateUserData } = require('../scripts/helpers');

function getSenderId(message) {
  if (!message || !message.key) return null;
  if (message.key.remoteJid.endsWith('@g.us')) return message.key.participant || null;
  return message.key.remoteJid;
}

module.exports = {
  config: {
    name: 'slot',
    version: '1.3',
    author: 'Mahmud',
    countDown: 5,
    role: 0,
    description: 'Play slot machine to win or lose coins',
    category: 'economy'
  },

  onStart: async function({ message }) {
    const senderID = getSenderId(message);
    if (!senderID) return message.reply('❌ Cannot determine your ID.');

    const user = await getUserData(senderID);
    if (!user) return message.reply('❌ User data not found.');

    const bet = 10; // Or parse from args if you want

    if (user.coins < bet) return message.reply(`❌ You don't have enough coins. Your balance: ${user.coins}`);

    const symbols = ['🍒', '🍋', '🔔', '🍇', '💎'];
    const result = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);

    let reward = 0;
    if (result[0] === result[1] && result[1] === result[2]) reward = bet * 10;
    else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) reward = bet * 2;
    else reward = -bet;

    const newCoins = user.coins + reward;
    await updateUserData(senderID, { coins: newCoins });

    const slotResult = result.join(' | ');
    const winLoseMessage = reward > 0
      ? `🎉 You won ${reward} coins!`
      : `😢 You lost ${-reward} coins.`;

    return message.reply(`🎰 ${slotResult}\n${winLoseMessage}\n💰 Balance: ${newCoins}`);
  }
};
