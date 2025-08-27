const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "send2",
    version: "1.8",
    author: "MahMUD",
    role: 0,
    shortDescription: {
      en: "Send coins to another user",
    },
    longDescription: {
      en: "Send coins to another user using UID, mention, or by replying. The amount is at the end.",
    },
    category: "economy",
  },
  langs: {
    en: {
      invalid_amount: "❎ Please specify a valid amount of coins to send.",
      not_enough_coins: "❎ You don't have enough coins to send.",
      invalid_user: "❎ The specified user is invalid or not found.",
      transfer_success: "✅ | Successfully sent {amount} coins to {recipient}.",
      transfer_fail: "❌ | Failed to send coins. Please check the user and try again.",
      self_transfer: "❎ You cannot send coins to yourself.",
      invalid_command: "❎ Invalid command. Example: !send @user 100",
      no_user: "❎ Please provide a user by replying, mentioning, or entering their UID."
    },
  },

  formatCoins: function (num) {
    const units = ["", "K", "M", "B", "T"];
    let unit = 0;
    while (num >= 1000 && unit < units.length - 1) {
      num /= 1000;
      unit++;
    }
    return Number(num.toFixed(1)) + units[unit];
  },

  onStart: async function ({ args, message, getLang }) {
    const senderID = message.author; // Correct sender
    const mentions = message.mentionedIds || [];
    const messageReply = message.replyMessage;

    let recipientID, amount;

    if (!args[0] || args.length < 2) {
      return message.reply(getLang("invalid_command"));
    }

    // Handle alias -m
    let commandArg = args[0].toLowerCase();
    if (commandArg === "-m") commandArg = "coins";

    if (commandArg !== "coins") {
      return message.reply(getLang("invalid_command"));
    }

    // Amount is always last argument
    amount = parseInt(args[args.length - 1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply(getLang("invalid_amount"));
    }

    // Determine recipient
    if (messageReply && messageReply.author) {
      recipientID = messageReply.author;
    } else if (mentions.length > 0) {
      recipientID = mentions[0];
    } else {
      recipientID = args[1]; // UID entered manually
    }

    if (!recipientID) {
      return message.reply(getLang("no_user"));
    }

    if (recipientID === senderID) {
      return message.reply(getLang("self_transfer"));
    }

    try {
      // Fetch user data
      const recipientData = await getUserData(recipientID);
      const senderData = await getUserData(senderID);

      if (!recipientData) return message.reply(getLang("invalid_user"));

      const senderBalance = senderData.coins || 0;
      if (amount > senderBalance) {
        return message.reply(getLang("not_enough_coins"));
      }

      // Update balances
      await updateUserData(senderID, { coins: senderBalance - amount });
      await updateUserData(recipientID, { coins: (recipientData.coins || 0) + amount });

      const formattedAmount = this.formatCoins(amount);
      const recipientName = recipientData.name || "Unknown";

      // Optional: log the transaction
      log(`User ${senderID} sent ${amount} coins to ${recipientID}`);

      return message.reply(
        getLang("transfer_success")
          .replace("{amount}", formattedAmount)
          .replace("{recipient}", recipientName)
      );
    } catch (err) {
      console.error(err);
      return message.reply(getLang("transfer_fail"));
    }
  },
};
