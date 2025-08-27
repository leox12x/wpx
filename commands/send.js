const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "send",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    shortDescription: { en: "Send coins to another user" },
    longDescription: { en: "Send coins to another user using UID, mention, or by replying. The amount is at the end." },
    category: "economy",
  },
  langs: {
    en: {
      invalid_amount: "❎ Please specify a valid amount of money to send.",
      not_enough_coins: "❎ You don't have enough money to send.",
      invalid_user: "❎ The specified user is invalid or not found.",
      transfer_success: "✅ | Successfully sent {amount} coins to {recipient}.",
      transfer_fail: "❌ | Failed to send money. Please check the user and try again.",
      self_transfer: "❎ You cannot send coins to yourself.",
      invalid_command: "❎ Invalid command. Example: !send money @mention 100",
      no_user: "❎ Please provide a user by mentioning, or entering their UID."
    },
  },

  formatCoins(num) {
    const units = ["", "K", "M", "B", "T"];
    let unit = 0;
    while (num >= 1000 && unit < units.length - 1) {
      num /= 1000;
      unit++;
    }
    return Number(num.toFixed(1)) + units[unit];
  },

  onStart: async function ({ args, message, getLang }) {
    const senderID = message.author;
    const mentionIds = message.mentionedIds || [];
    let recipientID, amount;

    if (!args[0] || args.length < 2) return message.reply(getLang("invalid_command"));

    let commandArg = args[0].toLowerCase();
    if (commandArg === "-m") commandArg = "money";
    if (commandArg !== "money") return message.reply(getLang("invalid_command"));

    amount = parseInt(args[args.length - 1]);
    if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalid_amount"));

    // ------------------ Determine Recipient ------------------
    if (message.messageReply) {
      // Reply (group or private)
      recipientID = message.messageReply.key?.participant || message.messageReply.key?.remoteJid;
    } else if (mentionIds.length > 0) {
      // Mention
      recipientID = mentionIds[0];
    } else if (args[1]?.includes("@")) {
      // Explicit UID
      recipientID = args[1];
    } else {
      return message.reply(getLang("no_user"));
    }

    if (!recipientID) return message.reply(getLang("no_user"));
    if (recipientID === senderID) return message.reply(getLang("self_transfer"));

    try {
      const [senderData, recipientData] = await Promise.all([
        getUserData(senderID),
        getUserData(recipientID)
      ]);

      if (!recipientData) return message.reply(getLang("invalid_user"));

      const senderBalance = senderData.coins || 0;
      if (amount > senderBalance) return message.reply(getLang("not_enough_coins"));

      // ------------------ Update Coins ------------------
      await updateUserData(senderID, { coins: senderBalance - amount });
      await updateUserData(recipientID, { coins: (recipientData.coins || 0) + amount });

      const formattedAmount = this.formatCoins(amount);
      const recipientName = recipientData.name || recipientID.split("@")[0];

      log(`User ${senderID} sent ${amount} coins to ${recipientID}`, 'success');

      return message.reply(
        getLang("transfer_success")
          .replace("{amount}", formattedAmount)
          .replace("{recipient}", recipientName)
      );
    } catch (err) {
      log(`Send command error: ${err.message}`, 'error');
      return message.reply(getLang("transfer_fail"));
    }
  },
};
