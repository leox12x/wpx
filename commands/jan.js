const axios = require("axios");

// ✅ Base API getter
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.jan;
};

// ✅ Main response fetcher
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

// ✅ Exported WhatsApp Bot command
module.exports = {
  name: "bot2",
  description: "Talk with jan AI",
  category: "ai",
  usage: "jan <message> | reply jan message",
  
  // 📌 এই ফাংশনটা প্রতি মেসেজে চলবে
  onMessage: async (message, client) => {
    try {
      const body = message.body?.toLowerCase() || "";
      const triggers = ["jan", "jaan", "জান", "hinata", "bby", "baby"];
      const words = body.trim().split(/\s+/);
      const match = triggers.some(trigger => body.startsWith(trigger));

      // ✅ 1. যদি jan এর রিপ্লাই হয়
      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        if (quoted.fromMe && quoted.body?.includes("jan")) {
          const replyText = await getBotResponse(body);
          return await message.reply(replyText);
        }
      }

      // ✅ 2. যদি শুধু jan/জান লিখে পাঠায়
      if (match) {
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
          // ✅ jan <message> এর জন্য
          words.shift(); // "jan" বাদ
          const query = words.join(" ");
          const replyText = await getBotResponse(query);
          return await message.reply(replyText);
        }
      }
    } catch (e) {
      console.error("Bot2 Chat Error:", e);
      await message.reply("❌ Something went wrong.");
    }
  }
};
