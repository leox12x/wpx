const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "1.9",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} [bn/en]"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const input = args.join("").toLowerCase() || "bn";
      const category = input === "en" || input === "english" ? "english" : "bangla";

      const apiUrl = await mahmud();
      const res = await axios.get(`${apiUrl}/api/quiz?category=${category}`);
      const quiz = res.data;

      if (!quiz) return message.reply("❌ No quiz available for this category.");

      const { question, correctAnswer, options } = quiz;
      const { a, b, c, d } = options;

      const quizText = `\n╭──✦ ${question}\n├‣ 𝗔) ${a}\n├‣ 𝗕) ${b}\n├‣ 𝗖) ${c}\n├‣ 𝗗) ${d}\n╰──────────────────‣\n𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐲𝐨𝐮𝐫 𝐚𝐧𝐬𝐰𝐞𝐫.`;

      // Send quiz and store reply session
      const sent = await message.reply(quizText);

      global.GoatBot.onReply.set(sent.key.id, {
        type: "quiz-reply",
        commandName: this.config.name,
        author: message.author,
        messageID: sent.key.id,
        correctAnswer
      });

      // Auto delete quiz after 40 seconds
      setTimeout(() => {
        message.delete(sent.key.id).catch(() => {});
      }, 40000);

    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to fetch quiz. Please try again later.");
    }
  },

  onReply: async function ({ message, Reply, usersData }) {
    const { correctAnswer, author } = Reply;
    if (message.author !== author) {
      return message.reply("𝐓𝐡𝐢𝐬 𝐢𝐬 𝐧𝐨𝐭 𝐲𝐨𝐮𝐫 𝐪𝐮𝐢𝐳 𝐛𝐚𝐛𝐲 >🐸");
    }

    await message.delete(Reply.messageID).catch(() => {});
    const userReply = message.body.trim().toLowerCase();

    if (userReply === correctAnswer.toLowerCase()) {
      const rewardCoins = 500;
      const rewardExp = 121;
      const userData = await usersData.get(author);

      await usersData.set(author, {
        money: userData.money + rewardCoins,
        exp: userData.exp + rewardExp,
        data: userData.data
      });

      message.reply(`✅ | Correct answer baby\nYou earned ${rewardCoins} coins & ${rewardExp} exp.`);
    } else {
      message.reply(`❌ | Wrong answer baby\nThe correct answer was: ${correctAnswer}`);
    }
  }
};
