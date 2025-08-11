const axios = require("axios");

const mahmud = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return base.data.mahmud;
  } catch (error) {
    throw new Error("Failed to fetch base API URL");
  }
};

module.exports = {
  config: {
    name: "hadis",
    aliases: ["hadith"],
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "islamic",
    shortDescription: {
      en: "Random Bangla Hadis"
    },
    longDescription: {
      en: "Sends a random Bangla Hadis with source from Mahmud's global API"
    },
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    // Author check
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);
    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage("❌ You are not authorized to change the author name.", event.threadID, event.messageID);
    }

    try {
      const base = await mahmud();
      const res = await axios.get(`${base}/api/hadis`);
      const hadis = res.data;

      const replyMsg = `╭────────────◊\n` +
                       `├‣ 📖 ${hadis.text}\n` +
                       `╰────────────◊\n` +
                       `- ${hadis.source} 🖤`;

      api.sendMessage(replyMsg, event.threadID, event.messageID);
    } catch (err) {
      api.sendMessage("🥹 Error fetching hadis, contact MahMUD", event.threadID, event.messageID);
    }
  }
};
