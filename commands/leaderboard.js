const { getAllUsers, getUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "leaderboard",
    aliases: ["top", "lb"],
    version: "1.1",
    author: "RL (MongoDB Version)",
    coolDown: 5,
    role: 0,
    description: "View top players leaderboard",
    category: "game",
    guide: {
      en: "Use {prefix}leaderboard\n{prefix}leaderboard coins\n{prefix}leaderboard exp\n{prefix}leaderboard commands"
    }
  },

  onStart: async function ({ message, args, client }) {
    const type = args[0] || "level";
    const validTypes = ["level", "coins", "exp", "commands"];

    if (!validTypes.includes(type))
      return message.reply(`❌ Invalid type. Use one of: ${validTypes.join(", ")}`);

    const users = await getAllUsers();
    if (!users.length) return message.reply("❌ No user data found.");

    let sortFunc, titleIcon, titleText, valueFormat;

    switch (type) {
      case "coins":
        sortFunc = (a, b) => (b.coins || 0) - (a.coins || 0);
        titleIcon = "💰"; titleText = "Richest Players";
        valueFormat = u => `${u.coins || 0} coins`;
        break;
      case "exp":
        sortFunc = (a, b) => (b.exp || 0) - (a.exp || 0);
        titleIcon = "⭐"; titleText = "Most Experienced";
        valueFormat = u => `${u.exp || 0} XP`;
        break;
      case "commands":
        sortFunc = (a, b) => (b.commandCount || 0) - (a.commandCount || 0);
        titleIcon = "🎮"; titleText = "Most Active";
        valueFormat = u => `${u.commandCount || 0} commands`;
        break;
      default:
        sortFunc = (a, b) => b.level - a.level || b.exp - a.exp;
        titleIcon = "🏆"; titleText = "Top Leveled";
        valueFormat = u => `Level ${u.level || 1} (${u.exp || 0} XP)`;
        break;
    }

    const sorted = users.sort(sortFunc).slice(0, 10);
    let text = `${titleIcon} **${titleText} Leaderboard**\n\n`;

    for (let i = 0; i < sorted.length; i++) {
      const u = sorted[i];
      const rank = i + 1;
      const medal = this.getRankMedal(rank);
      let name = "Unknown";

      try {
        const contact = await client.getContactById(u.id);
        name = contact.name || contact.pushname || u.id.split('@')[0];
      } catch {
        name = u.id?.split('@')[0] || "Unknown";
      }

      if (name.length > 20) name = name.slice(0, 17) + "...";
      text += `${medal} **${rank}.** ${name}\n   ${valueFormat(u)}\n\n`;
    }

    text += `📊 **Total Players:** ${users.length}\n🎯 **Use !profile to check your stats!**`;
    await message.reply(text);
    log(`Leaderboard (${type}) shown`, "info");
  },

  getRankMedal(rank) {
    return { 1: "🥇", 2: "🥈", 3: "🥉", 4: "🏅", 5: "🏅" }[rank] || "▪️";
  }
};
