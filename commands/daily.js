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
      received: "🎁 **Daily Reward Claimed!**\n\n💰 Coins: +{coin}\n⭐ Experience: +{exp}\n\n💼 Total Coins: {totalCoins}\n🏆 Total EXP: {totalExp}",
      rewardInfo: "📅 **Daily Reward Information**\n\n{rewardList}\n\n💡 Rewards increase by 20% each day!\n⏰ Reset time: Midnight (Asia/Dhaka)"
    }
  },

  onStart: async function ({ message, args, contact, config, prefix }) {
    try {
      const userId = contact?.id?._serialized;
      if (!userId) {
        return await message.reply("❌ Unable to identify user.");
      }

      const reward = this.rewardConfig;

      // If user wants reward info
      if (args[0] === "info") {
        let rewardList = "";
        for (let i = 1; i <= 7; i++) {
          const getCoin = Math.floor(reward.coin * (1 + 0.2) ** ((i === 7 ? 0 : i) - 1));
          const getExp = Math.floor(reward.exp * (1 + 0.2) ** ((i === 7 ? 0 : i) - 1));
          const dayName = this.getDayName(i);
          rewardList += `${dayName}: ${getCoin} coins, ${getExp} exp\n`;
        }

        const infoMessage = this.langs.en.rewardInfo.replace("{rewardList}", rewardList.trim());
        return await message.reply(infoMessage);
      }

      // Time and date check
      const currentTime = moment.tz(config?.bot?.timezone || "Asia/Dhaka");
      const dateString = currentTime.format("DD/MM/YYYY");
      const currentDay = currentTime.day(); // Sunday = 0

      // Fetch user data
      const userData = await getUserData(userId);
      if (!userData) {
        return await message.reply("❌ Failed to retrieve your user data.");
      }

      // Already claimed check
      if (userData.lastDailyReward === dateString) {
        return await message.reply(this.langs.en.alreadyReceived);
      }

      const dayIndex = currentDay === 0 ? 7 : currentDay;
      const getCoin = Math.floor(reward.coin * (1 + 0.2) ** (dayIndex - 1));
      const getExp = Math.floor(reward.exp * (1 + 0.2) ** (dayIndex - 1));

      // Update user
      const updatedData = await updateUserData(userId, {
        coins: (userData.coins || 0) + getCoin,
        exp: (userData.exp || 0) + getExp,
        lastDailyReward: dateString,
        lastActive: Date.now()
      });

      const newLevel = this.calculateLevel(updatedData.exp);
      if (newLevel > (userData.level || 1)) {
        await updateUserData(userId, { level: newLevel });
        updatedData.level = newLevel;
      }

      const successMessage = this.langs.en.received
        .replace("{coin}", getCoin)
        .replace("{exp}", getExp)
        .replace("{totalCoins}", updatedData.coins)
        .replace("{totalExp}", updatedData.exp);

      await message.reply(successMessage);

      log(`✅ ${contact.name || contact.number} claimed daily: +${getCoin} coins, +${getExp} exp`, "info");

    } catch (error) {
      console.error("❌ Daily command error:", error);
      log(`❌ Daily command error: ${error.message}`, "error");
      await message.reply("❌ An error occurred while processing your daily reward. Please try again later.");
    }
  },

  getDayName(dayIndex) {
    const names = this.langs.en;
    const dayNames = {
      1: names.monday,
      2: names.tuesday,
      3: names.wednesday,
      4: names.thursday,
      5: names.friday,
      6: names.saturday,
      7: names.sunday
    };
    return dayNames[dayIndex] || "Unknown";
  },

  calculateLevel(exp) {
    return Math.floor(exp / 100) + 1;
  }
};
