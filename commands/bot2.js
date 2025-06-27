const axios = require("axios");
const { log } = require('../scripts/helpers');

// Configuration constants
const CONFIG = {
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  REPLY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REQUEST_TIMEOUT: 15000,
  MAX_RETRIES: 2,
  RETRY_DELAY_BASE: 1000,
  API_URL: "https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json",
  // Anti-spam settings
  USER_COOLDOWN: 30 * 1000, // 30 seconds per user
  GLOBAL_COOLDOWN: 5 * 1000, // 5 seconds global
  MAX_RESPONSES_PER_MINUTE: 3, // Max 3 responses per user per minute
  SPAM_THRESHOLD: 5 // Max 5 rapid messages before temporary block
};

// Cache for API base URL
let cachedBaseUrl = null;
let lastFetch = 0;

// OnReply storage (in-memory for this session)
const replyStates = new Map();

// Anti-spam tracking
const userCooldowns = new Map();
const userResponseCount = new Map();
const lastGlobalResponse = { timestamp: 0 };
const spamTracker = new Map();

// More specific trigger words to reduce false positives
const TRIGGERS = new Set([
  "jan", "jaan", "জান", "hinata", "ai", "bot", "বট",
  "dora", "ডোরা"
  // Removed common words like "hey", "hi", "hello" to reduce spam
]);

// End conversation triggers
const END_TRIGGERS = new Set([
  'bye', 'বাই', 'ধন্যবাদ', 'thanks', 'end', 'stop', 'বন্ধ', 'শেষ'
]);

// Random responses - cached for performance
const RANDOM_RESPONSES = [
  "বাবু কি খবর? 🥺",
  "Boss বল boss! 😼", 
  "আমাকে ডাকলে আমি কিন্তু কিস করে দেবো 😘",
  "কি বলবা? সবার সামনে বলবা নাকি? 🤭",
  "আমি তোমাকে ভালোবাসি 😘💕",
  "কেমন আছো? 🤗",
  "কি করছো এখন? 🤔",
  "আমার সাথে গল্প করো 💬",
  "তুমি কি আমার সাথে খেলবে? 🎮",
  "আজ কেমন দিন কাটছে? ☀️",
  "আমি এখানে আছি, কি বলতে চাও? 💭"
];

const CHAT_RANDOM_RESPONSES = [
  "হ্যাঁ বাবু, কি বলবে? 🥺",
  "বল বল, আমি শুনছি! 👂",
  "কি খবর? কেমন আছো? 😊",
  "আমার সাথে কথা বলতে চাও? 💕",
  "হাই! আমি এখানে আছি। 🤗",
  "কি করছো? বল তো! 🤔",
  "আমি তোমার জন্য অপেক্ষা করছিলাম! 💭"
];

/**
 * Anti-spam protection
 */
function isUserOnCooldown(userId) {
  const cooldownData = userCooldowns.get(userId);
  if (!cooldownData) return false;
  
  const now = Date.now();
  return now - cooldownData.lastResponse < CONFIG.USER_COOLDOWN;
}

function isGlobalCooldown() {
  const now = Date.now();
  return now - lastGlobalResponse.timestamp < CONFIG.GLOBAL_COOLDOWN;
}

function updateUserCooldown(userId) {
  const now = Date.now();
  userCooldowns.set(userId, { lastResponse: now });
  lastGlobalResponse.timestamp = now;
}

function checkUserSpam(userId) {
  const now = Date.now();
  const spam = spamTracker.get(userId) || { count: 0, lastReset: now, blocked: false };
  
  // Reset counter every minute
  if (now - spam.lastReset > 60000) {
    spam.count = 0;
    spam.lastReset = now;
    spam.blocked = false;
  }
  
  spam.count++;
  
  // Block if exceeding spam threshold
  if (spam.count > CONFIG.SPAM_THRESHOLD) {
    spam.blocked = true;
    spam.blockTime = now;
  }
  
  spamTracker.set(userId, spam);
  
  // Unblock after 5 minutes
  if (spam.blocked && now - spam.blockTime > 5 * 60 * 1000) {
    spam.blocked = false;
    spam.count = 0;
  }
  
  return spam.blocked;
}

