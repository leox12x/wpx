const axios = require("axios");

// Base API URL fetcher
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.jan;
};

// Get response from API
async function getBotResponse(message) {
  try {
    const base = await baseApiUrl();
    const response = await axios.get(`${base}/jan/font3/${encodeURIComponent(message)}`);
    return response.data?.message || "try Again";
  } catch (error) {
    console.error("API Error:", error.message || error);
    return "error janu 🥲";
  }
}

// Export for WhatsApp-style bot
module.exports = {
  config: {
    name: "bot2",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    description: { en: "No prefix bot command for WhatsApp." },
    category: "ai",
    guide: { en: "Type jan or jan [your message]" },
  },

  onMessage: async function ({ message, reply, senderID }) {
    const responses = [
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
      "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏",
    ];

    const triggers = ["jan", "jaan", "জান", "hinata"];
    const content = message.body?.toLowerCase() || "";
    const words = content.trim().split(/\s+/);
    const firstWord = words[0];

    // If the message starts with a trigger
    if (triggers.includes(firstWord)) {
      if (words.length === 1) {
        const randomMsg = responses[Math.floor(Math.random() * responses.length)];
        return reply(randomMsg);
      } else {
        const userMessage = words.slice(1).join(" ");
        const botReply = await getBotResponse(userMessage);
        return reply(botReply);
      }
    }
  },
};
