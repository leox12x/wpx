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
    guide: "{pn} <text> (or reply to a message)",
  },

  onStart: async function ({ message, reply, args }) {
    let text = args.join(" ");

    // Check if the message is a reply with quoted message text
    if (!text && message.quoted && message.quoted.text) {
      text = message.quoted.text;
    }

    if (!text) {
      return reply("⚠️ দয়া করে কিছু লিখুন বা একটি মেসেজে রিপ্লাই দিন!");
    }

    try {
      const baseUrl = await baseApiUrl();

      // Make request, expect audio or media stream in response
      const response = await axios.get(`${baseUrl}/api/say`, {
        params: { text },
        headers: { "Author": module.exports.config.author },
        responseType: "arraybuffer",  // get raw data buffer
      });

      // Convert buffer to a format suitable for WhatsApp media (like base64 or Buffer)
      const mediaBuffer = Buffer.from(response.data);

      // Send audio/media message with caption empty or text
      await reply({
        audio: mediaBuffer,
        mimetype: "audio/mpeg", // adjust mime type if known
        ptt: true,              // if this is a voice note style
        // caption: text,       // optional: include original text as caption
      });

    } catch (e) {
      console.error("API Error:", e.response ? e.response.data : e.message);
      reply("🥹 error, contact MahMUD.\n" + (e.response?.data?.error || e.message));
    }
  },
};
