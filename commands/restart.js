// File: restart.js
// Author: Rahaman Leon
// Description: Restart the WhatsApp bot safely with rate-limit awareness

const fs = require('fs-extra');
const path = require('path');

const restartFilePath = path.join(__dirname, '..', 'tmp', 'restart.json');

module.exports = {
    config: {
        name: "restart",
        aliases: ["reboot", "rerun"],
        version: "1.4",
        author: "Rahaman Leon",
        coolDown: 10,
        role: 2, // Owner only
        description: "Restart the WhatsApp bot",
        category: "owner",
        guide: {
            en: "{prefix}restart - Restart the bot (Owner only)"
        }
    },

    onStart: async function ({ message, client, config, contact }) {
        try {
            const userId = contact.id._serialized;
            const isOwner = config.adminBot.includes(userId);

            if (!isOwner) {
                return await message.reply("❌ Access Denied: Only bot owners can restart the bot.");
            }

            const restartData = {
                chatId: message.from,
                userId,
                userName: contact.name || contact.pushname || "Owner",
                timestamp: Date.now(),
                reason: "Manual restart"
            };

            await fs.ensureDir(path.dirname(restartFilePath));
            await fs.writeJSON(restartFilePath, restartData, { spaces: 2 });

            try {
                await message.reply(
                    `🔄 **Bot Restart Initiated**\n` +
                    `👤 By: ${restartData.userName}\n` +
                    `⏰ Time: ${new Date().toLocaleString()}\n` +
                    `📝 Status: Restarting...`
                );
            } catch (rateErr) {
                console.warn("⚠️ Rate-limited on reply. Skipping user reply.");
            }

            console.log(`🔄 Bot restart initiated by ${restartData.userName} (${userId})`);

            setTimeout(() => {
                console.log('🚀 Restarting bot process...');
                process.exit(1);
            }, 2000);

        } catch (error) {
            console.error("Restart error:", error);
            await message.reply(
                `❌ **Restart Failed**\n\n` +
                `Error: ${error.message}\n` +
                `Time: ${new Date().toLocaleString()}`
            );
        }
    },

    checkRestart: async function (client) {
        try {
            if (await fs.pathExists(restartFilePath)) {
                const { chatId, userName, timestamp, reason } = await fs.readJSON(restartFilePath);
                const restartTime = ((Date.now() - timestamp) / 1000).toFixed(2);

                const msg = 
                    `✅ **Bot Restarted Successfully**\n\n` +
                    `👤 Initiated by: ${userName}\n` +
                    `⏰ Took: ${restartTime}s\n` +
                    `📝 Reason: ${reason}\n` +
                    `🕐 Done: ${new Date().toLocaleString()}`;

                try {
                    await client.sendMessage(chatId, msg);
                } catch (rateErr) {
                    console.warn("⚠️ Could not notify restart due to rate limit.");
                }

                await fs.remove(restartFilePath);
                console.log(`✅ Restart notification sent to ${chatId} (${restartTime}s)`);
            }
        } catch (err) {
            console.error("Error sending restart notice:", err);
            if (await fs.pathExists(restartFilePath)) {
                await fs.remove(restartFilePath);
            }
        }
    },

    emergencyRestart: async function (client, reason = "Emergency restart") {
        try {
            const data = {
                chatId: null,
                userId: "system",
                userName: "System",
                timestamp: Date.now(),
                reason
            };
            await fs.ensureDir(path.dirname(restartFilePath));
            await fs.writeJSON(restartFilePath, data, { spaces: 2 });

            console.log(`🚨 Emergency restart: ${reason}`);
            process.exit(1);
        } catch (error) {
            console.error("Emergency restart failed:", error);
            process.exit(1);
        }
    }
};
