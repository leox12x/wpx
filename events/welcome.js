const { getGroupData } = require('../scripts/helpers');

if (!global.temp) global.temp = {};
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "1.7",
        author: "NTKhang - Adapted for WhatsApp by Mahmud",
        description: "Welcome new members to group",
        category: "events"
    },

    langs: {
        en: {
            session1: "𝗲𝗮𝗿𝗹𝘆 𝗺𝗼𝗿𝗻𝗶𝗻𝗴",  // 4 AM - 6 AM
            session2: "𝗺𝗼𝗿𝗻𝗶𝗻𝗴",         // 6 AM - 12 PM
            session3: "𝗮𝗳𝘁𝗲𝗿𝗻𝗼𝗼𝗻",        // 12 PM - 4 PM
            session4: "𝗲𝘃𝗲𝗻𝗶𝗻𝗴",          // 4 PM - 8 PM
            session5: "𝗻𝗶𝗴𝗵𝘁",           // 8 PM - 12 AM
            session6: "𝗺𝗶𝗱𝗻𝗶𝗴𝗵𝘁",         // 12 AM - 2 AM
            session7: "𝗹𝗮𝘁𝗲 𝗻𝗶𝗴𝗵𝘁",       // 2 AM - 4 AM
            welcomeMessage: `⚪⚫🟡🟢🔴🔵\n\n🤖 Thank you for inviting me! 🌟\n\n🚀 Let's get started! Here's some useful information:\n\n- Bot Prefix: %1\n\n- To discover the list of available commands, type: %1help\n\n📚 Need assistance or have questions? Feel free to reach out anytime. Enjoy your time in the group! 🌈✨`,
            multiple1: "𝘆𝗼𝘆",
            multiple2: "𝘆𝗼𝘂 𝗴𝘂𝘆𝘀",
            defaultWelcomeMessage: `🥰 𝗔𝗦𝗦𝗔𝗟𝗔𝗠𝗨𝗟𝗔𝗜𝗞𝗨𝗠 🥰

>🎀 {userName}
𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘆𝗼𝘂 𝘁𝗼 𝗼𝘂𝗿
[ {groupName} ]
𝗚𝗿𝗼𝗨𝗽
𝗛𝗮𝘃𝗲 𝗮 𝗻𝗶𝗰𝗲 {session} 😊
⚠ 𝗜 𝗵𝗼𝗽𝗲 𝘆𝗼𝘂 𝘄𝗶𝗹𝗹 𝗳𝗼𝗹𝗹𝗼𝘄 𝗼𝘂𝗿 𝗮𝗹𝗹 𝗴𝗿𝗼𝗨𝗽 𝗿𝘂𝗹𝗲𝘀♻

• 𝗢𝘄𝗻𝗲𝗿: 𝗠𝗮𝗵𝗠𝗨𝗗
• 𝗳𝗯: m.me/mahmud.x07`
        }
    },

    onBotAdded: async function(client, chat) {
        try {
            const config = require('../config.json');
            const prefix = config.bot.prefix;
            const lang = config.bot.defaultLang || 'en';
            const welcomeMsg = this.langs[lang].welcomeMessage.replace('%1', prefix);
            await chat.sendMessage(welcomeMsg);
        } catch (error) {
            console.error('Error in onBotAdded:', error);
        }
    },

    onMembersAdded: async function(client, notification) {
        try {
            const chat = await client.getChatById(notification.chatId);
            const config = require('../config.json');
            const lang = config.bot.defaultLang || 'en';
            if (!chat.isGroup) return;

            const groupData = await getGroupData(notification.chatId);
            if (groupData.settings && groupData.settings.welcomeDisabled) return;

            const groupId = notification.chatId;

            if (!global.temp.welcomeEvent[groupId]) {
                global.temp.welcomeEvent[groupId] = {
                    joinTimeout: null,
                    addedParticipants: []
                };
            }

            const newMembers = [];
            for (const participantId of notification.recipientIds) {
                try {
                    const contact = await client.getContactById(participantId);
                    newMembers.push({
                        id: participantId,
                        name: contact.name || contact.pushname || contact.number || participantId.split('@')[0],
                        mention: participantId
                    });
                } catch {
                    newMembers.push({
                        id: participantId,
                        name: participantId.split('@')[0],
                        mention: participantId
                    });
                }
            }

            global.temp.welcomeEvent[groupId].addedParticipants.push(...newMembers);

            if (global.temp.welcomeEvent[groupId].joinTimeout) {
                clearTimeout(global.temp.welcomeEvent[groupId].joinTimeout);
            }

            global.temp.welcomeEvent[groupId].joinTimeout = setTimeout(async () => {
                try {
                    const addedParticipants = global.temp.welcomeEvent[groupId].addedParticipants;
                    if (addedParticipants.length === 0) return;

                    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
                    const hours = now.getHours();
                    let session;
                    if (hours >= 4 && hours < 6) session = this.langs[lang].session1;
                    else if (hours >= 6 && hours < 12) session = this.langs[lang].session2;
                    else if (hours >= 12 && hours < 16) session = this.langs[lang].session3;
                    else if (hours >= 16 && hours < 20) session = this.langs[lang].session4;
                    else if (hours >= 20 && hours < 24) session = this.langs[lang].session5;
                    else if (hours >= 0 && hours < 2) session = this.langs[lang].session6;
                    else session = this.langs[lang].session7;

                    const multiple = addedParticipants.length > 1;
                    const multipleText = multiple ? this.langs[lang].multiple2 : this.langs[lang].multiple1;
                    const groupName = chat.name || 'this group';
                    const userNames = addedParticipants.map(member => member.name).join(', ');
                    let welcomeMessage = groupData.settings?.welcomeMessage || this.langs[lang].defaultWelcomeMessage;

                    welcomeMessage = welcomeMessage
                        .replace(/\{userName\}/g, userNames)
                        .replace(/\{groupName\}/g, groupName)
                        .replace(/\{multiple\}/g, multipleText)
                        .replace(/\{session\}/g, session);

                    const mentions = addedParticipants.map(member => member.mention);

                    await chat.sendMessage(welcomeMessage, { mentions });

                    delete global.temp.welcomeEvent[groupId];
                } catch (error) {
                    console.error('Error sending welcome message:', error);
                    delete global.temp.welcomeEvent[groupId];
                }
            }, 1500);
        } catch (error) {
            console.error('Error in welcome event:', error);
        }
    },

    execute: async function(client, notification) {
        await this.onMembersAdded(client, notification);
    },

    getSessionGreeting: function(lang = 'en') {
        const hours = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })).getHours();
        if (hours >= 4 && hours < 6) return this.langs[lang].session1;
        if (hours >= 6 && hours < 12) return this.langs[lang].session2;
        if (hours >= 12 && hours < 16) return this.langs[lang].session3;
        if (hours >= 16 && hours < 20) return this.langs[lang].session4;
        if (hours >= 20 && hours < 24) return this.langs[lang].session5;
        if (hours >= 0 && hours < 2) return this.langs[lang].session6;
        return this.langs[lang].session7;
    }
};
