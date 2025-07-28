const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "say",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "media",
    guide: {
      en: "{pn} <text> (or reply to a message)"
    }
  },

  onStart: async function ({ message, args, event }) {
    let text = args.join(" ");

    // Check if reply text exists
    if (event.message?.contextInfo?.quotedMessage?.conversation) {
      text = event.message.contextInfo.quotedMessage.conversation;
    }

    if (!text) {
      return message.reply("⚠️ দয়া করে কিছু লিখুন বা একটি মেসেজে রিপ্লাই দিন!");
    }

    try {
      const baseUrl = await baseApiUrl();
      const response = await axios.get(`${baseUrl}/api/say`, {
        params: { text },
        headers: { "Author": module.exports.config.author },
        responseType: "stream",
      });

      message.reply({
        body: "",
        attachment: response.data,
      });

    } catch (e) {
      console.error("API Error:", e.response ? e.response.data : e.message);
      message.reply("🥹 Error, contact MahMUD.\n" + (e.response?.data?.error || e.message));
    }
  }
};
