const { getUserData, updateUserData } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "slot",
    version: "1.1",
    author: "xxx",
    countDown: 10,
    shortDescription: {
      en: "Slot game"
    },
    longDescription: {
      en: "Spin and win coins!"
    },
    category: "game"
  },

  langs: {
    en: {
      invalid_amount: "Enter a valid and positive amount to have a chance to win double",
      not_enough_money: "𝐂𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐜𝐨𝐢𝐧𝐬 𝐛𝐚𝐥𝐚𝐧𝐜𝐞",
      spin_message: "Spinning...",
      win_message: "• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1",
      lose_message: "• 𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐥𝐨𝐬𝐭 $%1",
      jackpot_message: "𝐉𝐚𝐜𝐤𝐩𝐨𝐭! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐰𝐢𝐭𝐡 𝐭𝐡𝐫𝐞𝐞 %2 𝐬𝐲𝐦𝐛𝐨𝐥𝐬, 𝐁𝐚𝐛𝐲!",
      spin_count: ">🎀",
      wrong_use_message: "❌ | 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐧𝐝 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐧𝐮𝐦𝐛𝐞𝐫 𝐚𝐬 𝐲𝐨𝐮𝐫 𝐛𝐞𝐭 𝐚𝐦𝐨𝐮𝐧𝐭.",
      time_left_message: "❌ | 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐬𝐥𝐨𝐭 𝐥𝐢𝐦𝐢𝐭. 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 %1𝐡 %2𝐦.",
      max_bet_exceeded: "❌ | The maximum bet amount is 10M."
    }
  },

  onStart: async function ({ message, args, getLang }) {
    const userID = message.senderID;
    const maxlimit = 20;
    const slotCooldown = 10 * 60 * 60 * 1000; // 10 hours
    const now = Date.now();

    const userData = await getUserData(userID);

    if (!userData.data.slots) {
      userData.data.slots = { count: 0, firstSlot: now };
    }

    const timePassed = now - userData.data.slots.firstSlot;

    if (timePassed >= slotCooldown) {
      userData.data.slots = { count: 0, firstSlot: now };
    }

    if (userData.data.slots.count >= maxlimit) {
      const timeLeft = slotCooldown - timePassed;
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return message.reply(getLang("time_left_message", hoursLeft, minutesLeft));
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("wrong_use_message"));
    }

    if (amount > 10000000) {
      return message.reply(getLang("max_bet_exceeded"));
    }

    if (userData.coins < amount) {
      return message.reply(getLang("not_enough_money"));
    }

    userData.data.slots.count += 1;

    const slots = ["❤", "💜", "🖤", "🤍", "🤎", "💙", "💚", "💛"];
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];

    const winnings = calculateWinnings(slot1, slot2, slot3, amount);
    const newCoins = userData.coins + winnings;

    await updateUserData(userID, {
      coins: newCoins,
      data: userData.data
    });

    const resultMsg = getSpinResultMessage(slot1, slot2, slot3, winnings, getLang);
    return message.reply(`${getLang("spin_count")}\n${resultMsg}`);
  }
};

function calculateWinnings(slot1, slot2, slot3, betAmount) {
  if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
    return betAmount * 10;
  } else if (slot1 === "💜" && slot2 === "💜" && slot3 === "💜") {
    return betAmount * 5;
  } else if (slot1 === slot2 && slot2 === slot3) {
    return betAmount * 3;
  } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
    return betAmount * 2;
  } else {
    return -betAmount;
  }
}

function getSpinResultMessage(slot1, slot2, slot3, winnings, getLang) {
  if (winnings > 0) {
    if (slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
      return getLang("jackpot_message", formatMoney(winnings), "❤");
    } else {
      return getLang("win_message", formatMoney(winnings)) + `\n• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬 [ ${slot1} | ${slot2} | ${slot3} ]`;
    }
  } else {
    return getLang("lose_message", formatMoney(-winnings)) + `\n• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬 [ ${slot1} | ${slot2} | ${slot3} ]`;
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
