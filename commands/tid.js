module.exports = {
  config: {
    name: "tid",
    aliases: ["groupid"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "utility",
    shortDescription: {
      en: "Show the current group's TID",
    },
    longDescription: {
      en: "Use this command in a WhatsApp group to see the group's numeric TID.",
    },
  },

  langs: {
    en: {
      not_group: "❎ This command can only be used in a group.",
      show_tid: "🔹 Group TID: %1",
    },
  },

  onStart: async function ({ message, getLang }) {
    const chatID = String(message.chat); // Convert to string to avoid endsWith error

    // Check if it's a group
    if (!chatID.endsWith("@g.us")) {
      return message.reply(getLang("not_group"));
    }

    // Extract TID by removing "@g.us"
    const tid = chatID.replace("@g.us", "");

    return message.reply(getLang("show_tid").replace("%1", tid));
  }
};
