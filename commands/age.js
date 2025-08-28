// =============== AGE COMMAND FOR WHATSAPP BOT ===============
// Author: MahMUD
// Description: Calculate age from DOB using API

const axios = require("axios");

// === Function: get base API url from your GitHub repo ===
const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "age",
    version: "1.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    description: "Check your age by date of birth",
    category: "utility",
    guide: {
      en: "{pn} <YYYY-MM-DD>\n\nExample:\n{pn} 2005-08-28"
    }
  },

  // WhatsApp bot main function
  onStart: async function ({ args, message }) {
    if (!args[0]) {
      return message.reply("⚠️ | Please provide your date of birth!\nFormat: YYYY-MM-DD");
    }

    const inputDate = args[0];

    try {
      const apiUrl = await mahmud();
      const res = await axios.get(`${apiUrl}/api/age/font3?dob=${inputDate}`);
      const data = res.data;

      if (data.error) {
        return message.reply("❌ | " + data.error);
      }

      return message.reply("🎂 | " + data.message);
    } catch (err) {
      console.error(err);
      return message.reply("🥹 | API down or invalid date, try again later!");
    }
  }
};
