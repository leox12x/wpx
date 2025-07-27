const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const config = require('./config.json');
const { loadCommands } = require('./scripts/cmdloadder');
const { loadEvents } = require('./scripts/eventsIndex');
const { initDatabase, log, formatUptime, trackCommand } = require('./scripts/helpers');
const RateLimiter = require('./scripts/rateLimiter');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');

// Initialize global GoatBot object for compatibility
global.GoatBot = {
    configCommands: {},
    commands: new Map(),
    eventCommands: new Map(),
    aliases: new Map(),
    onFirstChat: [],
    onChat: [],
    onEvent: [],
    onAnyEvent: [],
    onReaction: new Map(),
    commandFilesPath: [],
    eventCommandsFilesPath: [],
    envCommands: {},
    envEvents: {},
    envGlobal: {}
};

// Initialize global utils object
global.utils = {
    log: log,
    loading: {
        info: (type, message) => console.log(`[${type}] ${message}`)
    },
    removeHomeDir: (str) => str.replace(process.cwd(), ''),
    loadScripts: null, // Will be set by cmd.js
    unloadScripts: null // Will be set by cmd.js
};

// Initialize global client object
global.client = {
    dirConfigCommands: path.join(__dirname, 'data', 'config.json')
};

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize config commands file if it doesn't exist
const configCommandsPath = path.join(__dirname, 'data', 'config.json');
if (!fs.existsSync(configCommandsPath)) {
    fs.writeFileSync(configCommandsPath, JSON.stringify({
        commandUnload: [],
        commandEventUnload: [],
        envCommands: {},
        envEvents: {},
        envGlobal: {}
    }, null, 2));
}

// Load existing config commands
try {
    global.GoatBot.configCommands = JSON.parse(fs.readFileSync(configCommandsPath, 'utf8'));
} catch (error) {
    global.GoatBot.configCommands = {
        commandUnload: [],
        commandEventUnload: [],
        envCommands: {},
        envEvents: {},
        envGlobal: {}
    };
}

