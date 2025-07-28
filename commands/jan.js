const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.jan;
};

const getBotResponse = async (msg) => {
  try {
    const base = await baseApiUrl();
    const res = await axios.get(`${base}/jan/font3/${encodeURIComponent(msg)}`);
    return res.data?.message || "❌ Try again.";
  } catch (err) {
    console.error("API Error:", err.message || err);
    return "❌ Error occurred, janu 🥲";
  }
};

module.exports = {
  name: "bot",
  version: "1.7",
  author: "MahMUD",
  role: 0,
  coolDown: 3,
  shortDescription: "Talk with jan",
  longDescription: "Text-based response using jan AI",
  category: "ai",
  guide: "Just type jan or jan <message>, or reply jan message",

  onStart: async function () {},

  onChat: async function ({ message, client }) {
    const body = message.body?.toLowerCase() || "";
    const triggers = ["jan", "jaan", "জান", "hinata", "bby", "baby"];
    const words = body.trim().split(/\s+/);
    const match = triggers.some(trigger => body.startsWith(trigger));

    try {
      // ✅ 1. Handle reply to jan message
      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        if (quoted.fromMe) {
          const replyText = await getBotResponse(body);
          return await message.reply(replyText);
        }
      }

      // ✅ 2. Normal "jan ..." message
      if (match) {
        if (words.length === 1) {
          const replies = [ 
            // 🌟 Full reply list from your message...
            "babu khuda lagse🥺",
            "Hop beda😾,Boss বল boss😼",
            // ... rest of replies ...
            "মন সুন্দর বানাও মুখের জন্য তো Snapchat আছেই! 🌚"
          ];
          const random = replies[Math.floor(Math.random() * replies.length)];
          return await message.reply(random);
        } else {
          words.shift(); // remove "jan"
          const query = words.join(" ");
          const replyText = await getBotResponse(query);
          return await message.reply(replyText);
        }
      }
    } catch (e) {
      console.error("Bot Chat Error:", e);
      await message.reply("❌ Something went wrong.");
    }
  }
};
