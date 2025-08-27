module.exports = {
  config: {
    name: "uid",
    aliases: ["getuid", "id"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    shortDescription: {
      en: "Get your own UID or someone else's",
    },
    longDescription: {
      en: "Use this command to find the UID of yourself, a user, or a group.",
    },
    category: "utility",
  },

  langs: {
    en: {
      show_uid: "🔹 UID of %1: %2",
    },
  },

  onStart: async function ({ message, args, getLang }) {
    let targetID;

    // 1️⃣ Reply
    if (message.replyMessage && message.replyMessage.author) {
      targetID = message.replyMessage.author;
    }
    // 2️⃣ Mention
    else if (message.mentionedIds && message.mentionedIds.length > 0) {
      targetID = message.mentionedIds[0];
    }
    // 3️⃣ Manual UID
    else if (args[0]) {
      targetID = args[0];
    }
    // 4️⃣ Default to self
    else {
      targetID = message.author;
    }

    return message.reply(getLang("show_uid")
      .replace("%1", targetID.includes("@g.us") ? "Group" : "User")
      .replace("%2", targetID)
    );
  }
};
