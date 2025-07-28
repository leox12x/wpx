const axios = require("axios");
const mongoose = require("mongoose");

// MongoDB connect
const dbUri = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/GoatBotV2?retryWrites=true&w=majority&appName=Cluster0";
if (!mongoose.connection.readyState) {
  mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log("✅ Quiz DB connected"));
}

// Quiz stats schema
const quizStatsSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  correctAnswers: { type: Number, default: 0 },
  incorrectAnswers: { type: Number, default: 0 }
});
const QuizGameStats = mongoose.models.QuizGameStats || mongoose.model("QuizGameStats", quizStatsSchema);

// Get base API
const getBaseApi = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "2.1",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} [en|bn]\n{pn} list [page]\n{pn} rank"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, senderID } = event;

    // 📊 My Rank
    if (args[0] === "rank") {
      const all = await QuizGameStats.find({ correctAnswers: { $gt: 0 } }).sort({ correctAnswers: -1 });
      const rank = all.findIndex(e => e.userID === senderID) + 1;
      if (rank === 0) return api.sendMessage("📉 You haven't played any quiz yet!", threadID, messageID);
      const score = all[rank - 1].correctAnswers;
      return api.sendMessage(`🏅 Your Rank: #${rank}\n✅ Correct: ${score}`, threadID, messageID);
    }

    // 🏆 Leaderboard
    if (args[0] === "list") {
      const page = parseInt(args[1]) || 1;
      const perPage = 10;
      const skip = (page - 1) * perPage;
      const total = await QuizGameStats.countDocuments({ correctAnswers: { $gt: 0 } });
      const stats = await QuizGameStats.find({ correctAnswers: { $gt: 0 } })
        .sort({ correctAnswers: -1 }).skip(skip).limit(perPage);

      if (!stats.length) return api.sendMessage("❌ No quiz stats yet!", threadID, messageID);

      let msg = `🏆 Quiz Leaderboard (Page ${page}/${Math.ceil(total / perPage)}):\n\n`;
      for (let i = 0; i < stats.length; i++) {
        const name = await usersData.getName(stats[i].userID) || "Unknown";
        msg += `${skip + i + 1}. ${name}: ✅ ${stats[i].correctAnswers}\n`;
      }
      msg += `\n📥 Type "${this.config.name} list ${page + 1}" to see more.`;
      return api.sendMessage(msg, threadID, messageID);
    }

    // 🎯 Start Quiz
    const input = args.join("").toLowerCase() || "bn";
    const category = input.includes("en") ? "english" : "bangla";

    const apiUrl = await getBaseApi();
    const res = await axios.get(`${apiUrl}/api/quiz?category=${category}`);
    const quiz = res.data;

    if (!quiz?.question) return api.sendMessage("❌ No quiz found!", threadID, messageID);

    const limit = 15;
    const timeWindow = 10 * 60 * 60 * 1000;
    const now = Date.now();
    const userData = await usersData.get(senderID);

    if (!userData.data.quizs) userData.data.quizs = { count: 0, firstQuiz: now };
    const passed = now - userData.data.quizs.firstQuiz;
    if (passed >= timeWindow) userData.data.quizs = { count: 0, firstQuiz: now };

    if (userData.data.quizs.count >= limit) {
      const left = timeWindow - passed;
      const hrs = Math.floor(left / 3600000);
      const mins = Math.floor((left % 3600000) / 60000);
      return api.sendMessage(`⏳ Daily limit reached!\nTry again in ${hrs}h ${mins}m.`, threadID, messageID);
    }

    userData.data.quizs.count++;
    await usersData.set(senderID, userData);

    const { question, correctAnswer, options } = quiz;
    const { a, b, c, d } = options;

    const body = `🎯 *${question}*\n\n𝗔) ${a}\n𝗕) ${b}\n𝗖) ${c}\n𝗗) ${d}\n\n📝 Reply A/B/C/D`;

    api.sendMessage(body, threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "quiz",
        author: senderID,
        messageID: info.messageID,
        correctAnswer: correctAnswer.toLowerCase()
      });

      setTimeout(() => api.unsendMessage(info.messageID), 40000);
    }, messageID);
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { author, correctAnswer, messageID } = Reply;
    const { senderID, threadID, body } = event;

    if (senderID !== author)
      return api.sendMessage("⛔ This quiz isn't for you!", threadID, event.messageID);

    await api.unsendMessage(messageID);
    const answer = body.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();

    const userData = await usersData.get(senderID);
    userData.coins = userData.coins || 0;
    userData.exp = userData.exp || 0;

    if (answer === correct) {
      userData.coins += 1000;
      userData.exp += 121;
      await usersData.set(senderID, userData);

      await QuizGameStats.findOneAndUpdate(
        { userID: senderID },
        { $inc: { correctAnswers: 1 } },
        { upsert: true }
      );

      return api.sendMessage(`✅ Correct!\n+1000 coins\n+121 exp`, threadID, event.messageID);
    } else {
      userData.coins = Math.max(0, userData.coins - 300);
      userData.exp = Math.max(0, userData.exp - 121);
      await usersData.set(senderID, userData);

      await QuizGameStats.findOneAndUpdate(
        { userID: senderID },
        { $inc: { incorrectAnswers: 1 } },
        { upsert: true }
      );

      return api.sendMessage(`❌ Wrong!\n✔️ Correct: ${correct.toUpperCase()}\n-300 coins\n-121 exp`, threadID, event.messageID);
    }
  }
};
