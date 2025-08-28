const axios = require("axios");

// Fetch base API from GitHub
const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "joke",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: {
      en: "Get a random joke"
    },
    longDescription: {
      en: "Fetches a funny joke from Mahmud's global API"
    },
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const apiUrl = `${await mahmud()}/api/joke`;
      const res = await axios.get(apiUrl);
      const { joke, message } = res.data;

      return api.sendMessage(
        `${message}\n\n😂 ${joke}`,
        event.threadID,
        event.messageID
      );
    } catch (err) {
      return api.sendMessage(
        "⚠️ Error fetching joke. Please contact MahMUD.",
        event.threadID,
        event.messageID
      );
    }
  }
};
