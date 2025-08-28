const { MongoClient } = require("mongodb");
const { getUserData, updateUserData } = require("../scripts/helpers");

const mongoUri = "mongodb+srv://mahmudabdullax7:ttnRAhj81JikbEw8@cluster0.zwknjau.mongodb.net/whatsapp-bot?retryWrites=true&w=majority&appName=Cluster0";

let client;
async function connectDB() {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
  }
  return client.db("WhatsappbotV2").collection("bankData");
}

module.exports = {
  config: {
    name: "bank",
    version: "2.0",
    author: "MahMUD",
    role: 0,
    category: "economy",
    shortDescription: { en: "Deposit, withdraw, transfer, interest system" },
    longDescription: {
      en: "Bank system: deposit, withdraw, transfer coins, earn daily interest, loan system, top ranking."
    },
    guide: {
      en: "{pn} deposit <amount>\n{pn} withdraw <amount>\n{pn} balance\n{pn} transfer <uid> <amount>\n{pn} interest\n{pn} top"
    }
  },

  onStart: async function ({ args, message }) {
    // ---------------- WhatsApp Web.js senderID ----------------
    const senderID = message.from; 
    if (!senderID) return message.reply("❎ Could not detect sender ID.");

    const userData = await getUserData(senderID);
    const userCoins = userData?.coins || 0;

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
    const bankCollection = await connectDB();

    // Fetch or initialize bank data
    let bankData = await bankCollection.findOne({ userId: senderID });
    if (!bankData) {
      bankData = { userId: senderID, bank: 0, lastInterest: Date.now() };
      await bankCollection.insertOne(bankData);
    }
    let bankBalance = bankData.bank || 0;

    switch (action) {
      case "deposit": {
        const amount = parseInt(args[1]);
        if (!amount || amount <= 0) return message.reply("❎ Enter a valid deposit amount.");
        if (userCoins < amount) return message.reply("❎ You don't have enough coins.");
        await updateUserData(senderID, { coins: userCoins - amount });
        await bankCollection.updateOne({ userId: senderID }, { $inc: { bank: amount } });
        return message.reply(`✅ Deposited ${amount} coins into bank.`);
      }

      case "withdraw": {
        const amount = parseInt(args[1]);
        if (!amount || amount <= 0) return message.reply("❎ Enter a valid withdraw amount.");
        if (bankBalance < amount) return message.reply("❎ Not enough balance in bank.");
        await updateUserData(senderID, { coins: userCoins + amount });
        await bankCollection.updateOne({ userId: senderID }, { $inc: { bank: -amount } });
        return message.reply(`✅ Withdrew ${amount} coins from bank.`);
      }

      case "balance": {
        return message.reply(`💳 Bank Balance: ${bankBalance}\n💰 Wallet Balance: ${userCoins}`);
      }

      case "transfer": {
        const receiver = args[1];
        const amount = parseInt(args[2]);
        if (!receiver || !amount) return message.reply("❎ Usage: bank transfer <uid> <amount>");
        if (bankBalance < amount) return message.reply("❎ Not enough coins in bank.");
        const targetData = await getUserData(receiver);
        if (!targetData) return message.reply("❎ Invalid target UID.");
        await bankCollection.updateOne({ userId: senderID }, { $inc: { bank: -amount } });
        await updateUserData(receiver, { coins: (targetData.coins || 0) + amount });
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
        const topUsers = await bankCollection.find({}).sort({ bank: -1 }).limit(10).toArray();
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