class WhatsAppBot {
    constructor() {
        this.config = config;
        this.commands = new Map();
        this.events = new Map();
        this.cooldowns = new Map();
        this.startTime = Date.now();
        
        // Initialize rate limiter
        const rateLimitConfig = this.config.rateLimiting || {};
        this.rateLimiter = new RateLimiter({
            maxRequests: rateLimitConfig.maxRequests || 25,
            windowMs: rateLimitConfig.windowMs || 60000,
            minDelay: rateLimitConfig.minDelay || 1200,
            maxDelay: rateLimitConfig.maxDelay || 10000
        });
        
        // Sync with global GoatBot
        global.GoatBot.commands = this.commands;
        
        // Initialize WhatsApp client
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: config.whatsapp.clientId || 'whatsapp-bot',
                dataPath: './auth_data'
            }),
            puppeteer: {
                headless: config.whatsapp.headless !== false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });

        this.setupEventListeners();
        this.setupDashboard();
        this.setupAutoTasks();
    }

    async initialize() {
        try {
            log('🚀 Starting WhatsApp Bot V2...', 'info');
            
            // Initialize database
            await initDatabase();
            
            // Load commands and events
            await this.loadCommands();
            await this.loadEvents();
            
            // Initialize client
            await this.client.initialize();
            
            log('✅ Bot initialized successfully!', 'success');
        } catch (error) {
            log(`❌ Failed to initialize bot: ${error.message}`, 'error');
            process.exit(1);
        }
    }

    setupEventListeners() {
        // QR Code generation
        this.client.on('qr', (qr) => {
            log('📱 Scan the QR code below with WhatsApp:', 'info');
            qrcode.generate(qr, { small: true });
        });

        // Ready event
        this.client.on('ready', async () => {
            log('🎉 WhatsApp Bot is ready!', 'success');
            log(`📞 Connected as: ${this.client.info.wid.user}`, 'info');
            
            // Check for restart notification
            setTimeout(async () => {
                await this.checkRestartNotification();
            }, 3000); // Wait 3 seconds for client to fully initialize
        });

        // Authentication events
        this.client.on('authenticated', () => {
            log('✅ WhatsApp authenticated successfully!', 'success');
        });

        this.client.on('auth_failure', (msg) => {
            log(`❌ Authentication failed: ${msg}`, 'error');
        });

        // Disconnection handling
        this.client.on('disconnected', (reason) => {
            log(`📴 WhatsApp disconnected: ${reason}`, 'warning');
            if (this.config.autoRestart.enabled) {
                setTimeout(() => {
                    log('🔄 Attempting to reconnect...', 'info');
                    this.client.initialize();
                }, this.config.autoRestart.delay || 5000);
            }
        });

        // Message handling
        this.client.on('message', async (message) => {
            // Add typing indicator for better user experience
            if (!message.fromMe && !message.isStatus) {
                const messageBody = message.body.trim().toLowerCase();
                const specialCommands = ['prefix', 'help', 'commands'];
                
                if (specialCommands.includes(messageBody) || message.body.startsWith(await this.getEffectivePrefix((await message.getChat()).id._serialized))) {
                    const chat = await message.getChat();
                    try {
                        await chat.sendStateTyping();
                    } catch (error) {
                        // Ignore typing errors
                    }
                }
            }
            
            await this.handleMessage(message);
        });

        // Override client sendMessage method to use rate limiting
        const originalSendMessage = this.client.sendMessage.bind(this.client);
        this.client.sendMessage = async (chatId, content, options) => {
            return await this.rateLimiter.queueRequest(
                () => originalSendMessage(chatId, content, options),
                chatId,
                1 // Normal priority
            );
        };

        // Add rate-limited reply method
        this.client.sendMessageWithRateLimit = async (chatId, content, options = {}) => {
            try {
                return await this.rateLimiter.queueRequest(
                    () => originalSendMessage(chatId, content, options),
                    chatId,
                    options.priority || 1
                );
            } catch (error) {
                log(`❌ Failed to send message: ${error.message}`, 'error');
                throw error;
            }
        };

        // Group events - Updated for whatsapp-web.js v1.31.0
        this.client.on('group_join', async (notification) => {
            console.log('Group join event:', notification);
            
            // Handle welcome event
            if (this.events.has('welcome')) {
                const welcomeEvent = this.events.get('welcome');
                
                // Check if bot was added
                const botId = this.client.info.wid._serialized;
                if (notification.recipientIds && notification.recipientIds.includes(botId)) {
                    const chat = await this.client.getChatById(notification.chatId);
                    await welcomeEvent.onBotAdded(this.client, chat);
                } else {
                    // New members added
                    await welcomeEvent.onMembersAdded(this.client, notification);
                }
            }
            
            // Legacy join event handler
            if (this.events.has('join')) {
                await this.events.get('join').execute(this.client, notification);
            }
        });

        this.client.on('group_leave', async (notification) => {
            console.log('Group leave event:', notification);
            if (this.events.has('leave')) {
                await this.events.get('leave').execute(this.client, notification);
            }
        });
        
        // Additional group events for better compatibility
        this.client.on('group-participants-update', async (update) => {
            console.log('Group participants update:', update);
            
            if (update.action === 'add') {
                // Convert to notification format for compatibility
                const notification = {
                    chatId: update.id,
                    recipientIds: update.participants,
                    type: 'group_participant_add'
                };
                
                // Handle welcome event
                if (this.events.has('welcome')) {
                    const welcomeEvent = this.events.get('welcome');
                    
                    // Check if bot was added
                    const botId = this.client.info.wid._serialized;
                    if (update.participants.includes(botId)) {
                        const chat = await this.client.getChatById(update.id);
                        await welcomeEvent.onBotAdded(this.client, chat);
                    } else {
                        // New members added
                        await welcomeEvent.onMembersAdded(this.client, notification);
                    }
                }
            } else if (update.action === 'remove') {
                // Handle leave event
                const notification = {
                    chatId: update.id,
                    recipientIds: update.participants,
                    type: 'group_participant_remove'
                };
                
                if (this.events.has('leave')) {
                    await this.events.get('leave').execute(this.client, notification);
                }
            }
        });

        // Message revoke (delete)
        this.client.on('message_revoke_everyone', async (after, before) => {
            if (this.events.has('unsend')) {
                await this.events.get('unsend').execute(this.client, { after, before });
            }
        });
    }

    async handleMessage(message) {
        try {
            // Skip if bot message or status
            if (message.fromMe || message.isStatus) return;

            // Get message details
            const chat = await message.getChat();
            const contact = await message.getContact();
            const isGroup = chat.isGroup;
            const prefix = await this.getEffectivePrefix(chat.id._serialized);

            // Special handling for common commands without prefix (user convenience)
            const messageBody = message.body.trim().toLowerCase();
            const specialCommands = {
                'prefix': 'prefix',
                'help': 'help',
                'commands': 'help'
            };
            
            if (specialCommands[messageBody]) {
                const commandName = specialCommands[messageBody];
                const command = this.commands.get(commandName);
                if (command) {
                    try {
                        await command.onStart({
                            message,
                            args: messageBody === 'commands' ? ['commands'] : [],
                            chat,
                            contact,
                            isGroup,
                            client: this.client,
                            config: this.config,
                            prefix,
                            rateLimiter: this.rateLimiter
                        });
                        log(`✅ Special command '${messageBody}' executed by ${contact.name || contact.number}`, 'info');
                        return;
                    } catch (error) {
                        log(`❌ Error executing special command '${messageBody}': ${error.message}`, 'error');
                        await message.reply(`❌ An error occurred while processing the ${messageBody} command.`);
                        return;
                    }
                }
            }

            // Check if message starts with prefix
            if (!message.body.startsWith(prefix)) {
                // Handle non-command messages if needed
                if (this.events.has('message')) {
                    await this.events.get('message').execute(this.client, message, { chat, contact, isGroup });
                }
                
                // Check for onChat handlers in commands
                for (const [, command] of this.commands) {
                    if (command.onChat) {
                        try {
                            await command.onChat({ message, client: this.client, config: this.config, chat, contact, isGroup });
                        } catch (error) {
                            log(`❌ Error in onChat for ${command.config.name}: ${error.message}`, 'error');
                        }
                    }
                }
                return;
            }

            // Parse command
            const args = message.body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Get command
            const command = this.commands.get(commandName);
            if (!command) {
                if (!this.config.hideNotiMessage.commandNotFound) {
                    await message.reply(`>🎀\n𝐓𝐡𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 "${commandName}" 𝐝𝐨𝐞𝐬 𝐧𝐨𝐭 𝐞𝐱𝐢𝐬𝐭, 𝐭𝐲𝐩𝐞 ${prefix}𝐡𝐞𝐥𝐩 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`);
                }
                return;
            }

            // Check permissions
            if (!await this.checkPermissions(command, message, chat, contact, isGroup)) {
                return;
            }

            // Check cooldown
            if (!await this.checkCooldown(command, message, contact)) {
                return;
            }

            // Execute command with rate limiting
            try {
                await command.onStart({
                    message,
                    args,
                    chat,
                    contact,
                    isGroup,
                    client: this.client,
                    config: this.config,
                    prefix,
                    rateLimiter: this.rateLimiter // Provide rate limiter to commands
                });

                // Track command usage
                await trackCommand(contact.id._serialized);

                log(`✅ Command executed: ${commandName} by ${contact.name || contact.number}`, 'info');
            } catch (cmdError) {
                if (cmdError.message && cmdError.message.includes('429')) {
                    log(`⚠️ Rate limited while executing ${commandName}, queuing retry...`, 'warning');
                    await message.reply('⏳ Too many requests. Your command will be processed shortly...');
                } else {
                    log(`❌ Error executing command ${commandName}: ${cmdError.message}`, 'error');
                    await message.reply('❌ An error occurred while processing your command.');
                }
            }

        } catch (error) {
            log(`❌ Error handling message: ${error.message}`, 'error');
            await message.reply('❌ An error occurred while processing your command.');
        }
    }

    async checkPermissions(command, message, chat, contact, isGroup) {
        const userRole = await this.getUserRole(contact, chat, isGroup);
        
        if (command.config.role > userRole) {
            const roleNames = ['User', 'Group Admin', 'Bot Owner'];
            await message.reply(`❌ You need ${roleNames[command.config.role]} permission to use this command.`);
            return false;
        }

        return true;
    }

    async checkCooldown(command, message, contact) {
        const cooldownKey = `${command.config.name}-${contact.id._serialized}`;
        const cooldownTime = command.config.coolDown * 1000;
        
        if (this.cooldowns.has(cooldownKey)) {
            const expirationTime = this.cooldowns.get(cooldownKey) + cooldownTime;
            
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                await message.reply(`⏰ Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`);
                return false;
            }
        }

        this.cooldowns.set(cooldownKey, Date.now());
        return true;
    }

    async getUserRole(contact, chat, isGroup) {
        // Check if bot owner
        if (this.config.adminBot.includes(contact.id._serialized)) {
            return 2;
        }

        // Check if group admin
        if (isGroup) {
            const participants = chat.participants;
            const participant = participants.find(p => p.id._serialized === contact.id._serialized);
            if (participant && participant.isAdmin) {
                return 1;
            }
        }

        return 0; // Regular user
    }

    async getEffectivePrefix(chatId) {
        try {
            const dbPath = path.join(__dirname, 'data', 'chat-prefixes.json');
            
            if (await fsExtra.pathExists(dbPath)) {
                const data = await fsExtra.readJSON(dbPath);
                return data[chatId] || this.config.bot.prefix;
            }
            return this.config.bot.prefix;
        } catch (error) {
            log(`⚠️ Error getting effective prefix: ${error.message}`, 'warning');
            return this.config.bot.prefix;
        }
    }

    async loadCommands() {
        const commands = await loadCommands();
        this.commands = commands;
        this.client.commands = commands; // Make commands accessible through client
        log(`📋 Loaded ${commands.size} commands`, 'info');
    }

    async loadEvents() {
        const events = await loadEvents();
        this.events = events;
        log(`🎉 Loaded ${events.size} events`, 'info');
    }

    setupDashboard() {
        if (!this.config.dashBoard.enabled) return;

        const app = express();
        const server = http.createServer(app);
        const io = socketIo(server);

        app.use(express.static('public'));
        app.use(express.json());

        app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp Bot Dashboard</title>
                    <script src="/socket.io/socket.io.js"></script>
                </head>
                <body>
                    <h1>🐐 WhatsApp Bot V2 Dashboard</h1>
                    <div id="status">Connecting...</div>
                    <div id="uptime"></div>
                    <div id="commands"></div>
                    <div id="rateLimiter"></div>
                    <script>
                        const socket = io();
                        socket.on('status', (data) => {
                            document.getElementById('status').innerHTML = data.status;
                            document.getElementById('uptime').innerHTML = 'Uptime: ' + data.uptime;
                            document.getElementById('commands').innerHTML = 'Commands: ' + data.commandCount;
                            
                            if (data.rateLimiter) {
                                const rl = data.rateLimiter;
                                document.getElementById('rateLimiter').innerHTML = 
                                    \`Rate Limiter: Queue: \${rl.queuedRequests} | Active: \${rl.activeRequests} | Processing: \${rl.isProcessing ? 'Yes' : 'No'}\`;
                            }
                        });
                    </script>
                </body>
                </html>
            `);
        });

        io.on('connection', (socket) => {
            const sendStatus = () => {
                const rateLimiterStats = this.rateLimiter.getStats();
                socket.emit('status', {
                    status: this.client.info ? '🟢 Connected' : '🔴 Disconnected',
                    uptime: formatUptime(Date.now() - this.startTime),
                    commandCount: this.commands.size,
                    rateLimiter: {
                        queuedRequests: rateLimiterStats.queuedRequests,
                        activeRequests: rateLimiterStats.activeRequests,
                        isProcessing: rateLimiterStats.isProcessing
                    }
                });
            };
            
            sendStatus();
            
            // Send updates every 5 seconds
            const interval = setInterval(sendStatus, 5000);
            socket.on('disconnect', () => clearInterval(interval));
        });

        server.listen(this.config.dashBoard.port, () => {
            log(`📊 Dashboard available at http://localhost:${this.config.dashBoard.port}`, 'info');
        });
    }

    setupAutoTasks() {
        // Auto restart
        if (this.config.autoRestart.enabled) {
            cron.schedule(this.config.autoRestart.schedule || '0 2 * * *', () => {
                log('🔄 Scheduled restart initiated', 'info');
                process.exit(0);
            });
        }

        // Uptime monitoring
        if (this.config.autoUptime.enabled) {
            setInterval(() => {
                const uptime = formatUptime(Date.now() - this.startTime);
                log(`⏰ Bot uptime: ${uptime}`, 'info');
            }, this.config.autoUptime.interval || 3600000);
        }
    }

    async checkRestartNotification() {
        try {
            const restartCommand = this.commands.get('restart');
            if (restartCommand && typeof restartCommand.checkRestart === 'function') {
                await restartCommand.checkRestart(this.client);
            }
        } catch (error) {
            log(`⚠️ Error checking restart notification: ${error.message}`, 'warning');
        }
    }
}

// Initialize and start bot
const bot = new WhatsAppBot();
bot.initialize();

// Handle process termination
process.on('SIGINT', () => {
    log('👋 Bot shutting down...', 'info');
    process.exit(0);
});
