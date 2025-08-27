const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "send4",
    version: "2.2",
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
      invalid_command: "❎ Invalid command. Example: !send2 coins @user 100",
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

  // helper: try to normalize any id-like input to a JID (e.g. 8801xxx => 8801xxx@c.us)
  normalizeID: function (raw) {
    if (!raw && raw !== 0) return null;
    // object -> possible fields
    if (typeof raw === "object") {
      if (raw.id) raw = raw.id;
      else if (raw._serialized) raw = raw._serialized;
      else if (raw.remoteJid) raw = raw.remoteJid;
      else if (raw.author) raw = raw.author;
    }
    raw = String(raw);
    raw = raw.trim();

    // remove <> @ if something like <@12345>
    raw = raw.replace(/[<@>]/g, "");

    // if contains space, take first token
    if (raw.includes(" ")) raw = raw.split(/\s+/)[0];

    // if already looks like jid, return
    if (/@/.test(raw)) return raw;

    // if starts with +, remove +
    if (raw.startsWith("+")) raw = raw.slice(1);

    // if consists of digits (or digits with non-digits), extract digits
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 5) {
      return digits + "@c.us";
    }

    // fallback: return original
    return raw;
  },

  onStart: async function ({ args, message, getLang }) {
    try {
      // --- Resolve sender ID robustly ---
      let senderID =
        message.author ||
        message.from ||
        message.sender ||
        (message.key && (message.key.participant || message.key.remoteJid)) ||
        (message._data && (message._data.notify || message._data.from)) ||
        null;
      senderID = this.normalizeID(senderID);

      // --- quick args validation ---
      if (!args[0] || args.length < 2) return message.reply(getLang("invalid_command"));

      let commandArg = String(args[0]).toLowerCase();
      if (commandArg === "-m") commandArg = "coins";
      if (commandArg !== "coins") return message.reply(getLang("invalid_command"));

      // parse amount (last arg)
      const rawAmount = args[args.length - 1];
      const amount = parseInt(String(rawAmount).replace(/[^0-9]/g, ""), 10);
      if (isNaN(amount) || amount <= 0) return message.reply(getLang("invalid_amount"));

      // --- Resolve mention IDs from various possible fields ---
      let mentionIds = [];
      if (Array.isArray(message.mentionedIds) && message.mentionedIds.length) {
        mentionIds = message.mentionedIds.map(id => this.normalizeID(id));
      } else if (Array.isArray(message.mentioned) && message.mentioned.length) {
        // sometimes mentions is array of objects
        mentionIds = message.mentioned.map(m => this.normalizeID(m.id || m));
      } else if (Array.isArray(message.mentions) && message.mentions.length) {
        // other libs
        mentionIds = message.mentions.map(m => this.normalizeID(m.id || m));
      }

      // --- Resolve quoted/reply user robustly ---
      let recipientID = null;
      // whatsapp-web.js style
      if (message.hasQuotedMsg && typeof message.getQuotedMessage === "function") {
        const quoted = await message.getQuotedMessage().catch(() => null);
        if (quoted) {
          recipientID = this.normalizeID(quoted.author || quoted.from || quoted.sender || quoted.participant || (quoted.key && quoted.key.participant));
        }
      }
      // other possible shapes
      if (!recipientID && message.messageReply) {
        // earlier shape: message.messageReply.author
        recipientID = this.normalizeID(message.messageReply.author || message.messageReply.sender || message.messageReply.participant || message.messageReply.from);
      }
      if (!recipientID && message.quotedMsg) {
        recipientID = this.normalizeID(message.quotedMsg.author || message.quotedMsg.from || message.quotedMsg.sender || message.quotedMsg.participant);
      }
      if (!recipientID && message.quotedMessage) {
        recipientID = this.normalizeID(message.quotedMessage.author || message.quotedMessage.from || message.quotedMessage.sender || message.quotedMessage.participant);
      }

      // if still no recipient, use mention
      if (!recipientID && mentionIds.length > 0) recipientID = mentionIds[0];

      // final fallback: args[1]
      if (!recipientID && args[1]) recipientID = this.normalizeID(args[1]);

      // if recipient still falsy -> error
      if (!recipientID) return message.reply(getLang("no_user"));

      // normalize both sides again
      senderID = this.normalizeID(senderID);
      recipientID = this.normalizeID(recipientID);

      if (!senderID) {
        console.error("Could not resolve senderID from message object:", message);
        return message.reply(getLang("transfer_fail"));
      }

      if (senderID === recipientID) return message.reply(getLang("self_transfer"));

      // --- Fetch DB records ---
      let senderData = await getUserData(senderID);
      let recipientData = await getUserData(recipientID);

      // If DB helper returns null/undefined, initialize locally
      if (!senderData) senderData = { coins: 0 };
      if (!recipientData) recipientData = { coins: 0 };

      // Ensure numeric
      if (typeof senderData.coins !== "number") senderData.coins = Number(senderData.coins) || 0;
      if (typeof recipientData.coins !== "number") recipientData.coins = Number(recipientData.coins) || 0;

      // --- Balance check ---
      const senderBalance = senderData.coins;
      if (amount > senderBalance) {
        // Debug log
        console.log(`Send2: insufficient funds — senderID=${senderID} balance=${senderBalance} amount=${amount}`);
        return message.reply(getLang("not_enough_coins"));
      }

      // --- Perform updates ---
      // Update sender
      const newSenderBalance = senderBalance - amount;
      await updateUserData(senderID, { coins: newSenderBalance });

      // Update recipient (if record existed add, otherwise create with amount)
      const newRecipientBalance = (recipientData.coins || 0) + amount;
      await updateUserData(recipientID, { coins: newRecipientBalance });

      // Optional: re-fetch to verify (helps debug)
      const verifySender = await getUserData(senderID).catch(() => null);
      const verifyRecipient = await getUserData(recipientID).catch(() => null);
      console.log("send2 - verify:", { senderID, before: senderBalance, after: verifySender?.coins, recipientID, beforeR: recipientData.coins, afterR: verifyRecipient?.coins });

      // Reply success
      const formattedAmount = this.formatCoins(amount);
      const recipientName = (recipientData.name || recipientID.split("@")[0]);

      log(`User ${senderID} sent ${amount} coins to ${recipientID}`);
      return message.reply(
        getLang("transfer_success")
          .replace("{amount}", formattedAmount)
          .replace("{recipient}", recipientName)
      );
    } catch (err) {
      console.error("send2 - unexpected error:", err);
      return message.reply(getLang("transfer_fail"));
    }
  },
};
