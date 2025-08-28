// commands/cmd.js
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { log } = global.utils;

const COMMANDS_DIR = path.join(__dirname);

function isURL(str) {
  try { new URL(str); return true; } catch { return false; }
}

// Load a command
async function loadCommand(fileName, rawCode) {
  try {
    const filePath = path.join(COMMANDS_DIR, fileName.endsWith(".js") ? fileName : `${fileName}.js`);

    if (rawCode) fs.writeFileSync(filePath, rawCode);

    if (!fs.existsSync(filePath)) throw new Error("Command file not found");

    // Auto install npm packages
    const content = fs.readFileSync(filePath, "utf-8");
    const packages = [...content.matchAll(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g)]
      .map(m => m[1]).filter(p => !p.startsWith("."));

    for (let pkg of packages) {
      const basePkg = pkg.split("/")[0];
      if (!fs.existsSync(`node_modules/${basePkg}`)) {
        try { require("child_process").execSync(`npm i ${basePkg} --save`); log(`Installed package ${basePkg}`); } catch {}
      }
    }

    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);

    if (!command.config?.name || typeof command.onStart !== "function") throw new Error("Invalid command structure");

    // Register command
    global.GoatBot.commands.set(command.config.name.toLowerCase(), command);
    if (command.config.aliases) command.config.aliases.forEach(a => global.GoatBot.aliases.set(a.toLowerCase(), command.config.name.toLowerCase()));

    return { status: "success", name: command.config.name };
  } catch (err) {
    return { status: "failed", name: fileName, error: err };
  }
}

// Unload a command
function unloadCommand(fileName) {
  try {
    const filePath = path.join(COMMANDS_DIR, fileName.endsWith(".js") ? fileName : `${fileName}.js`);
    if (!fs.existsSync(filePath)) throw new Error("Command file not found");

    const command = require(filePath);
    if (command.config.aliases) command.config.aliases.forEach(a => global.GoatBot.aliases.delete(a));
    global.GoatBot.commands.delete(command.config.name);

    delete require.cache[require.resolve(filePath)];
    return { status: "success", name: command.config.name };
  } catch (err) {
    return { status: "failed", name: fileName, error: err };
  }
}

module.exports = {
  config: {
    name: "cmd2",
    version: "2.1",
    role: 2,
    description: "Manage commands",
    guide: "{pn} load <cmd>, {pn} unload <cmd>, {pn} install <url/file> <name>"
  },

  onStart: async function({ args, message }) {
    if (!args[0]) return message.reply("⚠️ Subcommand missing");

    const sub = args[0].toLowerCase();

    if (sub === "load" && args[1]) {
      const info = await loadCommand(args[1]);
      return message.reply(info.status === "success" ? `✅ Loaded ${info.name}` : `❌ Failed: ${info.error.message}`);
    }

    if (sub === "unload" && args[1]) {
      const info = unloadCommand(args[1]);
      return message.reply(info.status === "success" ? `✅ Unloaded ${info.name}` : `❌ Failed: ${info.error.message}`);
    }

    if (sub === "install" && args[1] && args[2]) {
      let url = args[1], fileName = args[2];
      if (!isURL(url)) return message.reply("⚠️ URL required");

      try {
        const res = await axios.get(url);
        const info = await loadCommand(fileName, res.data);
        return message.reply(info.status === "success" ? `✅ Installed ${info.name}` : `❌ Failed to install`);
      } catch {
        return message.reply("⚠️ Invalid URL or failed to fetch");
      }
    }

    return message.reply("⚠️ Invalid subcommand. Use: load, unload, install");
  }
};
