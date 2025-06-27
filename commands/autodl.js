const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { shortenURL } = require("../utils"); // Ensure utils.js is in root directory

const BASE_API_URL = "https://www.noobs-api.rf.gd/dipto";
const CACHE_DIR = path.join(__dirname, "cache");
const VIDEO_FILENAME = "autodl_video.mp4";

const VALID_URL_PREFIXES = [
  "https://vt.tiktok.com",
  "https://www.tiktok.com/",
  "https://www.facebook.com",
  "https://www.instagram.com/",
  "https://youtu.be/",
  "https://youtube.com/",
  "https://x.com/",
  "https://twitter.com/",
  "https://vm.tiktok.com",
  "https://fb.watch",
];

module.exports = {
  config: {
    name: "autodl",
    version: "1.0.2",
    author: "tas33n",
    countDown: 0,
    role: 0,
    description: {
      en: "Auto download and send video from TikTok, Facebook, Instagram, YouTube, etc.",
    },
    category: "media",
    guide: {
      en: "Just send a video link from a supported platform.",
    },
  },

  onStart: async () => {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  },

  onChat: async function ({ client, message }) {
    try {
      const input = message.body?.trim();
      if (!input) return;

      // Check if input starts with any valid video URL
      if (!VALID_URL_PREFIXES.some(prefix => input.startsWith(prefix))) return;

      console.log("📥 Input URL:", input);

      const apiURL = `${BASE_API_URL}/alldl?url=${encodeURIComponent(input)}`;
      console.log("📡 Fetching from API:", apiURL);

      const { data } = await axios.get(apiURL, { timeout: 15000 });
      console.log("📦 API response:", data);

      const videoUrl = data?.result;
      if (!videoUrl || typeof videoUrl !== "string" || !videoUrl.startsWith("http"))
        throw new Error("⚠️ API returned an invalid video URL.");

      console.log("🎥 Video URL:", videoUrl);

      // Download the video
      const videoPath = path.join(CACHE_DIR, VIDEO_FILENAME);
      const videoResponse = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 90000,
      });

      fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));
      console.log("💾 Video saved:", videoPath);

      // Check file size
      const stats = fs.statSync(videoPath);
      console.log("📏 File size:", stats.size);
      if (stats.size > 16 * 1024 * 1024) {
        fs.unlinkSync(videoPath);
        await message.reply("❌ Video is too large for WhatsApp (max 16MB).");
        return;
      }

      // Shorten the video URL
      const shortUrl = await shortenURL(videoUrl);
      const caption = `${data.cp || "Downloaded Video"}\n🐤 | Link: ${shortUrl || "Unavailable"}`;

      console.log("📤 Sending video...");

      await client.sendMessage(message.from, {
        video: fs.createReadStream(videoPath),
        caption,
      });

      fs.unlinkSync(videoPath);
      console.log("✅ Video sent and cache cleaned.");
    } catch (err) {
      console.error("❌ autodl.js error:", err.message);
      await message.reply(`❌ Error: ${err.message}`);
    }
  },
};
