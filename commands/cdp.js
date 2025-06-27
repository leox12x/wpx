const axios = require("axios");
const { MessageMedia } = require("whatsapp-web.js");

module.exports = {
  config: {
    name: "cdp",
    version: "1.7",
    author: "MahMUD | Fixed by Rahaman Leon",
    countDown: 5,
    role: 0,
    category: "love",
    guide: "{pn} - Get a random Couple DP\n{pn} list - Show total number of Couple DPs"
  },

  onStart: async function ({ message, args }) {
    try {
      if (args[0] === "list") {
        const res = await axios.get("https://mahmud-global-apis.onrender.com/api/cdp/list", {
          timeout: 5000
        });
        const { total } = res.data;
        return message.reply(`🎀 Total Couple DPs: ${total}`);
      }

      const res = await axios.get("https://mahmud-global-apis.onrender.com/api/cdp", {
        timeout: 7000
      });
      const { boy, girl } = res.data;

      if (!boy || !girl) return message.reply("⚠ No Couple DP found.");

      const getMedia = async (url) => {
        try {
          const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "image/*,*/*;q=0.8"
            },
            timeout: 7000
          });

          const buffer = Buffer.from(response.data, "binary");
          const mimeType = response.headers["content-type"] || "image/jpeg";

          return MessageMedia.fromBuffer(buffer, undefined, mimeType);
        } catch (err) {
          console.error(`[CDP Fetch Error] Failed to load: ${url}\n`, err.message);
          // Fallback to a transparent placeholder image
          const fallbackURL = "https://via.placeholder.com/300x300.png?text=Image+Unavailable";
          const fallback = await axios.get(fallbackURL, { responseType: "arraybuffer" });
          return MessageMedia.fromBuffer(Buffer.from(fallback.data), "image/png", "image/png");
        }
      };

      const mediaBoy = await getMedia(boy);
      const mediaGirl = await getMedia(girl);

      await message.reply({
        body: "🎀 Here's your couple DP, lovebirds!",
        attachment: [mediaBoy, mediaGirl]
      });

    } catch (error) {
      console.error("[CDP Command Error]", error.message);
      return message.reply("❌ Failed to process your request. Try again later.");
    }
  }
};
