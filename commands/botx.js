// botx.js
const axios = require("axios");

// Keywords to trigger bot reply
const mahmuds = [
  "baby", "bby", "babu", "bbu", "isu", "jan", "bot", "জান", "hinata"
];

// Local hardcoded replies
const responses = [
  "babu khuda lagse🥺", "Hop beda😾,Boss বল boss😼", "আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘 ",
  "🐒🐒🐒", "bye", "naw message daw m.me/mahmud.x07", "mb ney bye", "meww",
  "গোলাপ ফুল এর জায়গায় আমি দিলাম তোমায় মেসেজ", "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘",
  "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏", "গোসল করে আসো যাও😑😩", "অ্যাসলামওয়ালিকুম", "কেমন আসো",
  "বলেন sir__😌", "আমি অন্যের জিনিসের সাথে কথা বলি না__😏ওকে",
  "𝗕𝗯𝘆 বললে চাকরি থাকবে না", "আজকে আমার mন ভালো নেই 🙉", "Meow🐤"
];

// Fetch the base API URL dynamically from GitHub
const baseApiUrl = async () => {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return res.data.jan;
  } catch (err) {
    console.error("Failed to fetch API URL:", err.message);
    return null;
  }
};

// Call external bot API for intelligent reply
async function getBotResponse(msg) {
  try {
    const base = await baseApiUrl();
    if (!base) return "❌ Service unavailable. Try again later.";
    
    const res = await axios.get(`${base}/jan/font3/${encodeURIComponent(msg)}`);
    return res.data?.message || "Try again later.";
  } catch (err) {
    console.error("API error:", err.message);
    return "❌ Bot error. Try again later.";
  }
}

// Required config object
const config = {
  name: "botx",
  description: "AI chatbot that responds to specific keywords",
  usage: "botx [keyword] [message]",
  aliases: mahmuds,
  author: "mahmudx7",
  version: "1.0",
  category: "AI"
};

// Main command function
async function onStart({ message, args, client }) {
  try {
    const msg = message.body?.toLowerCase().trim();
    if (!msg) return;

    const startsWithKeyword = mahmuds.some(word => msg.startsWith(word));
    if (!startsWithKeyword) return;

    // React with emoji
    await message.react("🪽");

    const words = msg.split(" ");
    if (words.length === 1) {
      // Just "jan" or similar — send random local reply
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      await message.reply(randomReply);
    } else {
      // Follow-up message — use API to respond
      const userInput = words.slice(1).join(" ");
      const botReply = await getBotResponse(userInput);
      await message.reply(botReply);
    }
  } catch (err) {
    console.error("❌ botx error:", err.message);
    await message.reply("Something went wrong 🤖");
  }
}

// Export the required structure
module.exports = {
  config,
  name: config.name,
  onStart
};
