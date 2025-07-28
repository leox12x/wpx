const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');
const axios = require('axios');

// Logging function
function log(message, type = 'info') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const colors = {
        info: chalk.blue,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red
    };
    
    const coloredMessage = colors[type] ? colors[type](message) : message;
    console.log(`[${timestamp}] ${coloredMessage}`);
}

// Format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Initialize database
async function initDatabase() {
    const config = require('../config.json');
    
    if (config.database.type === 'mongodb') {
        const dbPath = path.join(__dirname, '..', config.database.path);
        const dbDir = path.dirname(dbPath);
        
        await fs.ensureDir(dbDir);
        
        if (!await fs.pathExists(dbPath)) {
            const initialData = {
                users: {},
                groups: {},
                settings: {}
            };
            await fs.writeJSON(dbPath, initialData, { spaces: 2 });
        }
        
        log('📁 JSON database initialized', 'success');
    }
}

// Get user data
async function getUserData(userId) {
    const config = require('../config.json');
    
    if (config.database.type === 'mongodb') {
        const dbPath = path.join(__dirname, '..', config.database.path);
        const data = await fs.readJSON(dbPath);
        
        if (!data.users[userId]) {
            data.users[userId] = {
                id: userId,
                coins: 0,
                exp: 0,
                level: 1,
                lastActive: Date.now(),
                commandCount: 0,
                lastDailyReward: null,
                joinDate: Date.now()
            };
            await fs.writeJSON(dbPath, data, { spaces: 2 });
        }
        
        return data.users[userId];
    }
    
    return null;
}

// Update user data
async function updateUserData(userId, updates) {
    const config = require('../config.json');
    
    if (config.database.type === 'mongodb') {
        const dbPath = path.join(__dirname, '..', config.database.path);
        const data = await fs.readJSON(dbPath);
        
        if (!data.users[userId]) {
            data.users[userId] = {
                id: userId,
                coins: 0,
                exp: 0,
                level: 1,
                lastActive: Date.now(),
                commandCount: 0,
                lastDailyReward: null,
                joinDate: Date.now()
            };
        }
        
        Object.assign(data.users[userId], updates);
        await fs.writeJSON(dbPath, data, { spaces: 2 });
        
        return data.users[userId];
    }
    
    return null;
}

// Get group data
async function getGroupData(groupId) {
    const config = require('../config.json');
    
    if (config.database.type === 'mongodb') {
        const dbPath = path.join(__dirname, '..', config.database.path);
        const data = await fs.readJSON(dbPath);
        
        if (!data.groups[groupId]) {
            data.groups[groupId] = {
                id: groupId,
                settings: {
                    welcomeDisabled: false,
                    welcomeMessage: null,
                    goodbyeDisabled: false
                },
                commandCount: 0,
                members: []
            };
            await fs.writeJSON(dbPath, data, { spaces: 2 });
        }
        
        return data.groups[groupId];
    }
    
    return null;
}

// Update group data
async function updateGroupData(groupId, updates) {
    const config = require('../config.json');
    
    if (config.database.type === 'mongodb') {
        const dbPath = path.join(__dirname, '..', config.database.path);
        const data = await fs.readJSON(dbPath);
        
        if (!data.groups[groupId]) {
            data.groups[groupId] = {
                id: groupId,
                settings: {
                    welcomeDisabled: false,
                    welcomeMessage: null,
                    goodbyeDisabled: false
                },
                commandCount: 0,
                members: []
            };
        }
        
        Object.assign(data.groups[groupId], updates);
        await fs.writeJSON(dbPath, data, { spaces: 2 });
        
        return data.groups[groupId];
    }
    
    return null;
}

// OpenAI integration
async function callOpenAI(prompt, userId = null) {
    const config = require('../config.json');
    
    if (!config.ai.openai.apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: config.ai.openai.model || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant in a WhatsApp bot. Keep responses concise and friendly.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${config.ai.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.choices[0].message.content;
    } catch (error) {
        log(`OpenAI API error: ${error.message}`, 'error');
        throw new Error('Failed to get AI response');
    }
}

// Download media
async function downloadMedia(message) {
    try {
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            return media;
        }
        return null;
    } catch (error) {
        log(`Media download error: ${error.message}`, 'error');
        return null;
    }
}

// Track command usage
async function trackCommand(userId) {
    try {
        const userData = await getUserData(userId);
        await updateUserData(userId, {
            commandCount: (userData.commandCount || 0) + 1,
            lastActive: Date.now()
        });
    } catch (error) {
        log(`Error tracking command for user ${userId}: ${error.message}`, 'error');
    }
}

module.exports = {
    log,
    formatUptime,
    initDatabase,
    getUserData,
    updateUserData,
    getGroupData,
    updateGroupData,
    callOpenAI,
    downloadMedia,
    trackCommand
};
