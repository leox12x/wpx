const axios = require("axios");

// Fetch base API from your GitHub
const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quote",
    aliases: ["quotes", "q"],
    version: "2.1",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Get a random Mahmud quote"
    },
    longDescription: {
      en: "Fetches a deep or inspiring quote from Mahmud's global API"
    },
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const apiUrl = `${await mahmud()}/api/quote`;
      const res = await axios.get(apiUrl);
      const { quote, message } = res.data;

      return api.sendMessage(
        `💡 *${message}*\n\n❝ ${quote} ❞`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      return api.sendMessage(
        "⚠️ Error fetching quote. Please contact MahMUD.",
        event.threadID,
        event.messageID
      );
    }
  }
};
