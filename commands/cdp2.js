const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "cdp2",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "love",
    guide: {
      en: "{pn} → Get a random Couple DP\n{pn} list → Show total number of Couple DPs"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const baseURL = await mahmud();

      // 📌 Show total count
      if (args[0] === "list") {
        const res = await axios.get(`${baseURL}/api/cdp/list`);
        const { total } = res.data;
        return message.reply(`🎀 𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐮𝐩𝐥𝐞 𝐃𝐏: ${total}`);
      }

      // 📌 Get random couple DP
      const res = await axios.get(`${baseURL}/api/cdp`);
      const { boy, girl } = res.data;
      if (!boy || !girl) return message.reply("⚠ No Couple DP found.");

      await message.reply({
        body: "🎀 | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐜𝐝𝐩 𝐛𝐚𝐛𝐲",
        attachment: [boy, girl] // ✅ WA-bot accepts direct URLs
      });

    } catch (error) {
      console.error("CDP command error:", error.message || error);
      message.reply("🥹 Error, contact MahMUD.");
    }
  }
};
