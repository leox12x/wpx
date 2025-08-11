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
      "teach [trigger] - [response1], [response2]..."
  },
};

module.exports.onStart = async function ({ message, args, usersData }) {
  try {
    const userMessage = args.join(" ").toLowerCase();
    const uid = message.author;

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

    const apiUrl = await baseApiUrl();

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

      const userName = (await usersData.getName(uid)) || "Unknown User";

      return message.reply(
        `✅ Replies added: "${responses}" to "${trigger}"\n• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n• 𝐓𝐨𝐭𝐚𝐥: ${response.data.count || 0}`
      );
    }
  } catch (err) {
    console.error(err);
    return message.reply("❌ An error occurred.");
  }
};
