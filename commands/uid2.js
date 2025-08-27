module.exports = {
  config: {
    name: "uid",
    aliases: ["getuid", "id"],
    version: "1.7",
    author: "MahMUD",
    role: 0,
    shortDescription: {
      en: "Get the UID of a user or group",
    },
    longDescription: {
      en: "Use this command to find the UID of a user (sender, mention, or reply) or a group.",
    },
    category: "utility",
  },

  langs: {
    en: {
      no_user: "❎ Please mention a user, reply, or enter a UID.",
      show_uid: "🔹 UID of %1: %2",
    },
  },

  onStart: async function ({ message, args, getLang }) {
    let targetID;

    // If replying to a message
    if (message.replyMessage && message.replyMessage.author) {
      targetID = message.replyMessage.author;
    }
    // If mentioning a user
    else if (message.mentionedIds && message.mentionedIds.length > 0) {
      targetID = message.mentionedIds[0];
    }
    // If manually provided UID
    else if (args[0]) {
      targetID = args[0];
    } else {
      return message.reply(getLang("no_user"));
    }

    // Display
    return message.reply(getLang("show_uid")
      .replace("%1", targetID.includes("@g.us") ? "Group" : "User")
      .replace("%2", targetID)
    );
  }
};
