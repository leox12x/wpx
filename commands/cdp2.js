const axios = require("axios");
const { MessageMedia } = require("whatsapp-web.js");

module.exports = {
  config: {
    name: "cdp2",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "image",
    guide: "{pn} - Get a random Couple DP\n{pn} list - Show total number of Couple DPs"
  },

  onStart: async function ({ message, args }) {
    try {
      // 📋 Show total list
      if (args[0] === "list") {
        const res = await axios.get("https://mahmud-global-apis.onrender.com/api/cdp/list", { timeout: 5000 });
        const { total } = res.data || {};
        return message.reply(total ? `🎀 Total Couple DPs: ${total}` : "⚠ No data available.");
      }

      // 🎀 Fetch random couple dp
      const res = await axios.get("https://mahmud-global-apis.onrender.com/api/cdp", { timeout: 7000 });
      const { boy, girl } = res.data || {};

      if (!boy || !girl) return message.reply("⚠ No Couple DP found.");

      // Helper: convert url → media
      const getMedia = async (url) => {
        try {
          const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" },
            timeout: 7000
          });
          const buffer = Buffer.from(response.data, "binary");
          const mimeType = response.headers["content-type"] || "image/jpeg";
          return new MessageMedia(mimeType, buffer.toString("base64"), "dp.jpg");
        } catch (err) {
          console.error(`[CDP Fetch Error] ${url}:`, err.message);
          // fallback
          const fallback = await axios.get("https://picsum.photos/300/300", { responseType: "arraybuffer" });
          return new MessageMedia("image/jpeg", Buffer.from(fallback.data).toString("base64"), "fallback.jpg");
        }
      };

      // ⬇️ Load both images in parallel
      const [mediaBoy, mediaGirl] = await Promise.all([getMedia(boy), getMedia(girl)]);

      // Send both together in a single reply
      await message.reply([mediaBoy, mediaGirl], undefined, { caption: "🎀 Here's your Couple DP 👩‍❤️‍👨" });

    } catch (error) {
      console.error("[CDP Command Error]", error.message);
      return message.reply("❌ Failed to process your request. Please try again later.");
    }
  }
};
