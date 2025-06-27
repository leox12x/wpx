const fs = require('fs');
const path = require('path');

// Syntax checker for command files
function checkCommandSyntax() {
    const commandsPath = path.join(__dirname, 'commands');
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    console.log('🔍 Checking command files for syntax errors...\n');
    
    let errorCount = 0;
    
    for (const file of files) {
        try {
            const filePath = path.join(commandsPath, file);
            
            // Clear require cache to ensure fresh load
            delete require.cache[require.resolve(filePath)];
            
            // Try to require the file
            const command = require(filePath);
            
            // Validate command structure
            if (!command.config) {
                console.log(`⚠️  ${file}: Missing config object`);
                errorCount++;
                continue;
            }
            
            if (!command.config.name) {
                console.log(`⚠️  ${file}: Missing config.name`);
                errorCount++;
                continue;
            }
            
            if (!command.onStart || typeof command.onStart !== 'function') {
                console.log(`⚠️  ${file}: Missing or invalid onStart function`);
                errorCount++;
                continue;
            }
            
            console.log(`✅ ${file}: OK`);
            
        } catch (error) {
            console.log(`❌ ${file}: SYNTAX ERROR`);
            console.log(`   Error: ${error.message}`);
            if (error.stack) {
                const stackLines = error.stack.split('\n').slice(0, 3);
                stackLines.forEach(line => console.log(`   ${line}`));
            }
            console.log('');
            errorCount++;
        }
    }
    
    console.log(`\n📊 Summary: ${files.length - errorCount}/${files.length} commands passed syntax check`);
    
    if (errorCount > 0) {
        console.log(`\n🚨 Found ${errorCount} problematic files. Fix these to resolve the bot error.`);
        return false;
    } else {
        console.log('\n✅ All command files have valid syntax!');
        return true;
    }
}

// Run the checker
checkCommandSyntax();