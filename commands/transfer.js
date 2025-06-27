const { getUserData, updateUserData, log } = require('../scripts/helpers');

module.exports = {
    config: {
        name: "transfer",
        aliases: ["send", "pay", "give"],
        version: "1.0",
        author: "Assistant",
        coolDown: 10,
        role: 0,
        description: "Transfer coins to another user",
        category: "economy",
        guide: {
            en: "{prefix}transfer @mention <amount> - Transfer coins to mentioned user"
        }
    },

    onStart: async function ({ message, args, client }) {
        try {
            const mentions = message.mentionedIds || [];
            const senderId = message.author || message.from;

            if (mentions.length === 0) {
                return await message.reply("❌ Please mention a user to transfer coins to.\n\nUsage: !transfer @user <amount>");
            }

            if (mentions.includes(senderId)) {
                return await message.reply("❌ You cannot transfer coins to yourself!");
            }

            const amount = parseInt(args[args.length - 1]);
            if (isNaN(amount) || amount <= 0) {
                return await message.reply("❌ Please specify a valid amount to transfer.\n\nUsage: !transfer @user <amount>");
            }

            if (amount < 10) {
                return await message.reply("❌ Minimum transfer amount is 10 coins.");
            }

            const senderData = await getUserData(senderId);
            const receiverId = mentions[0];
            const receiverData = await getUser