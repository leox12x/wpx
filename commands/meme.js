const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "meme",
    aliases: ["memes", "funny"],
    version: "2.0",
    author: "MahMUD",
    countDown: 8,
    role: 0,
    category: "fun",
    guide: "{pn} → Get a random meme"
  },

  onStart: async function ({ api, event }) {
    try {
      const apiUrl = await mahmud();
      const res = await axios.get(`${apiUrl}/api/meme`);
      const imageUrl = res.data?.imageUrl;

      if (!imageUrl) {
        return api.sendMessage("❎ Could not fetch meme. Please try again later.", event.threadID, event.messageID);
      }

      const imgStream = await axios({
        method: "GET",
        url: imageUrl,
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      return api.sendMessage(
        {
          body: "😂 | 𝐑𝐚𝐧𝐝𝐨𝐦 𝐌𝐞𝐦𝐞 𝐟𝐨𝐫 𝐲𝐨𝐮",
          attachment: imgStream.data
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      return api.sendMessage("⚠️ Error: Could not fetch meme API!", event.threadID, event.messageID);
    }
  }
};
