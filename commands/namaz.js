// ==================== NAMAZ COMMAND ====================
// Author: MahMUD
// Description: Fetch prayer times for a given city

const axios = require("axios");

// === Get base API URL from GitHub ===
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "namaz",
    aliases: ["prayer", "salah"],
    version: "1.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "Islamic",
    description: "Fetch prayer times for a city",
    guide: "{pn} <city>\nExample: {pn} Dhaka"
  },

  onStart: async function ({ message, args, api, event }) {
    const city = args.join(" ") || "Dhaka";
    const apiUrl = `${await baseApiUrl()}/api/namaz/font3/${encodeURIComponent(city)}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: { "author": module.exports.config.author }
      });

      const threadID = event.threadID;
      const messageID = event.messageID;

      if (response.data?.error) {
        return api.sendMessage("❌ | " + response.data.error, threadID, { replyMessageID: messageID });
      }

      if (response.data?.message) {
        return api.sendMessage("🕌 | " + response.data.message, threadID, { replyMessageID: messageID });
      }

      return api.sendMessage(`⚠️ | No prayer times available for ${city}.`, threadID, { replyMessageID: messageID });

    } catch (err) {
      console.error(err);
      return api.sendMessage("🥹 | Error fetching prayer times, please try again later.", event.threadID, { replyMessageID: event.messageID });
    }
  }
};
