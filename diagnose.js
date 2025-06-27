const fs = require('fs-extra');
const path = require('path');

async function diagnoseBot() {
    console.log('🔍 Bot Diagnosis Starting...\n');
    
    const issues = [];
    const warnings = [];
    const info = [];
    
    try {
        // Check critical files
        const criticalFiles = [
            'index.js',
            'config.json',
            'package.json',
            'scripts/helpers.js',
            'scripts/cmdloadder.js',
            'scripts/eventsIndex.js'
        ];
        
        for (const file of criticalFiles) {
            const filePath = path.join(__dirname, file);
            if (!await fs.pathExists(filePath)) {
                issues.push(`❌ Missing critical file: ${file}`);
            } else {
                info.push(`✅ Found: ${file}`);
            }
        }
        
        // Check config.json
        try {
            const config = require('./config.json');
            
            // Check adminBot array
            if (!config.adminBot || !Array.isArray(config.adminBot)) {
                issues.push('❌ config.adminBot is not properly defined');
            } else if (config.adminBot.length === 0) {
                warnings.push('⚠️ No bot admins configured');
            } else {
                info.push(`✅ ${config.adminBot.length} bot admin(s) configured`);
            }
            
            // Check prefix
            if (!config.bot || !config.bot.prefix) {
                issues.push('❌ Bot prefix not configured');
            } else {
                info.push(`✅ Bot prefix: "${config.bot.prefix}"`);
            }
            
        } catch (error) {
            issues.push(`❌ Error reading config.json: ${error.message}`);
        }
        
        // Check commands directory
        const commandsPath = path.join(__dirname, 'commands');
        if (!await fs.pathExists(commandsPath)) {
            issues.push('❌ Commands directory not found');
        } else {
            const files = await fs.readdir(commandsPath);
            const jsFiles = files.filter(f => f.endsWith('.js'));
            info.push(`✅ Found ${jsFiles.length} command files`);
            
            // Check bot2.js specifically
            if (jsFiles.includes('bot2.js')) {
                info.push('✅ bot2.js found');
                
                // Try to load bot2.js
                try {
                    const bot2Path = path.join(commandsPath, 'bot2.js');
                    delete require.cache[require.resolve(bot2Path)];
                    const bot2 = require(bot2Path);
                    
                    if (!bot2.config) {
                        issues.push('❌ bot2.js: Missing config object');
                    } else {
                        if (!bot2.config.name) issues.push('❌ bot2.js: Missing config.name');
                        if (!bot2.config.aliases) warnings.push('⚠️ bot2.js: No aliases defined');
                        else info.push(`✅ bot2.js: ${bot2.config.aliases.length} aliases`);
                    }
                    
                    if (!bot2.onStart) {
                        issues.push('❌ bot2.js: Missing onStart function');
                    } else {
                        info.push('✅ bot2.js: onStart function exists');
                    }
                    
                    if (!bot2.onChat) {
                        warnings.push('⚠️ bot2.js: Missing onChat function (may affect functionality)');
                    } else {
                        info.push('✅ bot2.js: onChat function exists');
                    }
                    
                } catch (error) {
                    issues.push(`❌ bot2.js: Load error - ${error.message}`);
                }
            } else {
                issues.push('❌ bot2.js not found in commands directory');
            }
        }
        
        // Check events directory
        const eventsPath = path.join(__dirname, 'events');
        if (!await fs.pathExists(eventsPath)) {
            warnings.push('⚠️ Events directory not found');
        } else {
            const files = await fs.readdir(eventsPath);
            const jsFiles = files.filter(f => f.endsWith('.js'));
            info.push(`✅ Found ${jsFiles.length} event files`);
        }
        
        // Check package.json dependencies
        try {
            const pkg = require('./package.json');
            const requiredDeps = ['whatsapp-web.js', 'axios', 'fs-extra', 'chalk', 'moment'];
            const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);
            
            if (missingDeps.length > 0) {
                issues.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
            } else {
                info.push('✅ All required dependencies found');
            }
        } catch (error) {
            issues.push(`❌ Error reading package.json: ${error.message}`);
        }
        
        // Check for common issues
        if (await fs.pathExists('./auth_data')) {
            info.push('✅ Auth data directory exists');
        } else {
            warnings.push('⚠️ Auth data directory not found (first run?)');
        }
        
        if (await fs.pathExists('./data')) {
            info.push('✅ Data directory exists');
        } else {
            warnings.push('⚠️ Data directory not found');
        }
        
        // Check node_modules
        if (await fs.pathExists('./node_modules')) {
            info.push('✅ Node modules installed');
        } else {
            issues.push('❌ Node modules not found - run npm install');
        }
        
    } catch (error) {
        issues.push(`❌ Diagnosis error: ${error.message}`);
    }
    
    // Display results
    console.log('📊 DIAGNOSIS RESULTS:\n');
    
    if (issues.length > 0) {
        console.log('🚨 CRITICAL ISSUES:');
        issues.forEach(issue => console.log(issue));
        console.log('');
    }
    
    if (warnings.length > 0) {
        console.log('⚠️ WARNINGS:');
        warnings.forEach(warning => console.log(warning));
        console.log('');
    }
    
    if (info.length > 0) {
        console.log('ℹ️ INFO:');
        info.forEach(i => console.log(i));
        console.log('');
    }
    
    console.log('🔧 RECOMMENDATIONS:');
    
    if (issues.length > 0) {
        console.log('1. Fix all critical issues above before running the bot');
    }
    
    if (warnings.some(w => w.includes('Auth data'))) {
        console.log('2. First time setup: Run the bot and scan QR code');
    }
    
    console.log('3. Ensure all dependencies are installed: npm install');
    console.log('4. Check that your WhatsApp is connected to internet');
    console.log('5. Make sure port 3000 is available for dashboard');
    
    if (issues.length === 0) {
        console.log('\n✅ No critical issues found! Bot should work properly.');
    } else {
        console.log(`\n❌ Found ${issues.length} critical issue(s) that need fixing.`);
    }
}

diagnoseBot().catch(console.error);
