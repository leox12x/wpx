const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = { 
  config: { 
    name: "album", 
    version: "2.0", 
    role: 0, 
    author: "MahMUD", 
    category: "media", 
    guide: { 
      en: "{p}{n} [page number] (e.g., {p}{n} 2 for next page)\n{p}{n} list - View total videos in each category",
    }, 
  },

  onStart: async function ({ api, event, args }) { 
    const apiUrl = await baseApiUrl();

    // List all categories
    if (args[0] === "list") {
      try {
        const response = await axios.get(`${apiUrl}/api/album/list`);
        return api.sendMessage(response.data.message, event.threadID, event.messageID);
      } catch (error) {
        return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
      }
    }

    // Displayed categories
    const displayNames = [
      "𝐅𝐮𝐧𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐈𝐬𝐥𝐚𝐦𝐢𝐜 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐒𝐚𝐝 𝐕𝐢𝐝𝐞𝐨 🎀",
      "𝐀𝐧𝐢𝐦𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐨𝐅𝐈 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞 𝐕𝐢𝐝𝐞𝐨 🎀",
      "𝐇𝐨𝐫𝐧𝐲 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐂𝐨𝐮𝐩𝐥𝐞 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐅𝐥𝐨𝐰𝐞𝐫 𝐕𝐢𝐝𝐞𝐨🎀",
      "𝐁𝐢𝐤𝐞 & 𝐂𝐚𝐫 𝐕𝐢𝐝𝐞𝐨 🎀", "𝐋𝐨𝐯𝐞 𝐕𝐢𝐝𝐞𝐨 🎀"
    ];

    const itemsPerPage = 10;
    const page = parseInt(args[0]) || 1;
    const totalPages = Math.ceil(displayNames.length / itemsPerPage);

    if (page < 1 || page > totalPages) {
      return api.sendMessage(`❌ Invalid page! Please choose between 1 - ${totalPages}.`, event.threadID, event.messageID);
    }

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayedCategories = displayNames.slice(startIndex, endIndex);

    const message = `𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐀𝐥𝐛𝐮𝐦 𝐕𝐢𝐝𝐞𝐨\n𐙚━━━━━━━━━━━━━━━━━━━━━ᡣ𐭩\n` +
      displayedCategories.map((opt, idx) => `${startIndex + idx + 1}. ${opt}`).join("\n") +
      `\n𐙚━━━━━━━━━━━━━━━━━━━━━ᡣ𐭩\nReply with the number to get a video.\nPage [${page}/${totalPages}]\nType !album ${page+1} for next page.`;

    await api.sendMessage(message, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          startIndex,
          realCategories: ["funny","islamic","sad","anime","lofi","attitude","horny","couple","flower","bikecar","love"],
          captions: [
            "Here is your Funny Video 😺","Here is your Islamic Video ✨","Here is your Sad Video 😢",
            "Here is your Anime Video 🌟","Here is your LoFi Video 🎶","Here is your Attitude Video ☠",
            "Here is your Horny Video 🥵","Here is your Couple Video 💑","Here is your Flower Video 🌸",
            "Here is your Bike & Car Video 😘","Here is your Love Video ❤"
          ]
        });
      }
    }, event.messageID);
  },

  onReply: async function ({ api, event, Reply }) {
    api.unsendMessage(Reply.messageID);

    const replyNum = parseInt(event.body);
    const index = replyNum - 1;

    if (isNaN(replyNum) || index < 0 || index >= Reply.realCategories.length) {
      return api.sendMessage("❌ Please reply with a valid number from the list.", event.threadID, event.messageID);
    }

    const category = Reply.realCategories[index];
    const caption = Reply.captions[index];
    const userID = event.senderID;

    try {
      const apiUrl = await baseApiUrl();
      const response = await axios.get(`${apiUrl}/api/album/videos/${category}?userID=${userID}`);

      if (!response.data.success || !response.data.videos.length) {
        return api.sendMessage("❌ No videos found for this category.", event.threadID, event.messageID);
      }

      const randomVideoUrl = response.data.videos[Math.floor(Math.random() * response.data.videos.length)];
      const filePath = path.join(__dirname, `temp_video_${Date.now()}.mp4`);

      const downloadFile = async (url, path) => {
        const res = await axios({ url, method: "GET", responseType: "stream", headers: { 'User-Agent': 'Mozilla/5.0' } });
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(path);
          res.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      };

      await downloadFile(randomVideoUrl, filePath);
      await api.sendMessage({ body: caption, attachment: fs.createReadStream(filePath) }, event.threadID, () => {
        fs.unlinkSync(filePath);
      }, event.messageID);

    } catch (error) {
      return api.sendMessage("❌ Failed to fetch or send the video. Try again later.", event.threadID, event.messageID);
    }
  }
};
