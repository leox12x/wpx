const axios = require("axios");
const { MessageMedia } = require("whatsapp-web.js");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
  return base.data.api;
};

module.exports = {
  config: {
    name: "sing2",
    version: "1.7",
    author: "MahMUD",
    coolDown: 10,
    role: 0,
    category: "music",
    description: "Download and send a song (via YouTube search or link)",
    guide: {
      en: "Use {prefix}sing2 [song name or YouTube link]"
    }
  },

  onStart: async function ({ message, args, client }) {
    if (args.length === 0) {
      return message.reply("❌ | Please provide a song name or YouTube link\n\nExample: sing2 mood lofi");
    }

    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    let videoID, title;

    try {
      if (checkurl.test(args[0])) {
        const match = args[0].match(checkurl);
        videoID = match ? match[1] : null;
      } else {
        const query = args.join(" ");
        await message.reply(`🎵 Searching for "${query}"... Please wait...`);

        const res = await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${encodeURIComponent(query)}`);
        const firstResult = res.data[0];
        if (!firstResult) return message.reply("❌ No results found for your query.");

        videoID = firstResult.id;
        title = firstResult.title;
      }

      const {
        data: { title: videoTitle, downloadLink }
      } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`);

      // Download audio as buffer
      const audioBuffer = (await axios.get(downloadLink, { responseType: "arraybuffer" })).data;

      // Send as WhatsApp audio
      const media = new MessageMedia("audio/mpeg", Buffer.from(audioBuffer).toString("base64"), `${title || videoTitle}.mp3`);
      await client.sendMessage(message.from, media, {
        caption: `✅ Here's your song 🎵\n\n🐤 Enjoy: ${videoTitle || title}`
      });

    } catch (error) {
      console.error("Error:", error.message);
      message.reply("❌ An error occurred while processing your request. Please try again.");
    }
  }
};
