const mongoose = require('mongoose');
const chalk = require('chalk');
const moment = require('moment');
const axios = require('axios');
const config = require('../config.json');
const User = require('../models/User');
const Group = require('../models/Group');

// MongoDB connect
if (!mongoose.connection.readyState) {
  mongoose.connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => log('✅ MongoDB connected', 'success'))
    .catch(err => log(`❌ MongoDB connection error: ${err.message}`, 'error'));
}

// Logger
function log(message, type = 'info') {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red
  };
  console.log(`[${timestamp}] ${colors[type] ? colors[type](message) : message}`);
}

// Uptime formatter
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

// Initialize (MongoDB only)
async function initDatabase() {
  log('✅ MongoDB mode, no JSON database to initialize.', 'info');
}

// ✅ Get or create user
async function getUserData(userId, name = null) {
  let user = await User.findOne({ id: userId });
  if (!user) {
    user = new User({
      id: userId,
      name: name || userId,
      coins: 0,
      exp: 0,
      level: 1,
      lastActive: Date.now(),
      commandCount: 0,
      lastDailyReward: null,
      joinDate: Date.now()
    });
    await user.save();
  } else if (name && user.name !== name) {
    user.name = name;
    await user.save();
  }
  return user;
}

// ✅ Update user
async function updateUserData(userId, updates) {
  const user = await User.findOneAndUpdate(
    { id: userId },
    { $set: updates },
    { new: true, upsert: true }
  );
  return user;
}

// ✅ Get or create group
async function getGroupData(groupId) {
  let group = await Group.findOne({ id: groupId });
  if (!group) {
    group = new Group({
      id: groupId,
      settings: {
        welcomeDisabled: false,
        welcomeMessage: null,
        goodbyeDisabled: false
      },
      commandCount: 0,
      members: []
    });
    await group.save();
  }
  return group;
}

// ✅ Update group
async function updateGroupData(groupId, updates) {
  const group = await Group.findOneAndUpdate(
    { id: groupId },
    { $set: updates },
    { new: true, upsert: true }
  );
  return group;
}

// ✅ OpenAI API (optional)
async function callOpenAI(prompt, userId = null) {
  if (!config.ai.openai.apiKey) throw new Error('OpenAI API key not configured');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.ai.openai.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful WhatsApp bot assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    log(`OpenAI API error: ${error.message}`, 'error');
    throw new Error('Failed to get AI response');
  }
}

// ✅ Track usage
async function trackCommand(userId) {
  try {
    const user = await getUserData(userId);
    await updateUserData(userId, {
      commandCount: (user.commandCount || 0) + 1,
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
  trackCommand
};
