const axios = require("axios");
const { MessageMedia } = require("whatsapp-web.js");
const Jimp = require("jimp");

module.exports = {
  config: {
    name: "cdp2",
    version: "2.1",
    author: "MahMUD | Fixed by Rahaman Leon",
    countDown: 5,
    role: 0,
    category: "image",
    guide: "{pn} - Get a random Couple DP\n{pn} list - Show total number of Couple DPs"
  },

  onStart: async function ({ message, args }) {
    try {
      // 📋 List option
      if (args[0] === "list") {
        const res = await axios.get("https://mahmud-global-apis.onrender.com/api/cdp/list");
        return message.reply(`🎀 Total Couple DPs: ${res.data.total}`);
      }

      // 🎀 Fetch couple dp
      const res = await axios.get("https://mahmud-global-apis.onrender.com/api/cdp");
      const { boy, girl } = res.data || {};

      if (!boy || !girl) return message.reply("⚠ No Couple DP found.");

      // Load images with Jimp
      const boyImg = await Jimp.read(boy);
      const girlImg = await Jimp.read(girl);

      // Resize both images same height
      boyImg.resize(300, 300);
      girlImg.resize(300, 300);

      // Create new canvas double width
      const collage = new Jimp(600, 300);

      // Place boy left, girl right
      collage.composite(boyImg, 0, 0);
      collage.composite(girlImg, 300, 0);

      // Get buffer
      const buffer = await collage.getBufferAsync(Jimp.MIME_JPEG);

      // Send as one image
      const media = new MessageMedia("image/jpeg", buffer.toString("base64"), "couple_dp.jpg");
      await message.reply(media, undefined, { caption: "🎀 Here's your Couple DP 👩‍❤️‍👨" });

    } catch (err) {
      console.error("[CDP Command Error]", err.message);
      return message.reply("❌ Failed to process your request. Try again later.");
    }
  }
};
