// File: rank.js
// Author: tas33n | Fixed by Rahaman Leon
// Description: Check user rank and XP system

const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "rank",
    aliases: ["level", "xp",],
    version: "1.1",
    author: "xxxxxxx",
    coolDown: 3,
    role: 0,
    description: "Check your current rank and XP",
    category: "info",
    guide: {
      en: "{prefix}rank - Check your current rank and XP\n" +
          "{prefix}rank @user - Check another user's rank\n" +
          "{prefix}rank top - Show top 10 leaderboard"
    }
  },

  onStart: async function ({ message, client, args, contact, chat, isGroup }) {
    try {
      const config = require('../config.json');
      const dbPath = path.resolve(__dirname, '..', config.database.path);
      
      // Ensure database exists
      if (!await fs.pathExists(dbPath)) {
        return await message.reply("⚠️ No ranking data found. Start chatting to gain XP!");
      }

      const data = await fs.readJSON(dbPath);

      // Initialize users object if it doesn't exist
      if (!data.users) {
        data.users = {};
        await fs.writeJSON(dbPath, data, { spaces: 2 });
      }

      // Check if this is a leaderboard request
      if (args[0] && args[0].toLowerCase() === 'top') {
        return await this.showLeaderboard(message, client, data);
      }

      // Determine target user
      let targetUserId = contact.id._serialized;
      let targetName = contact.name || contact.pushname || "You";

      // Check if user mentioned someone or replied to someone
      if (message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        targetUserId = quotedMsg.author || quotedMsg.from;
        try {
          const targetContact = await client.getContactById(targetUserId);
          targetName = targetContact.name || targetContact.pushname || targetUserId.split('@')[0];
        } catch (error) {
          targetName = targetUserId.split('@')[0];
        }
      } else {
        const mentions = await message.getMentions();
        if (mentions && mentions.length > 0) {
          targetUserId = mentions[0].id._serialized;
          targetName = mentions[0].name || mentions[0].pushname || targetUserId.split('@')[0];
        }
      }

      // Check if target user has data
      if (!data.users[targetUserId]) {
        const isOwnProfile = targetUserId === contact.id._serialized;
        const pronoun = isOwnProfile ? "You're" : `${targetName} is`;
        return await message.reply(`❌ ${pronoun} not ranked yet. ${isOwnProfile ? 'Start' : 'They need to start'} messaging to gain XP!`);
      }

      // Get all users and sort by experience points
      const allUsers = Object.entries(data.users)
        .map(([id, info]) => ({
          id,
          exp: info.exp || 0,
          level: info.level || 1,
          messageCount: info.messageCount || 0,
          coins: info.coins || 0,
          lastActive: info.lastActive || 0
        }))
        .sort((a, b) => b.exp - a.exp);

      // Find user's rank
      const rank = allUsers.findIndex(u => u.id === targetUserId) + 1;
      const userInfo = data.users[targetUserId];
      const userExp = userInfo.exp || 0;
      const userLevel = userInfo.level || 1;
      const userMessages = userInfo.messageCount || 0;
      const userCoins = userInfo.coins || 0;

      // Calculate XP needed for next level
      const xpForCurrentLevel = this.getXPForLevel(userLevel);
      const xpForNextLevel = this.getXPForLevel(userLevel + 1);
      const xpProgress = Math.max(0, userExp - xpForCurrentLevel);
      const xpNeeded = Math.max(0, xpForNextLevel - userExp);

      // Create progress bar
      const progressBarLength = 10;
      const xpRange = xpForNextLevel - xpForCurrentLevel;
      const progressPercent = xpRange > 0 ? Math.max(0, Math.min(xpProgress / xpRange, 1)) : 0;
      const filledBars = Math.max(0, Math.floor(progressPercent * progressBarLength));
      const emptyBars = Math.max(0, progressBarLength - filledBars);
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      // Format last active
      const lastActiveText = userInfo.lastActive ? 
        this.formatTimeAgo(Date.now() - userInfo.lastActive) : 'Unknown';

      const isOwnProfile = targetUserId === contact.id._serialized;
      const title = isOwnProfile ? "🏆 Your Rank Info" : `🏆 ${targetName}'s Rank Info`;
      const possessive = isOwnProfile ? "Your" : `${targetName}'s`;

      const response = `
${title}
━━━━━━━━━━━━━━━━━━━━━
🔸 **Rank:** #${rank} out of ${allUsers.length}
🔸 **Level:** ${userLevel}
🔸 **Experience:** ${userExp.toLocaleString()} XP
🔸 **Messages:** ${userMessages.toLocaleString()}
🔸 **Coins:** ${userCoins.toLocaleString()}
🔸 **Last Active:** ${lastActiveText}
━━━━━━━━━━━━━━━━━━━━━
📊 **Progress to Level ${userLevel + 1}:**
${progressBar} ${Math.round(progressPercent * 100)}%
⚡ **XP Needed:** ${xpNeeded.toLocaleString()} XP

💡 *Tip: Send messages to gain XP and climb the ranks!*
      `.trim();

      return await message.reply(response);

    } catch (error) {
      console.error("Error in rank command:", error);
      return await message.reply("❌ An error occurred while fetching rank data. Please try again.");
    }
  },

  // Show leaderboard
  async showLeaderboard(message, client, data) {
    try {
      if (!data.users || Object.keys(data.users).length === 0) {
        return await message.reply("📊 No users in the leaderboard yet!");
      }

      // Get top 10 users
      const topUsers = Object.entries(data.users)
        .map(([id, info]) => ({
          id,
          exp: info.exp || 0,
          level: info.level || 1,
          messageCount: info.messageCount || 0
        }))
        .sort((a, b) => b.exp - a.exp)
        .slice(0, 10);

      let leaderboard = "🏆 **Top 10 Leaderboard**\n━━━━━━━━━━━━━━━━━━━━━\n";

      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        let userName;

        try {
          const contact = await client.getContactById(user.id);
          userName = contact.name || contact.pushname || user.id.split('@')[0];
        } catch (error) {
          userName = user.id.split('@')[0];
        }

        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        leaderboard += `${medal} **${userName}**\n`;
        leaderboard += `   Level ${user.level} • ${user.exp.toLocaleString()} XP\n\n`;
      }

      leaderboard += "💡 *Keep chatting to climb the ranks!*";

      return await message.reply(leaderboard);

    } catch (error) {
      console.error("Error showing leaderboard:", error);
      return await message.reply("❌ Error loading leaderboard.");
    }
  },

  // Calculate XP required for a specific level
  getXPForLevel(level) {
    // XP formula: level^2 * 50 (gets harder as level increases)
    return Math.floor(Math.pow(level, 2) * 50);
  },

  // Format time ago
  formatTimeAgo(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }
};
