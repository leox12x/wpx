const moment = require("moment-timezone");
const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "daily",
    aliases: ["dailyreward", "checkin"],
    version: "1.3",
    author: "RL (MongoDB)",
    coolDown: 5,
    role: 0,
    description: "Receive daily gift rewards",
    category: "game",
    guide: {
      en: "{prefix}daily or {prefix}daily info"
    }
  },

  rewardConfig: {
    coin: 100,
    exp: 10
  },

  langs: {
    en: {
      alreadyReceived: "❌ You've already received today's reward!",
      received: "🎁 *Daily Reward Claimed!*\n💰 Coins: +%1\n⭐ Exp: +%2\n\n💼 Total Coins: %3\n🏆 Total EXP: %4",
      rewardInfo: "📅 *Daily Reward Schedule*\n\n%1\n\n💡 Rewards increase by 20% each day!"
    }
  },

  onStart: async function ({ message, args, config }) {
    const userId = message.author;
    const reward = this.rewardConfig;
    const tz = config?.bot?.timezone || "Asia/Dhaka";
    const now = moment.tz(tz);
    const today = now.format("DD/MM/YYYY");
    const dayIndex = now.day() || 7;

    if (args[0] === "info") {
      let lines = "";
      for (let i = 1; i <= 7; i++) {
        const c = Math.floor(reward.coin * (1 + 0.2) ** (i - 1));
        const e = Math.floor(reward.exp * (1 + 0.2) ** (i - 1));
        lines += `📆 ${this.getDayName(i)}: ${c} coins, ${e} exp\n`;
      }
      return message.reply(this.langs.en.rewardInfo.replace("%1", lines));
    }

    const user = await getUserData(userId) || {};
    if (user.lastDailyReward === today)
      return message.reply(this.langs.en.alreadyReceived);

    const getCoin = Math.floor(reward.coin * (1 + 0.2) ** (dayIndex - 1));
    const getExp = Math.floor(reward.exp * (1 + 0.2) ** (dayIndex - 1));

    user.coins = (user.coins || 0) + getCoin;
    user.exp = (user.exp || 0) + getExp;
    user.level = this.calculateLevel(user.exp);
    user.lastDailyReward = today;
    user.lastActive = Date.now();

    await updateUserData(userId, user);

    const msg = this.langs.en.received
      .replace("%1", getCoin)
      .replace("%2", getExp)
      .replace("%3", user.coins)
      .replace("%4", user.exp);

    await message.reply(msg);
    log(`✅ ${userId} claimed daily: +${getCoin} coins, +${getExp} exp`);
  },

  getDayName(i) {
    return ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i - 1];
  },

  calculateLevel(exp) {
    return Math.floor(exp / 100) + 1;
  }
};
