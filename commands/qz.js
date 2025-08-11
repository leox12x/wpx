const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "2.0",
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

      const quizText = `\n╭──✦ ${question}\n├‣ 𝗔) ${a}\n├‣ 𝗕) ${b}\n├‣ 𝗖) ${c}\n├‣ 𝗗) ${d}\n╰──────────────────‣\nReply to this message with your answer.`;

      // Send quiz
      const sentMsg = await message.reply(quizText);

      // Store for onReply
      global.GoatBot.onReply.set(sentMsg.key.id, {
        commandName: this.config.name,
        author: message.author,
        messageID: sentMsg.key.id,
        correctAnswer
      });

      // Auto delete after 40s
      setTimeout(() => {
        message.delete(sentMsg.key.id).catch(() => {});
      }, 40000);

    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to fetch quiz. Please try again later.");
    }
  },

  onReply: async function ({ message, Reply, usersData }) {
    const { correctAnswer, author, messageID } = Reply;

    if (message.author !== author) {
      return message.reply("❌ This is not your quiz baby 🐸");
    }

    await message.delete(messageID).catch(() => {});
    const userAnswer = message.body.trim().toLowerCase();

    if (userAnswer === correctAnswer.toLowerCase()) {
      const rewardCoins = 500;
      const rewardExp = 121;
      const userData = await usersData.get(author);

      await usersData.set(author, {
        money: userData.money + rewardCoins,
        exp: userData.exp + rewardExp,
        data: userData.data
      });

      message.reply(`✅ Correct answer!\nYou earned ${rewardCoins} coins & ${rewardExp} exp.`);
    } else {
      message.reply(`❌ Wrong answer!\nThe correct answer was: ${correctAnswer}`);
    }
  }
};
