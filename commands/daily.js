const moment = require("moment-timezone");
const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
    config: {
        name: "daily",
        aliases: ["dailyreward", "checkin"],
        version: "1.2",
        author: "NTKhang (Converted by RL)",
        coolDown: 5,
        role: 0, // Available to all users
        description: "Receive daily gift rewards",
        category: "game",
        guide: {
            en: "Use {prefix}daily to receive daily reward\nUse {prefix}daily info to view daily gift information"
        }
    },

    // Reward configuration
    rewardConfig: {
        coin: 100,
        exp: 10
    },

    // Language strings
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
            const userId = contact.id._serialized;
            const reward = this.rewardConfig;
            
            // Show reward information
            if (args[0] === "info") {
                let rewardList = "";
                
                for (let i = 1; i <= 7; i++) {
                    const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** ((i === 7 ? 0 : i) - 1));
                    const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** ((i === 7 ? 0 : i) - 1));
                    
                    const dayName = this.getDayName(i);
                    rewardList += `${dayName}: ${getCoin} coins, ${getExp} exp\n`;
                }
                
                const infoMessage = this.langs.en.rewardInfo
                    .replace("{rewardList}", rewardList.trim());
                
                return await message.reply(infoMessage);
            }

            // Get current date and day
            const currentTime = moment.tz(config.bot.timezone || "Asia/Dhaka");
            const dateString = currentTime.format("DD/MM/YYYY");
            const currentDay = currentTime.day(); // 0: Sunday, 1: Monday, etc.
            
            // Get user data
            const userData = await getUserData(userId);
            
            // Check if user already claimed today
            if (userData.lastDailyReward === dateString) {
                return await message.reply(this.langs.en.alreadyReceived);
            }

            // Calculate reward based on current day
            const dayIndex = currentDay === 0 ? 7 : currentDay; // Convert Sunday (0) to 7
            const getCoin = Math.floor(reward.coin * (1 + 20 / 100) ** (dayIndex - 1));
            const getExp = Math.floor(reward.exp * (1 + 20 / 100) ** (dayIndex - 1));
            
            // Update user data
            const updatedData = await updateUserData(userId, {
                coins: userData.coins + getCoin,
                exp: userData.exp + getExp,
                lastDailyReward: dateString,
                lastActive: Date.now()
            });

            // Calculate level if needed
            const newLevel = this.calculateLevel(updatedData.exp);
            if (newLevel > userData.level) {
                await updateUserData(userId, { level: newLevel });
                updatedData.level = newLevel;
            }

            // Send success message
            const successMessage = this.langs.en.received
                .replace("{coin}", getCoin)
                .replace("{exp}", getExp)
                .replace("{totalCoins}", updatedData.coins)
                .replace("{totalExp}", updatedData.exp);

            await message.reply(successMessage);
            
            // Log the daily reward claim
            log(`Daily reward claimed by ${contact.name || contact.number}: ${getCoin} coins, ${getExp} exp`, 'info');

        } catch (error) {
            log(`Error in daily command: ${error.message}`, 'error');
            await message.reply("❌ An error occurred while processing your daily reward. Please try again later.");
        }
    },

    // Helper function to get day name
    getDayName(dayIndex) {
        const dayNames = {
            1: this.langs.en.monday,
            2: this.langs.en.tuesday,
            3: this.langs.en.wednesday,
            4: this.langs.en.thursday,
            5: this.langs.en.friday,
            6: this.langs.en.saturday,
            7: this.langs.en.sunday
        };
        return dayNames[dayIndex] || "Unknown";
    },

    // Helper function to calculate level based on experience
    calculateLevel(exp) {
        // Simple level calculation: level = floor(exp / 100) + 1
        return Math.floor(exp / 100) + 1;
    }
};
