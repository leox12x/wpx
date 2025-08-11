const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json"
  );
  return base.data.mahmud + "/api/jan";
};

module.exports.config = {
  name: "jan",
  aliases: ["jann", "জান", "janu", "baby", "bby", "hinata"],
  version: "1.7",
  author: "MahMUD",
  countDown: 0,
  role: 0,
  category: "ai",
  guide: {
    en:
      "{pn} [message] OR\n" +
      "teach [trigger] - [response1], [response2]...\n" +
      "list [all]"
  },
};

module.exports.onStart = async function ({ message, args, usersData }) {
  try {
    const fullJid = message.author || "";
    const uid = fullJid.split("@")[0];
    const userMessage = args.join(" ").toLowerCase();
    const apiUrl = await baseApiUrl();

    if (!args[0]) {
      const responses = [
        "𝐛𝐨𝐥𝐨 𝐣𝐚𝐧😎",
        "𝐛𝐨𝐥𝐨 𝐛𝐚𝐛𝐲🐥",
        "𝐡𝐞𝐥𝐥𝐨 𝐛𝐚𝐛𝐲🐤",
        "𝐇𝐮𝐦𝐦 𝐛𝐨𝐥𝐨😗",
      ];
      return message.reply(
        responses[Math.floor(Math.random() * responses.length)]
      );
    }

    // 📌 List functionality
    if (args[0] === "list") {
      const endpoint = args[1] === "all" ? "/list/all" : "/list";
      const response = await axios.get(`${apiUrl}${endpoint}`);

      if (args[1] === "all") {
        let msgText = "👑 List of Hinata teachers:\n\n";
        const data = Object.entries(response.data.data)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15);

        for (let i = 0; i < data.length; i++) {
          const [userID, count] = data[i];
          const userInfo = await usersData.get(userID);
          const name = (userInfo && userInfo.name) || "Unknown";
          msgText += `${i + 1}. ${name}: ${count}\n`;
        }
        return message.reply(msgText);
      }

      return message.reply(response.data.message);
    }

    // 📌 Teach functionality
    if (args[0] === "teach") {
      const teachContent = userMessage.replace("teach ", "");
      const [trigger, responses] = teachContent.split(" - ");

      if (!trigger || !responses) {
        return message.reply(
          "❌ | teach [trigger] - [response1, response2,...]"
        );
      }

      const response = await axios.post(`${apiUrl}/teachxx`, {
        trigger,
        responses,
        userID: uid,
      });

      const userInfo = await usersData.get(message.author);
      const userName = (userInfo && userInfo.name) ? userInfo.name : uid;

      return message.reply(
        `✅ Replies added: "${responses}" to "${trigger}"\n• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n• 𝐓𝐨𝐭𝐚𝐥: ${response.data.count || 0}`
      );
    }

  } catch (error) {
    const errorMsg = error.response?.data || error.message || "Unknown error";
    return message.reply(`${errorMsg}`);
  }
};
