module.exports = {
  config: {
    name: ""tid",
    aliases: ["groupid"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "group",
    shortDescription: {
      en: "Show the current group's TID",
    },
    longDescription: {
      en: "Use this command in a WhatsApp group to see the group's numeric TID.",
    },
    category: "utility",
  },

  langs: {
    en: {
      not_group: "❎ This command can only be used in a group.",
      show_tid: "🔹 Group TID: %1",
    },
  },

  onStart: async function ({ message, getLang }) {
    const chatID = message.chat; // Current chat ID

    // Check if it's a group
    if (!chatID.endsWith("@g.us")) {
      return message.reply(getLang("not_group"));
    }

    // Remove @g.us
    const tid = chatID.replace("@g.us", "");

    return message.reply(getLang("show_tid").replace("%1", tid));
  }
};
