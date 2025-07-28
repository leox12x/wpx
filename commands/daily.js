const moment = require("moment-timezone");
const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "daily",
    aliases: ["dailyreward", "checkin"],
    version: "1.2",
    author: "NTKhang (Converted by RL)",
    coolDown: 5,
    role: 0,
    description: "Receive daily gift rewards",
    category: "game",
    guide: {
      en: "Use {prefix}daily to receive daily reward\nUse {prefix}daily info to view daily gift information"
    }
  },

  rewardConfig: {
    coin: 100,
    exp: 10
  },

  langs: {
    en: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      alreadyReceived: "❌ You have already received today's gift!\nCome back tomorrow for your next reward.",
      received: "🎁 *Daily Reward Claimed!*\n\n💰 Coins: +%1\n⭐ Experience: +%2\n\n💼 Total Coins: %3\n🏆 Total EXP: %4",
      rewardInfo: "📅 *Daily Reward Information*\n\n%1\n\n💡 Rewards increase by 20% each day!\n⏰ Reset time: Midnight (Asia/Dhaka)"
    }
  },

  onStart: async function ({ message, args, contact, config, prefix }) {
    try {
      const userId = contact.id._serialized;
      const reward = this.rewardConfig;

      // Show reward info
      if (args[0] === "info") {
        let rewardList = "";
        for (let i = 1; i <= 7; i++) {
          const coin = Math.floor(reward.coin * (1 + 0.2) ** (i - 1));
          const exp = Math.floor(reward.exp * (1 + 0.2) ** (i - 1));
          const dayName = this.getDayName(i);
          rewardList += `📆 ${dayName}: ${coin} coins, ${exp} exp\n`;
        }
        const infoMsg = this.langs.en.rewardInfo.replace("%1", rewardList.trim());
        return await message.reply(infoMsg);
      }

      // Time & date setup
      const currentTime = moment.tz(config.bot.timezone || "Asia/Dhaka");
      const dateString = currentTime.format("DD/MM/YYYY");
      const currentDay = currentTime.day(); // 0 = Sunday

      // Load user data
      let userData = await getUserData(userId);
      if (!userData || typeof userData !== "object") userData = {};

      // Assign safe defaults
      userData.coins = typeof userData.coins === "number" ? userData.coins : 0;
      userData.exp = typeof userData.exp === "number" ? userData.exp : 0;
      userData.level = typeof userData.level === "number" ? userData.level : 1;
      userData.lastDailyReward = userData.lastDailyReward || null;
      userData.lastActive = Date.now();

      // Save defaults if new user
      await updateUserData(userId, userData);

      // Already claimed today?
      if (userData.lastDailyReward === dateString) {
        return await message.reply(this.langs.en.alreadyReceived);
      }

      // Reward based on weekday
      const dayIndex = currentDay === 0 ? 7 : currentDay;
      const getCoin = Math.floor(reward.coin * (1 + 0.2) ** (dayIndex - 1));
      const getExp = Math.floor(reward.exp * (1 + 0.2) ** (dayIndex - 1));

      // Update user
      userData.coins += getCoin;
      userData.exp += getExp;
      userData.lastDailyReward = dateString;
      userData.lastActive = Date.now();

      // Level up logic
      const newLevel = this.calculateLevel(userData.exp);
      if (newLevel > userData.level) {
        userData.level = newLevel;
      }

      // Save updated data
      await updateUserData(userId, userData);

      // Reply success
      const replyMsg = this.langs.en.received
        .replace("%1", getCoin)
        .replace("%2", getExp)
        .replace("%3", userData.coins)
        .replace("%4", userData.exp);

      await message.reply(replyMsg);
      log(`✅ ${contact.name || contact.number} claimed daily: +${getCoin} coins, +${getExp} exp`, "info");

    } catch (err) {
      console.error("❌ Error in daily command:", err);
      await message.reply("❌ Failed to retrieve your user data.");
    }
  },

  getDayName(dayIndex) {
    const names = {
      1: this.langs.en.monday,
      2: this.langs.en.tuesday,
      3: this.langs.en.wednesday,
      4: this.langs.en.thursday,
      5: this.langs.en.friday,
      6: this.langs.en.saturday,
      7: this.langs.en.sunday
    };
    return names[dayIndex] || "Unknown";
  },

  calculateLevel(exp) {
    return Math.floor(exp / 100) + 1;
  }
};
