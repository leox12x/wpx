const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');

console.log(chalk.blue('🔍 WhatsApp Bot Login Diagnostic Tool'));
console.log(chalk.yellow('====================================='));

// Create a simple client for testing
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'diagnostic-test',
        dataPath: './auth_data'
    }),
    puppeteer: {
        headless: false, // Set to false to see browser for debugging
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    }
});

client.on('qr', (qr) => {
    console.log(chalk.green('📱 QR Code received! Scan it with your WhatsApp:'));
    console.log(chalk.yellow('=========================================='));
    qrcode.generate(qr, { small: true });
    console.log(chalk.yellow('=========================================='));
    console.log(chalk.cyan('💡 Tips:'));
    console.log(chalk.cyan('   1. Open WhatsApp on your phone'));
    console.log(chalk.cyan('   2. Tap Menu (⋮) > Linked Devices'));
    console.log(chalk.cyan('   3. Tap "Link a Device"'));
    console.log(chalk.cyan('   4. Scan the QR code above'));
});

client.on('authenticated', () => {
    console.log(chalk.green('✅ Authentication successful!'));
});

client.on('auth_failure', (msg) => {
    console.log(chalk.red('❌ Authentication failed:'), msg);
    console.log(chalk.yellow('💡 Try clearing auth_data folder and restart'));
});

client.on('ready', () => {
    console.log(chalk.green('🎉 WhatsApp client is ready!'));
    console.log(chalk.green(`📱 Logged in as: ${client.info.wid.user}`));
    console.log(chalk.blue('🔍 Diagnostic completed successfully!'));
    
    // Test sending a message to yourself
    setTimeout(() => {
        console.log(chalk.yellow('🧪 Running connection test...'));
        client.sendMessage(client.info.wid._serialized, '🤖 Bot diagnostic test successful!')
            .then(() => {
                console.log(chalk.green('✅ Test message sent successfully!'));
                process.exit(0);
            })
            .catch((err) => {
                console.log(chalk.red('❌ Failed to send test message:'), err.message);
                process.exit(1);
            });
    }, 3000);
});

client.on('disconnected', (reason) => {
    console.log(chalk.red('📴 Client disconnected:'), reason);
});

// Error handling
process.on('unhandledRejection', (err) => {
    console.log(chalk.red('❌ Unhandled Promise Rejection:'), err);
});

process.on('uncaughtException', (err) => {
    console.log(chalk.red('❌ Uncaught Exception:'), err);
});

console.log(chalk.blue('🚀 Starting diagnostic client...'));
client.initialize().catch((err) => {
    console.log(chalk.red('❌ Failed to initialize client:'), err);
});

// Timeout after 2 minutes
setTimeout(() => {
    console.log(chalk.yellow('⏰ Diagnostic timeout reached (2 minutes)'));
    console.log(chalk.red('❌ Login failed - please check your setup'));
    process.exit(1);
}, 120000);
