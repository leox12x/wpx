const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "slot",
    version: "1.3",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Slot game" },
    longDescription: { en: "Play the slot game and win coins!" },
    category: "game"
  },

  onStart: async function ({ args, message, event }) {
    try {
      const senderID = event.senderID;
      const maxlimit = 20;
      const slotTimeLimit = 10 * 60 * 60 * 1000; // 10 hours

      if (!args[0] || isNaN(args[0]) || Number(args[0]) <= 0) {
        return message.reply("❌ Please enter a valid positive bet amount.");
      }

      const amount = parseInt(args[0]);
      if (amount > 10000000) {
        return message.reply("❌ The maximum bet amount is 10M.");
      }

      let userData = await getUserData(senderID);
      userData.coins = userData.coins || 0;
      userData.slots = userData.slots || { count: 0, firstSlot: Date.now() };

      if (userData.coins < amount) {
        return message.reply("❌ You don't have enough coins.");
      }

      const now = Date.now();
      const timeElapsed = now - userData.slots.firstSlot;

      if (timeElapsed > slotTimeLimit) {
        userData.slots.count = 0;
        userData.slots.firstSlot = now;
      }

      if (userData.slots.count >= maxlimit) {
        const timeLeft = slotTimeLimit - timeElapsed;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return message.reply(`❌ Slot limit reached. Try again in ${hoursLeft}h ${minutesLeft}m.`);
      }

      userData.slots.count++;

      // Spin the slots
      const slots = ["❤", "💜", "🖤", "🤍", "🤎", "💙", "💚", "💛"];
      const slot1 = slots[Math.floor(Math.random() * slots.length)];
      const slot2 = slots[Math.floor(Math.random() * slots.length)];
      const slot3 = slots[Math.floor(Math.random() * slots.length)];

      const winnings = calculateWinnings(slot1, slot2, slot3, amount);

      userData.coins += winnings;

      await updateUserData(senderID, userData);

      const spinPrefix = ">🎀";
      const resultText = getSpinResultMessage(slot1, slot2, slot3, winnings);
      return message.reply(`${spinPrefix}\n${resultText}`);

    } catch (err) {
      log(`❌ Slot Error: ${err.message}`, "error");
      return message.reply("❌ Something went wrong with the slot game.");
    }
  }
};

function calculateWinnings(s1, s2, s3, bet) {
  if (s1 === "❤" && s2 === "❤" && s3 === "❤") return bet * 10;
  else if (s1 === "💜" && s2 === "💜" && s3 === "💜") return bet * 5;
  else if (s1 === s2 && s2 === s3) return bet * 3;
  else if (s1 === s2 || s1 === s3 || s2 === s3) return Math.floor(bet * 1.5);
  else return -bet;
}

function getSpinResultMessage(s1, s2, s3, winnings) {
  if (winnings > 0) {
    if (s1 === "❤" && s2 === "❤" && s3 === "❤") {
      return `🎉 *Jackpot!* You won ${formatMoney(winnings)} with [ ${s1} | ${s2} | ${s3} ]`;
    }
    return `🎉 You won ${formatMoney(winnings)}!\n• Game results [ ${s1} | ${s2} | ${s3} ]`;
  } else {
    return `😞 You lost ${formatMoney(-winnings)}.\n• Game results [ ${s1} | ${s2} | ${s3} ]`;
  }
}

function formatMoney(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}
