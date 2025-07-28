const { getUserData, updateUserData } = = require('../scripts/helpers');

module.exports = {
  config: {
    name: "slot",
    version: "1.2",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    shortDescription: { en: "Play slot to win money" },
    longDescription: { en: "Play a slot machine game and win or lose coins." }
  },

  langs: {
    en: {
      invalid_amount: "❌ | Please enter a valid positive number.",
      not_enough_money: "❌ | Baby, check your balance if you have that amount.",
      spin_message: "🎰 Spinning the slot...",
      win_message: "🎉 | Baby, You won $%1",
      lose_message: "💔 | Baby, You lost $%1",
      jackpot_message: "💎 JACKPOT! You won $%1 with three %2 symbols, Baby!",
      spin_count: "🎰 Slot Machine Result:",
      wrong_use_message: "❌ | Please enter a valid and positive number as your bet amount.",
      time_left_message: "❌ | You’ve reached the max attempt. Try again in %1h %2m.",
      max_bet_exceeded: "❌ | Max bet is $10M.",
    }
  },

  onStart: async function ({ message, event, args, getLang }) {
    const userID = event.senderID;
    const maxlimit = 20;
    const slotCooldown = 10 * 60 * 60 * 1000; // 10 hours

    // ⏱️ Time limit check
    let userData = await getUserData(userID);
    if (!userData.data.slots) {
      userData.data.slots = { count: 0, firstSlot: Date.now() };
    }

    const timePassed = Date.now() - userData.data.slots.firstSlot;

    if (timePassed >= slotCooldown) {
      userData.data.slots = { count: 0, firstSlot: Date.now() };
    }

    if (userData.data.slots.count >= maxlimit) {
      const timeLeft = slotCooldown - timePassed;
      const h = Math.floor(timeLeft / (60 * 60 * 1000));
      const m = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(getLang("time_left_message", h, m));
    }

    // 💰 Betting logic
    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return message.reply(getLang("wrong_use_message"));
    if (bet > 10000000) return message.reply(getLang("max_bet_exceeded"));
    if (userData.coins < bet) return message.reply(getLang("not_enough_money"));

    // 🎰 Slot spin
    userData.data.slots.count++;
    const symbols = ["❤", "💜", "🖤", "🤍", "🤎", "💙", "💚", "💛"];
    const slot1 = randomChoice(symbols);
    const slot2 = randomChoice(symbols);
    const slot3 = randomChoice(symbols);

    const winAmount = calculateWinnings(slot1, slot2, slot3, bet);
    userData.coins += winAmount;
    await updateUserData(userID, {
      coins: userData.coins,
      data: userData.data
    });

    // 🧾 Result Message
    const result = `${slot1} | ${slot2} | ${slot3}`;
    let msg = `${getLang("spin_count")}\n${result}\n`;

    if (winAmount > 0) {
      if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
        msg += getLang("jackpot_message", formatMoney(winAmount), "❤");
      } else {
        msg += getLang("win_message", formatMoney(winAmount));
      }
    } else {
      msg += getLang("lose_message", formatMoney(-winAmount));
    }

    return message.reply(msg);
  }
};

// Helper functions
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculateWinnings(s1, s2, s3, bet) {
  if (s1 === "❤" && s2 === "❤" && s3 === "❤") return bet * 10;
  if (s1 === "💜" && s2 === "💜" && s3 === "💜") return bet * 5;
  if (s1 === s2 && s2 === s3) return bet * 3;
  if (s1 === s2 || s1 === s3 || s2 === s3) return bet * 2;
  return -bet;
}

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
        }
