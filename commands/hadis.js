const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
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

  onStart: async function ({ message }) {
    try {
      const base = await mahmud();
      const res = await axios.get(`${base}/api/hadis`);
      const hadis = res.data;

      await message.reply(
        `${hadis.text}\n\n- ${hadis.source} 🖤`
      );
    } catch (err) {
      await message.reply("🥹 Error fetching Hadis, contact MahMUD");
    }
  }
};
