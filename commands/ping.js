module.exports = {
    config: {
        name: "ping",
        aliases: ["pong"],
        version: "1.1",
        author: "Rahaman Leon",
        coolDown: 3,
        role: 0,
        description: "Check bot response time",
        category: "utility",
        guide: {
            en: "Use {prefix}ping to check bot response time"
        }
    },

    onStart: async function ({ message }) {
        try {
            const startTime = Date.now();
            
            // Send initial ping message
            await message.reply("🏓 Pinging...");
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // Send final ping result
            const responseText = [
                "🏓Pong!",
                "",
                `⚡Response Time: ${responseTime}ms`,
                "🤖Bot Status: Online",
                "📡Connection: Stable"
            ].join('\n');
            
            await message.reply(responseText);

        } catch (error) {
            console.error("Ping command error:", error);
            await message.reply("❌ Failed to ping. Bot may be experiencing issues.");
        }
    }
};
