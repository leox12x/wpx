const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    version: "1.0",
    author: "xemon (Modified by Mahmud)",
    role: 0,
    countDown: 10,
    category: "love",
    description: "Pair two users with a love match image",
  },

  onStart: async function ({ message, event, client }) {
    try {
      const threadID = event.from;
      const senderID = event.sender?.id || event.author || event.from;

      const cachePath = path.join(__dirname, "cache");
      await fs.ensureDir(cachePath);

      let pathImg = path.join(cachePath, "background.png");
      let pathAvt1 = path.join(cachePath, "Avtmot.png");
      let pathAvt2 = path.join(cachePath, "Avthai.png");

      const threadInfo = await client.groupMetadata(threadID);
      const participants = threadInfo?.participants || [];

      const sender = participants.find(p => p.id.includes(senderID)) || {};
      const gender1 = sender?.gender || null;

      const botID = await client.info?.wid?.user || "self";

      let candidates = [];

      if (gender1 === "female" || gender1 === "FEMALE") {
        candidates = participants.filter(u => !u.id.includes(senderID) && !u.id.includes(botID) && u?.gender?.toLowerCase() === "male");
      } else if (gender1 === "male" || gender1 === "MALE") {
        candidates = participants.filter(u => !u.id.includes(senderID) && !u.id.includes(botID) && u?.gender?.toLowerCase() === "female");
      } else {
        candidates = participants.filter(u => !u.id.includes(senderID) && !u.id.includes(botID));
      }

      if (candidates.length === 0) {
        return message.reply("❌ No suitable candidates found for pairing.");
      }

      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = candidate.id;
      const name1 = sender?.name || "User1";
      const name2 = candidate?.name || "User2";

      const randomPercent = Math.floor(Math.random() * 100) + 1;
      const weirdValues = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
      const percentagePool = [randomPercent, ...Array(4).fill(randomPercent), weirdValues[Math.floor(Math.random() * weirdValues.length)], ...Array(4).fill(randomPercent)];
      const tile = percentagePool[Math.floor(Math.random() * percentagePool.length)];

      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png",
      ];
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const downloadImage = async (url, destPath) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(destPath, Buffer.from(res.data));
      };

      await downloadImage(`https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=${token}`, pathAvt1);
      await downloadImage(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=${token}`, pathAvt2);
      await downloadImage(bgUrl, pathImg);

      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);
      const baseAvt2 = await loadImage(pathAvt2);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAvt1, 100, 150, 300, 300);
      ctx.drawImage(baseAvt2, 900, 150, 300, 300);

      const imageBuffer = canvas.toBuffer();
      const finalImagePath = path.join(cachePath, `pair_result_${Date.now()}.png`);
      await fs.writeFile(finalImagePath, imageBuffer);

      await fs.remove(pathAvt1);
      await fs.remove(pathAvt2);
      await fs.remove(pathImg);

      await message.reply({
        image: fs.createReadStream(finalImagePath),
        caption: `🥰 Successful pairing:\n• ${name1} 🎀\n• ${name2} 🎀\n\n💌 Wish you two a hundred years of happiness 💕\nLove percentage: ${tile}% 💙`
      });

      await fs.unlink(finalImagePath).catch(() => {});
    } catch (err) {
      console.error("❌ Error in pair command:", err);
      return message.reply("❌ Something went wrong while pairing.");
    }
  }
};
