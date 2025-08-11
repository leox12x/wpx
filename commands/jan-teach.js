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
    // Extract phone number from full jid
    const fullJid = message.author || "";
    const uid = fullJid.split("@")[0]; // number only

    const userMessage = args.join(" ").toLowerCase();

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

      // Try getting user info, fallback to uid
      const userInfo = await usersData.get(message.author);
      const userName = (userInfo && userInfo.name) ? userInfo.name : uid;

      return message.reply(
        `✅ Replies added: "${responses}" to "${trigger}"\n• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n• 𝐓𝐨𝐭𝐚𝐥: ${response.data.count || 0}`
      );
    }

    // You can add more commands or default replies here if needed

  } catch (err) {
    console.error("Error in jan command:", err);
    return message.reply("❌ An error occurred.");
  }
};
