const { MongoClient } = require("mongodb");
const { getUserData, updateUserData } = require("../scripts/helpers");

const mongoUri = "mongodb://127.0.0.1:27017"; // change if needed

module.exports = {
  config: {
    name: "bank",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "economy",
    shortDescription: {
      en: "Deposit, withdraw, transfer, interest system"
    },
    longDescription: {
      en: "Bank system: deposit, withdraw, transfer coins, earn daily interest, loan system, top ranking."
    },
    guide: {
      en: "{pn} deposit <amount>\n{pn} withdraw <amount>\n{pn} balance\n{pn} transfer <uid> <amount>\n{pn} interest\n{pn} top"
    }
  },

  onStart: async function ({ args, message, event }) {
    const senderID = event.senderID;
    const userMoney = (await getUserData(senderID)).coins || 0;

    if (!args[0]) {
      return message.reply(
        "💳 Bank Commands:\n" +
        "- deposit <amount>\n" +
        "- withdraw <amount>\n" +
        "- balance\n" +
        "- transfer <uid> <amount>\n" +
        "- interest\n" +
        "- top"
      );
    }

    const action = args[0].toLowerCase();
    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db("WhatsappbotV2");
    const bankCollection = db.collection("bankData");

    let bankData = await bankCollection.findOne({ userId: senderID });
    if (!bankData) {
      bankData = { userId: senderID, bank: 0, lastInterest: Date.now() };
      await bankCollection.insertOne(bankData);
    }

    let bankBalance = bankData.bank || 0;

    // ---------------- COMMAND HANDLERS ----------------
    switch (action) {
      case "deposit": {
        const amount = parseInt(args[1]);
        if (!amount || amount <= 0) return message.reply("❎ Enter a valid deposit amount.");
        if (userMoney < amount) return message.reply("❎ You don't have enough coins.");
        await updateUserData(senderID, { coins: userMoney - amount });
        await bankCollection.updateOne({ userId: senderID }, { $inc: { bank: amount } });
        return message.reply(`✅ Deposited ${amount} coins into bank.`);
      }

      case "withdraw": {
        const amount = parseInt(args[1]);
        if (!amount || amount <= 0) return message.reply("❎ Enter a valid withdraw amount.");
        if (bankBalance < amount) return message.reply("❎ Not enough balance in bank.");
        await updateUserData(senderID, { coins: userMoney + amount });
        await bankCollection.updateOne({ userId: senderID }, { $inc: { bank: -amount } });
        return message.reply(`✅ Withdrew ${amount} coins from bank.`);
      }

      case "balance": {
        return message.reply(
          `💳 Bank Balance: ${bankBalance}\n` +
          `💰 Wallet Balance: ${userMoney}`
        );
      }

      case "transfer": {
        const receiver = args[1];
        const amount = parseInt(args[2]);
        if (!receiver || !amount) return message.reply("❎ Usage: bank transfer <uid> <amount>");
        if (bankBalance < amount) return message.reply("❎ Not enough coins in bank.");
        let target = await getUserData(receiver);
        if (!target) return message.reply("❎ Invalid target UID.");
        await bankCollection.updateOne({ userId: senderID }, { $inc: { bank: -amount } });
        await updateUserData(receiver, { coins: (target.coins || 0) + amount });
        return message.reply(`✅ Transferred ${amount} coins to ${receiver}.`);
      }

      case "interest": {
        const now = Date.now();
        const last = bankData.lastInterest || 0;
        if (now - last < 24 * 60 * 60 * 1000) {
          return message.reply("❎ You can only claim interest once every 24h.");
        }
        const interest = Math.floor(bankBalance * 0.05); // 5% daily
        if (interest <= 0) return message.reply("❎ No balance to earn interest.");
        await bankCollection.updateOne(
          { userId: senderID },
          { $inc: { bank: interest }, $set: { lastInterest: now } }
        );
        return message.reply(`✅ Claimed interest: +${interest} coins.`);
      }

      case "top": {
        const topUsers = await bankCollection
          .find({})
          .sort({ bank: -1 })
          .limit(10)
          .toArray();

        if (!topUsers.length) return message.reply("❎ No bank records yet.");

        let msg = "🏦 Bank Top 10 Users 🏦\n\n";
        for (let i = 0; i < topUsers.length; i++) {
          const u = topUsers[i];
          const user = await getUserData(u.userId);
          const name = user?.name || u.userId;
          msg += `${i + 1}. ${name} - 💳 ${u.bank} coins\n`;
        }
        return message.reply(msg);
      }

      default:
        return message.reply("❎ Invalid command. Try: balance, deposit, withdraw, transfer, interest, top");
    }
  }
};