function checkResponseLimit(userId) {
  const now = Date.now();
  const responseData = userResponseCount.get(userId) || { count: 0, lastReset: now };
  
  // Reset counter every minute
  if (now - responseData.lastReset > 60000) {
    responseData.count = 0;
    responseData.lastReset = now;
  }
  
  responseData.count++;
  userResponseCount.set(userId, responseData);
  
  return responseData.count > CONFIG.MAX_RESPONSES_PER_MINUTE;
}

/**
 * Fetch base API URL with caching
 */
async function getBaseApiUrl() {
  try {
    // Use cached URL if available and not expired
    if (cachedBaseUrl && (Date.now() - lastFetch < CONFIG.CACHE_DURATION)) {
      return cachedBaseUrl;
    }

    const response = await axios.get(CONFIG.API_URL, { 
      timeout: CONFIG.REQUEST_TIMEOUT 
    });
    
    if (response.data?.jan) {
      cachedBaseUrl = response.data.jan;
      lastFetch = Date.now();
      return cachedBaseUrl;
    }
    
    throw new Error("Invalid API response structure");
  } catch (error) {
    log(`Failed to fetch base API URL: ${error.message}`, 'error');
    
    // Fallback to cached URL if available
    if (cachedBaseUrl) {
      log('Using cached base URL as fallback', 'warning');
      return cachedBaseUrl;
    }
    
    throw new Error("Could not retrieve API base URL and no cache available");
  }
}

/**
 * Get bot response with retry logic
 */
async function getBotResponse(message, retries = CONFIG.MAX_RETRIES) {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return getRandomResponse(RANDOM_RESPONSES);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const baseUrl = await getBaseApiUrl();
      const encodedMessage = encodeURIComponent(cleanMessage);
      
      const response = await axios.get(
        `${baseUrl}/jan/font3/${encodedMessage}`,
        { 
          timeout: CONFIG.REQUEST_TIMEOUT,
          headers: {
            'User-Agent': 'WhatsApp-Bot/1.0',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.data?.message) {
        return response.data.message;
      }
      
      throw new Error("Invalid response format");
    } catch (error) {
      log(`API request attempt ${attempt + 1} failed: ${error.message}`, 'warning');
      
      if (attempt === retries) {
        log('All API attempts failed', 'error');
        return "আমি এখন একটু ব্যস্ত আছি। পরে আবার চেষ্টা করো। 😊";
      }
      
      // Exponential backoff
      await sleep(CONFIG.RETRY_DELAY_BASE * (attempt + 1));
    }
  }
}

/**
 * Check if message should trigger bot without prefix - More strict checking
 */
function shouldTriggerBot(messageBody) {
  const content = messageBody.toLowerCase().trim();
  const cleanedContent = content.replace(/[.,!?]+$/g, "");
  
  // More strict: Only trigger if message starts with trigger word or is exactly the trigger word
  return Array.from(TRIGGERS).some(trigger => {
    const lowerTrigger = trigger.toLowerCase();
    return cleanedContent === lowerTrigger || 
           cleanedContent.startsWith(lowerTrigger + " ");
  });
}

/**
 * Extract message content after trigger word
 */
function extractMessageAfterTrigger(messageBody) {
  const content = messageBody.toLowerCase().trim();
  const originalContent = messageBody.trim();
  
  for (const trigger of TRIGGERS) {
    const lowerTrigger = trigger.toLowerCase();
    const triggerWithSpace = lowerTrigger + " ";
    
    if (content.startsWith(triggerWithSpace)) {
      return originalContent.substring(triggerWithSpace.length).trim();
    } else if (content === lowerTrigger) {
      return "";
    }
  }
  
  return originalContent;
}

/**
 * Get random response from array
 */
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Set up conversation state
 */
