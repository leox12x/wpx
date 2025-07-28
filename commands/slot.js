const { getUserData, updateUserData, log } = require('../database'); // adjust path if needed

module.exports = {
  config: {
    name: "slot",
    aliases: ["spin"],
    version: "1.3",
    author: "Mahmud",
    countDown: 5,
    role: 0,
    description: "Play slot and win coins!",
    category: "game",
    guide: {
      en: "Use: slot <bet>"
    }
  },

  onStart: async function ({ message, event, args }) {
    try {
      if (!event || !event.senderID) {
        log("❌ Slot Error: senderID not found", "error");
        return message.reply("❌ Internal error: Missing sender ID.");
      }

      const senderID = event.senderID;
      const maxLimit = 20;
      const slotCooldown = 10 * 60 * 60 * 1000; // 10 hours

      if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) {
        return message.reply("❌ Enter a valid bet amount.");
      }

      const bet = parseInt(args[0]);
      if (bet > 10000000) {
        return message.reply("❌ Max bet is 10M.");
      }

      const user = await getUserData(senderID);

      // Init slot if not present
      if (!user.slots) {
        user.slots = {
          count: 0,
          firstSlot: Date.now()
        };
      }

      const now = Date.now();
      const timePassed = now - user.slots.firstSlot;

      if (timePassed > slotCooldown) {
        user.slots.count = 0;
        user.slots.firstSlot = now;
      }

      if (user.slots.count >= maxLimit) {
        const timeLeft = slotCooldown - timePassed;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return message.reply(`⏳ You've used all ${maxLimit} slot plays.\nWait ${hours}h ${minutes}m to play again.`);
      }

      if (user.coins < bet) {
        return message.reply(`💰 You only have ${user.coins} coins.`);
      }

      const slots = ['🍒', '🍋', '🍉', '⭐', '7️⃣'];
      const spin = () => slots[Math.floor(Math.random() * slots.length)];
      const result = [spin(), spin(), spin()];

      let win = false;
      let winAmount = 0;

      if (result[0] === result[1] && result[1] === result[2]) {
        win = true;
        winAmount = bet * 5;
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        win = true;
        winAmount = bet * 2;
      }

      user.slots.count++;
      user.coins += win ? (winAmount - bet) : -bet;

      await updateUserData(senderID, {
        coins: user.coins,
        slots: user.slots
      });

      const resultMessage = `🎰 [ ${result.join(" | ")} ]\n${win ? `🎉 You won ${winAmount} coins!` : `😢 You lost ${bet} coins.`}\n💼 Balance: ${user.coins} coins`;

      return message.reply(resultMessage);
    } catch (err) {
      log(`❌ Slot Error: ${err.message}`, "error");
      return message.reply("❌ Error playing slot. Try again later.");
    }
  }
};
