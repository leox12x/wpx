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
  config: {
    name: "bot2",
    version: "1.8",
    author: "MahMUD",
    role: 0,
    coolDown: 3,
    shortDescription: "Talk with jan",
    longDescription: "Text-based response using jan AI, reply supported",
    category: "ai",
    guide: "Type 'jan' or reply to a jan message",
  },

  // ✅ Reply handle
  onReply: async function ({ message, event }) {
    const text = message.body?.toLowerCase() || "";
    if (!text) return;

    const replyText = await getBotResponse(text);
    return await message.reply(replyText);
  },

  // ✅ Chat handler
  onChat: async function ({ message }) {
    try {
      const body = message.body?.toLowerCase() || "";
      const triggers = ["jan", "jaan", "জান", "hinata", "bby", "baby"];
      const words = body.trim().split(/\s+/);
      const startsWithTrigger = triggers.some(word => body.startsWith(word));

      if (!startsWithTrigger && !message.hasQuotedMsg) return;

      // 📨 If replied to a message previously sent by bot2
      if (message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        if (quotedMsg.fromMe) {
          const replyText = await getBotResponse(body);
          return await message.reply(replyText);
        }
      }

      // 🟦 Message starts with jan...
      if (startsWithTrigger) {
        if (words.length === 1) {
          const replies = [
            "babu khuda lagse🥺",
            "Hop beda😾, Boss বল boss😼",
            "আমাকে ডাকলে, আমি কিন্তূ কিস করে দেবো😘",
            "🐒🐒🐒",
            "bye",
            "naw message daw m.me/mahmud.x07",
            "mb ney bye",
            "meww",
            "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
            "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘",
            "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏"
          ];
          const random = replies[Math.floor(Math.random() * replies.length)];
          return await message.reply(random);
        } else {
          words.shift(); // remove "jan"
          const userMsg = words.join(" ");
          const response = await getBotResponse(userMsg);
          return await message.reply(response);
        }
      }
    } catch (e) {
      console.error("bot2 error:", e);
      await message.reply("❌ Something went wrong.");
    }
  }
};