function setupConversationState(userId, messageId) {
  replyStates.set(userId, {
    type: 'conversation',
    timestamp: Date.now(),
    messageId: messageId
  });
}

/**
 * Check if conversation state is valid
 */
function isValidConversationState(userId) {
  const replyState = replyStates.get(userId);
  
  if (!replyState || replyState.type !== 'conversation') {
    return { valid: false, expired: false };
  }
  
  const expired = Date.now() - replyState.timestamp > CONFIG.REPLY_TIMEOUT;
  if (expired) {
    replyStates.delete(userId);
    return { valid: false, expired: true };
  }
  
  return { valid: true, expired: false, state: replyState };
}

/**
 * Check if message is conversation end trigger
 */
function isEndTrigger(message) {
  const lowerMessage = message.toLowerCase();
  return Array.from(END_TRIGGERS).some(trigger => lowerMessage.includes(trigger));
}

/**
 * Send typing indicator
 */
async function sendTypingIndicator(message) {
  try {
    const chat = await message.getChat();
    await chat.sendStateTyping();
  } catch (error) {
    log(`Failed to send typing indicator: ${error.message}`, 'warning');
  }
}

/**
 * Sleep utility function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clean up expired conversation states and cooldowns
 */
function cleanupExpiredStates() {
  const now = Date.now();
  
  // Clean up conversation states
  for (const [userId, state] of replyStates.entries()) {
    if (now - state.timestamp > CONFIG.REPLY_TIMEOUT) {
      replyStates.delete(userId);
    }
  }
  
  // Clean up old cooldowns
  for (const [userId, cooldown] of userCooldowns.entries()) {
    if (now - cooldown.lastResponse > CONFIG.USER_COOLDOWN * 10) {
      userCooldowns.delete(userId);
    }
  }
  
  // Clean up old response counts
  for (const [userId, data] of userResponseCount.entries()) {
    if (now - data.lastReset > 60000 * 5) {
      userResponseCount.delete(userId);
    }
  }
  
  // Clean up spam tracker
  for (const [userId, spam] of spamTracker.entries()) {
    if (now - spam.lastReset > 300000) { // 5 minutes
      spamTracker.delete(userId);
    }
  }
}

// Clean up expired states every 10 minutes
setInterval(cleanupExpiredStates, 10 * 60 * 1000);

