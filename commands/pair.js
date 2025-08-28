const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    author: "MahMUD",
    role: 0,
    countDown: 10,
    category: "love",
    guide: "{pn}",
  },

  onStart: async function ({ api, event }) {
    const threadID = event.key.remoteJid;
    const senderID = event.key.participant || event.key.remoteJid;

    try {
      // Create cache folder if not exists
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const pathImg = path.join(cacheDir, "pair_bg.png");
      const pathAvt1 = path.join(cacheDir, "Avt1.png");
      const pathAvt2 = path.join(cacheDir, "Avt2.png");

      // Get all participants
      const threadInfo = await api.getGroupInfo(threadID);
      const all = threadInfo?.participants || [];

      const senderInfo = all.find(u => u.id === senderID) || {};
      const name1 = senderInfo?.name || "User1";
      const gender1 = senderInfo?.gender || null;

      const botID = api.getHostNumber(); // WP bot number

      // Filter candidates
      let candidates = [];
      if (gender1?.toLowerCase() === "female") {
        candidates = all.filter(u => u.id !== senderID && u.id !== botID && u.gender?.toLowerCase() === "male");
      } else if (gender1?.toLowerCase() === "male") {
        candidates = all.filter(u => u.id !== senderID && u.id !== botID && u.gender?.toLowerCase() === "female");
      } else {
        candidates = all.filter(u => u.id !== senderID && u.id !== botID);
      }

      if (!candidates.length) return api.sendMessage("❌ No suitable candidates found.", threadID);

      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = candidate.id;
      const name2 = candidate.name || "User2";

      // Love percentage
      const randPercent = Math.floor(Math.random() * 100) + 1;
      const weirdValues = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
      const percentagePool = [...Array(9).fill(randPercent), weirdValues[Math.floor(Math.random() * weirdValues.length)]];
      const lovePercent = percentagePool[Math.floor(Math.random() * percentagePool.length)];

      // Backgrounds
      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png",
      ];
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      // Download helper
      const downloadImage = async (url, destPath) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(destPath, Buffer.from(res.data));
      };

      // Get profile pictures via WP API
      const getProfilePic = async (id, dest) => {
        try {
          const url = await api.getProfilePicUrl(id);
          if (url) await downloadImage(url, dest);
          else fs.copyFileSync(path.join(__dirname, "default_avatar.png"), dest);
        } catch {
          fs.copyFileSync(path.join(__dirname, "default_avatar.png"), dest);
        }
      };

      await downloadImage(bgUrl, pathImg);
      await getProfilePic(senderID, pathAvt1);
      await getProfilePic(id2, pathAvt2);

      // Canvas
      const baseImage = await loadImage(pathImg);
      const avatar1 = await loadImage(pathAvt1);
      const avatar2 = await loadImage(pathAvt2);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(avatar1, 100, 150, 300, 300);
      ctx.drawImage(avatar2, 900, 150, 300, 300);

      const buffer = canvas.toBuffer();
      await fs.writeFile(pathImg, buffer);

      // Send message
      await api.sendMessage({
        body: `🥰 Successful pairing:\n• ${name1} 💞\n• ${name2} 💞\n💌 Love Percentage: ${lovePercent}% 💙`,
        attachment: fs.createReadStream(pathImg),
      }, threadID);

      // Clean cache
      await fs.remove(pathImg);
      await fs.remove(pathAvt1);
      await fs.remove(pathAvt2);

    } catch (error) {
      console.error("❌ Pair command error:", error);
      return api.sendMessage("❌ Something went wrong while pairing.", threadID);
    }
  },
};
