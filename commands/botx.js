const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.jan;
};

async function getBotResponse(message) {
  try {
    const base = await baseApiUrl();
    const response = await axios.get(`${base}/jan/font3/${encodeURIComponent(message)}`);
    return response.data?.message || "try Again";
  } catch (err) {
    console.error("API Error:", err.message || err);
    return "error janu 🥲";
  }
}

module.exports = {
  config: {
    name: "botx",
    version: "1.0",
    author: "MahMUD",
    role: 0,
    description: { en: "WhatsApp-style Jan bot" },
    category: "ai",
    guide: { en: "Type jan or jan [text]" }
  },

  onStart: async function () {},

  onMessage: async function ({ message, reply }) {
    const triggers = ["jan", "jaan", "জান", "hinata"];
    const randomReplies = [
      "babu khuda lagse🥺",
      "Hop beda😾, Boss বল boss😼",
      "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘",
      "naw message daw m.me/mahmud.x07",
      "mb ney bye",
      "🐒🐒🐒",
    ];

    const content = message.body?.toLowerCase() || "";
    const words = content.trim().split(/\s+/);
    const firstWord = words[0];

    if (triggers.includes(firstWord)) {
      if (words.length === 1) {
        return reply(randomReplies[Math.floor(Math.random() * randomReplies.length)]);
      } else {
        const text = words.slice(1).join(" ");
        const response = await getBotResponse(text);
        return reply(response);
      }
    }
  }
};