module.exports = {
  config: {
    name: "bot2",
    aliases: ["jan", "jaan", "জান", "hinata", "ai", "bot", "বট", "dora", "ডোরা"],
    version: "3.2",
    author: "MahMUD (Anti-spam by Assistant)",
    role: 0,
    description: { 
      en: "AI chatbot with anti-spam protection - responds to specific triggers",
      bn: "এআই চ্যাটবট স্প্যাম সুরক্ষা সহ - নির্দিষ্ট ট্রিগারে সাড়া দেয়"
    },
    category: "ai",
    guide: { 
      en: "Type 'jan [message]' or use specific trigger words. Has cooldown protection.",
      bn: "'জান [বার্তা]' বা নির্দিষ্ট ট্রিগার শব্দ ব্যবহার করুন। কুলডাউন সুরক্ষা আছে।"
    },
    coolDown: 5 // Increased cooldown
  },

  onStart: async function({ message, args, client, prefix }) {
    try {
      const userId = message.from;
      
      // Anti-spam checks
      if (isUserOnCooldown(userId)) {
        await message.reply("একটু অপেক্ষা করো! খুব তাড়াহুড়ো করছো। ⏳");
        return;
      }
      
      if (isGlobalCooldown()) {
        return; // Silent ignore during global cooldown
      }
      
      if (checkUserSpam(userId)) {
        await message.reply("তুমি খুব বেশি স্প্যাম করছো! ৫ মিনিট অপেক্ষা করো। 🚫");
        return;
      }
      
      if (checkResponseLimit(userId)) {
        await message.reply("প্রতি মিনিটে সর্বোচ্চ ৩টি মেসেজ! একটু অপেক্ষা করো। ⏰");
        return;
      }
      
      const userMessage = args.join(" ").trim();
      updateUserCooldown(userId);
      
      if (!userMessage) {
        const randomResponse = getRandomResponse(RANDOM_RESPONSES);
        setupConversationState(userId, message.id._serialized);
        
        await message.reply(`${randomResponse}\n\n_এখন আমার সাথে কথা বলো, আমি সব শুনছি... 👂_\n_[Reply to continue conversation]_`);
        return;
      }

      await sendTypingIndicator(message);
      const botResponse = await getBotResponse(userMessage);
      
      setupConversationState(userId, message.id._serialized);
      await message.reply(`${botResponse}\n\n_Continue our conversation by replying to this message! 💬_`);
      
      log(`Bot2 AI response sent to ${userId}`, 'info');
    } catch (error) {
      log(`Bot2 error: ${error.message}`, 'error');
      await message.reply("দুঃখিত, আমি এখন একটু সমস্যায় আছি। পরে আবার চেষ্টা করো। 😔");
    }
  },

  onReply: async function({ message, Reply, client }) {
    try {
      const userId = message.from;
      
      // Anti-spam checks for replies too
      if (checkUserSpam(userId)) {
        await message.reply("খুব তাড়াহুড়ো করো না! একটু ধৈর্য ধরো। 🐌");
        return;
      }
      
      const conversationCheck = isValidConversationState(userId);
      
      if (!conversationCheck.valid) {
        if (conversationCheck.expired) {
          await message.reply("কথোপকথনের সময় শেষ! আবার 'জান' লিখে নতুন কথোপকথন শুরু করো। ⏰");
        }
        return;
      }
      
      const userMessage = message.body.trim();
      
      if (!userMessage) {
        await message.reply("কিছু লিখো তো! 🤔");
        return;
      }
      
      if (isEndTrigger(userMessage)) {
        replyStates.delete(userId);
        await message.reply("বাই বাই! আবার কথা হবে। 👋💕\n\n_Conversation ended. Type 'jan' to start again._");
        return;
      }
      
      await sendTypingIndicator(message);
      const botResponse = await getBotResponse(userMessage);
      
      // Update timestamp to keep conversation alive
      setupConversationState(userId, message.id._serialized);
      
      await message.reply(`${botResponse}\n\n_Keep replying to continue our chat! 💬_`);
      
      log(`Bot2 onReply conversation with ${userId}`, 'info');
    } catch (error) {
      log(`Bot2 onReply error: ${error.message}`, 'error');
      await message.reply("কথোপকথনে একটু সমস্যা হচ্ছে। আবার চেষ্টা করো। 😅");
    }
  },

  onChat: async function({ client, message, config }) {
    try {
      if (!message.body || message.fromMe) return;
      
      const messageBody = message.body.trim();
      const userId = message.from;
      
      // Skip if message starts with any known prefix
      const botPrefix = config.bot?.prefix || "!";
      if (messageBody.startsWith(botPrefix)) return;
      
      // Anti-spam checks for onChat
      if (isUserOnCooldown(userId)) return; // Silent ignore during cooldown
      if (isGlobalCooldown()) return; // Silent ignore during global cooldown
      if (checkUserSpam(userId)) return; // Silent ignore if spamming
      if (checkResponseLimit(userId)) return; // Silent ignore if over limit
      
      // Check if should trigger bot (more strict now)
      if (!shouldTriggerBot(messageBody)) return;
      
      const userMessage = extractMessageAfterTrigger(messageBody);
      updateUserCooldown(userId);
      
      await sendTypingIndicator(message);
      
      const botResponse = userMessage 
        ? await getBotResponse(userMessage)
        : getRandomResponse(CHAT_RANDOM_RESPONSES);
      
      setupConversationState(userId, message.id._serialized);
      
      await message.reply(`${botResponse}\n\n_Reply to this message to continue our conversation! 🗨️_`);
      
      log(`Bot2 word-trigger response sent to ${userId}`, 'info');
    } catch (error) {
      log(`Bot2 onChat error: ${error.message}`, 'error');
    }
  }
};
