const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    author: "xemon",
    role: 0,
    countDown: 10,
    category: "love",
    guide: "{pn}",
  },

  onStart: async function ({ api, event }) {
    try {
      const threadID = event.from;
      const senderID = event.sender?.id || event.author || event.from;

      let pathImg = path.join(__dirname, "cache", "background.png");
      let pathAvt1 = path.join(__dirname, "cache", "Avtmot.png");
      let pathAvt2 = path.join(__dirname, "cache", "Avthai.png");

      // Get thread info (userInfo array)
      let threadInfo = await api.getChatById(threadID);
      let all = threadInfo?.participants || [];

      // Get sender info
      let senderInfo = all.find((user) => user.id.user === senderID) || {};
      let name1 = senderInfo?.contact?.name || "User1";
      let gender1 = senderInfo?.contact?.gender || null;

      // Bot id
      const botID = (await api.getHostNumber()).replace("@c.us", "");

      // Filter users for pairing
      let candidates = [];

      if (gender1 === "female" || gender1 === "FEMALE") {
        candidates = all.filter(u => u.id.user !== senderID && u.id.user !== botID && (u.contact?.gender === "male" || u.contact?.gender === "MALE"));
      } else if (gender1 === "male" || gender1 === "MALE") {
        candidates = all.filter(u => u.id.user !== senderID && u.id.user !== botID && (u.contact?.gender === "female" || u.contact?.gender === "FEMALE"));
      } else {
        candidates = all.filter(u => u.id.user !== senderID && u.id.user !== botID);
      }

      if (candidates.length === 0) return api.sendMessage("❌ No suitable candidates found for pairing.", threadID);

      // Pick random candidate
      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = candidate.id.user;
      const name2 = candidate.contact?.name || "User2";

      // Love percentage logic
      const randomPercent = Math.floor(Math.random() * 100) + 1;
      const weirdValues = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
      const percentagePool = [randomPercent, randomPercent, randomPercent, randomPercent, randomPercent, weirdValues[Math.floor(Math.random() * weirdValues.length)], randomPercent, randomPercent, randomPercent, randomPercent];
      const tile = percentagePool[Math.floor(Math.random() * percentagePool.length)];

      // Random background
      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png",
      ];
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      // Download avatars and background
      const downloadImage = async (url, destPath) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(destPath, Buffer.from(res.data));
      };

      // Facebook avatar URLs with your access token
      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

      await downloadImage(`https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=${token}`, pathAvt1);
      await downloadImage(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=${token}`, pathAvt2);
      await downloadImage(bgUrl, pathImg);

      // Load images
      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);
      const baseAvt2 = await loadImage(pathAvt2);

      // Create canvas and draw
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAvt1, 100, 150, 300, 300);
      ctx.drawImage(baseAvt2, 900, 150, 300, 300);

      // Save canvas image
      const imageBuffer = canvas.toBuffer();
      await fs.writeFile(pathImg, imageBuffer);

      // Cleanup avatar images
      await fs.remove(pathAvt1);
      await fs.remove(pathAvt2);

      // Convert names to bold unicode
      function toBoldUnicode(name) {
        const boldAlphabet = {
          "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣",
          "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭",
          "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳", "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃",
          "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉", "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍",
          "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓", "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗",
          "Y": "𝐘", "Z": "𝐙", "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8",
          "9": "9", " ": " ", "'": "'", ",": ",", ".": ".", "-": "-", "!": "!", "?": "?"
        };
        return name.split("").map(c => boldAlphabet[c] || c).join("");
      }

      const styledName1 = toBoldUnicode(name1);
      const styledName2 = toBoldUnicode(name2);

      // Send the message with image attachment
      return api.sendMessage(
        {
          body: `🥰 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥 𝐩𝐚𝐢𝐫𝐢𝐧𝐠\n• ${styledName1} 🎀\n• ${styledName2} 🎀\n💌 𝐖𝐢𝐬𝐡 𝐲𝐨𝐮 𝐭𝐰𝐨 𝐡𝐮𝐧𝐝𝐫𝐞𝐝 𝐲𝐞𝐚𝐫𝐬 𝐨𝐟 𝐡𝐚𝐩𝐩𝐢𝐧𝐞𝐬𝐬 💕\n\n𝐋𝐨𝐯𝐞 𝐩𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: ${tile}% 💙`,
          attachment: fs.createReadStream(pathImg),
        },
        threadID,
        async (err) => {
          if (err) console.error(err);
          try {
            await fs.unlink(pathImg);
          } catch (e) {
            console.error("Error deleting image file:", e);
          }
        },
        event.id
      );
    } catch (error) {
      console.error("Error in pair command:", error);
      return api.sendMessage("❌ Something went wrong.", event.from);
    }
  },
};
