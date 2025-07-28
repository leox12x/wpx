const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "slot",
    version: "1.2",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Slot game",
    },
    longDescription: {
      en: "Slot game.",
    },
    category: "game",
  },

  onStart: async function ({ args, message, event }) {
    try {
      const senderID = event.senderID;
      const maxlimit = 20;
      const slotTimeLimit = 10 * 60 * 60 * 1000; // 10 hours

      if (!args[0] || isNaN(args[0]) || Number(args[0]) <= 0) {
        return message.reply("❌ Please enter a valid positive bet amount.");
      }

      let amount = parseInt(args[0]);

      if (amount > 10000000) {
        return message.reply("❌ The maximum bet amount is 10M.");
      }

      // Get user data from DB
      let userData = await getUserData(senderID);

      if (userData.money < amount) {
        return message.reply("❌ You don't have enough money.");
      }

      // Initialize slots data if missing
      if (!userData.slots) {
        userData.slots = { count: 0, firstSlot: Date.now() };
      }

      const now = Date.now();
      const timeElapsed = now - userData.slots.firstSlot;

      if (timeElapsed > slotTimeLimit) {
        userData.slots = { count: 0, firstSlot: now };
      }

      if (userData.slots.count >= maxlimit) {
        const timeLeft = slotTimeLimit - timeElapsed;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return message.reply(`❌ You have reached your slot limit. Try again in ${hoursLeft}h ${minutesLeft}m.`);
      }

      userData.slots.count++;

      // Spin slots
      const slots = ["❤", "💜", "🖤", "🤍", "🤎", "💙", "💚", "💛"];
      const slot1 = slots[Math.floor(Math.random() * slots.length)];
      const slot2 = slots[Math.floor(Math.random() * slots.length)];
      const slot3 = slots[Math.floor(Math.random() * slots.length)];

      const winnings = calculateWinnings(slot1, slot2, slot3, amount);

      // Update user money and slots data
      userData.money += winnings;

      await updateUserData(senderID, {
        money: userData.money,
        slots: userData.slots
      });

      // Prepare message
      const spinCount = ">🎀";
      let messageText = getSpinResultMessage(slot1, slot2, slot3, winnings);

      return message.reply(`${spinCount}\n${messageText}`);

    } catch (error) {
      log(`Slot command error: ${error.message}`, "error");
      return message.reply("❌ An error occurred while playing the slot game.");
    }
  }
};

function calculateWinnings(slot1, slot2, slot3, bet) {
  if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
    return bet * 10;
  } else if (slot1 === "💜" && slot2 === "💜" && slot3 === "💜") {
    return bet * 5;
  } else if (slot1 === slot2 && slot2 === slot3) {
    return bet * 3;
  } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
    return bet * 3;
  } else {
    return -bet;
  }
}

function getSpinResultMessage(slot1, slot2, slot3, winnings) {
  if (winnings > 0) {
    if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
      return `🎉 Jackpot! You won ${formatMoney(winnings)} with three ❤ symbols!`;
    } else {
      return `🎉 You won ${formatMoney(winnings)}!\n• Game results [ ${slot1} | ${slot2} | ${slot3} ]`;
    }
  } else {
    return `😞 You lost ${formatMoney(-winnings)}.\n• Game results [ ${slot1} | ${slot2} | ${slot3} ]`;
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
