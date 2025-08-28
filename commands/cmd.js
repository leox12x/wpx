// cmd.js - WhatsApp Bot Command Loader
// Author: NTKhang | Fixed & Optimized by Rahaman Leon

const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { configCommands } = global.GoatBot;
const { log } = global.utils;

// === PATHS ===
const COMMANDS_DIR = path.resolve(__dirname); // Commands folder
const SCRIPTS_DIR = path.resolve(__dirname, "..", "scripts", "cmds"); // Backup scripts folder

// === HELPERS ===
function getDomain(url) {
  const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im);
  return match ? match[1] : null;
}

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// === LOAD SCRIPT ===
function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode) {
  const storageCommandFilesPath = global.GoatBot[folder === "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];
  try {
    let pathCommand;

    // If installing from raw code
    if (rawCode) {
      if (!fileName.endsWith(".js")) fileName += ".js";
      pathCommand = path.join(COMMANDS_DIR, fileName);
      fs.writeFileSync(pathCommand, rawCode);
    } else {
      const commandsPath = path.join(COMMANDS_DIR, `${fileName}.js`);
      const scriptsPath = fs.existsSync(SCRIPTS_DIR) ? path.join(SCRIPTS_DIR, `${fileName}.js`) : null;

      if (fs.existsSync(commandsPath)) {
        pathCommand = commandsPath;
      } else if (scriptsPath && fs.existsSync(scriptsPath)) {
        pathCommand = scriptsPath;
      } else {
        throw new Error(`Command file "${fileName}.js" not found.`);
      }
    }

    // === Auto Install Missing Packages ===
    const regExpCheckPackage = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    const contentFile = fs.readFileSync(pathCommand, "utf8");
    let allPackage = [...contentFile.matchAll(regExpCheckPackage)].map(m => m[1]);

    allPackage = allPackage.filter(p => !p.startsWith("./") && !p.startsWith("../") && !p.startsWith("/"));

    for (let packageName of allPackage) {
      if (packageName.startsWith("@")) {
        packageName = packageName.split("/").slice(0, 2).join("/");
      } else {
        packageName = packageName.split("/")[0];
      }
      if (!fs.existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
        try {
          execSync(`npm install ${packageName} --save`, { stdio: "pipe" });
          log.info("PACKAGE", `Installed ${packageName}`);
        } catch {
          log.warn("PACKAGE", `Failed to install ${packageName}`);
        }
      }
    }

    // === Clear Cache & Require Fresh ===
    delete require.cache[require.resolve(pathCommand)];
    const command = require(pathCommand);
    command.location = pathCommand;

    // === Validate Command ===
    const configCommand = command.config;
    if (!configCommand || typeof configCommand !== "object") throw new Error("config must be an object");
    if (!configCommand.name) throw new Error("Command name is missing");
    if (typeof command.onStart !== "function") throw new Error("onStart function is missing");

    // === Register Command & Aliases ===
    const scriptName = configCommand.name;
    const setMap = folder === "cmds" ? "commands" : "eventCommands";
    global.GoatBot[setMap].set(scriptName, command);

    if (configCommand.aliases) {
      let aliases = Array.isArray(configCommand.aliases) ? configCommand.aliases : [configCommand.aliases];
      for (const alias of aliases) {
        global.GoatBot.aliases.set(alias, scriptName);
        if (global.client?.commands) global.client.commands.set(alias.toLowerCase(), command);
      }
    }

    if (global.client?.commands) {
      global.client.commands.set(scriptName.toLowerCase(), command);
    }

    // === Run onLoad if Available ===
    if (typeof command.onLoad === "function") {
      try {
        command.onLoad({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData });
      } catch (err) {
        log.warn("onLoad", `Command ${scriptName} failed: ${err.message}`);
      }
    }

    // === Update Command Storage ===
    const idx = storageCommandFilesPath.findIndex(item => item.filePath === pathCommand);
    if (idx !== -1) storageCommandFilesPath.splice(idx, 1);
    storageCommandFilesPath.push({ filePath: pathCommand, commandName: [scriptName, ...(configCommand.aliases || [])] });

    if (global.client?.dirConfigCommands) {
      fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
    }

    return { status: "success", name: fileName, command };

  } catch (err) {
    return { status: "failed", name: fileName, error: err };
  }
}

// === UNLOAD SCRIPT ===
function unloadScripts(folder, fileName, configCommands, getLang) {
  try {
    const commandsPath = path.join(COMMANDS_DIR, `${fileName}.js`);
    const scriptsPath = fs.existsSync(SCRIPTS_DIR) ? path.join(SCRIPTS_DIR, `${fileName}.js`) : null;
    let pathCommand = fs.existsSync(commandsPath) ? commandsPath : scriptsPath;

    if (!pathCommand || !fs.existsSync(pathCommand)) {
      throw new Error(getLang?.("missingFile", fileName) || `Command "${fileName}" not found`);
    }

    const command = require(pathCommand);
    const commandName = command.config?.name;
    if (!commandName) throw new Error("Invalid command config");

    // Remove aliases
    if (command.config.aliases) {
      let aliases = Array.isArray(command.config.aliases) ? command.config.aliases : [command.config.aliases];
      for (const alias of aliases) {
        global.GoatBot.aliases.delete(alias);
        global.client?.commands?.delete(alias.toLowerCase());
      }
    }

    // Remove from cache and registry
    delete require.cache[require.resolve(pathCommand)];
    const setMap = folder === "cmds" ? "commands" : "eventCommands";
    global.GoatBot[setMap].delete(commandName);
    global.client?.commands?.delete(commandName.toLowerCase());

    // Save unloaded state
    const key = folder === "cmds" ? "commandUnload" : "commandEventUnload";
    configCommands[key] = configCommands[key] || [];
    if (!configCommands[key].includes(`${fileName}.js`)) configCommands[key].push(`${fileName}.js`);

    if (global.client?.dirConfigCommands) {
      fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
    }

    return { status: "success", name: fileName };

  } catch (err) {
    return { status: "failed", name: fileName, error: err };
  }
}

// === EXPORT ===
global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;

module.exports = {
  config: {
    name: "cmd",
    version: "2.1",
    author: "NTKhang | Fixed by Rahaman Leon",
    countDown: 5,
    role: 2,
    description: "Manage command files",
    category: "owner",
    guide: "{pn} load <command>\n{pn} loadall\n{pn} unload <command>\n{pn} install <url> <filename.js>\n{pn} install <filename.js> <code>",
  },

  langs: {
    en: {
      missingFileName: "⚠️ | Enter the command name.",
      loaded: "✅ | Loaded \"%1\" successfully.",
      loadedError: "❌ | Failed to load \"%1\"\n%2: %3",
      loadedSuccess: "✅ | Loaded %1 command(s).",
      loadedFail: "❌ | Failed to load %1:\n%2",
      openConsoleToSeeError: "👀 | Check console for details.",
      unloaded: "✅ | Unloaded \"%1\" successfully.",
      unloadedError: "❌ | Failed to unload \"%1\"\n%2: %3",
      installed: "✅ | Installed \"%1\" successfully at %2",
      installedError: "❌ | Install failed for \"%1\"\n%2: %3",
      alreadExist: "⚠️ | File exists. React to overwrite.",
      invalidUrlOrCode: "⚠️ | Invalid URL or code.",
    },
  },

  // === COMMAND HANDLER ===
  onStart: async function ({ args, message, event, getLang, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, commandName }) {
    if (!getLang) getLang = (k, ...a) => (this.langs.en[k] || k).replace(/%(\d+)/g, (_, i) => a[i - 1] || "");

    // load <command>
    if (args[0] === "load" && args[1]) {
      const info = loadScripts("cmds", args[1], log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
      return message.reply(info.status === "success" ? getLang("loaded", info.name) : getLang("loadedError", info.name, info.error.name, info.error.message));
    }

    // loadall
    if (args[0]?.toLowerCase() === "loadall") {
      const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".js") && !configCommands.commandUnload?.includes(f)).map(f => f.slice(0, -3));
      const ok = [], fail = [];
      for (const f of files) {
        const info = loadScripts("cmds", f, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
        info.status === "success" ? ok.push(f) : fail.push(`❗ ${f} => ${info.error.message}`);
      }
      return message.reply(`${ok.length ? getLang("loadedSuccess", ok.length) : ""}\n${fail.length ? getLang("loadedFail", fail.length, fail.join("\n")) : ""}`);
    }

    // unload <command>
    if (args[0] === "unload" && args[1]) {
      const info = unloadScripts("cmds", args[1], configCommands, getLang);
      return message.reply(info.status === "success" ? getLang("unloaded", info.name) : getLang("unloadedError", info.name, info.error.name, info.error.message));
    }

    // install <url> <file.js>
    if (args[0] === "install") {
      let url = args[1], fileName = args[2], rawCode;

      if (!url || !fileName) return message.reply(getLang("invalidUrlOrCode"));
      if (url.endsWith(".js") && !isURL(url)) [fileName, url] = [url, fileName];

      if (isURL(url)) {
        let domain = getDomain(url);
        if (domain === "pastebin.com") url = url.replace(/\/(?!raw\/)(.*)/, "/raw/$1");
        if (domain === "github.com") url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
        try {
          const res = await axios.get(url);
          rawCode = domain === "savetext.net" ? cheerio.load(res.data)("#content").text() : res.data;
        } catch {
          return message.reply(getLang("invalidUrlOrCode"));
        }
      } else {
        rawCode = event.body.slice(event.body.indexOf("install") + 7).replace(fileName, "").trim();
        if (!rawCode) return message.reply(getLang("invalidUrlOrCode"));
      }

      const target = path.join(COMMANDS_DIR, fileName);
      if (fs.existsSync(target)) {
        return message.reply(getLang("alreadExist"), (_, info) => {
          global.GoatBot.onReaction.set(info.messageID, { 
            commandName, 
            messageID: info.messageID, 
            type: "install", 
            author: event.senderID, 
            data: { fileName, rawCode } 
          });
        });
      }

      const info = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
      return message.reply(info.status === "success" ? getLang("installed", info.name, target.replace(process.cwd(), "")) : getLang("installedError", info.name, info.error.name, info.error.message));
    }

    return message.reply("⚠️ | Invalid subcommand. Use: load, loadall, unload, install");
  },

  onReaction: async function ({ Reaction, message, event, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang }) {
    const { author, data: { fileName, rawCode } } = Reaction;
    if (event.userID !== author) return;
    const info = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
    return message.reply(info.status === "success" ? getLang("installed", info.name, path.join(COMMANDS_DIR, fileName).replace(process.cwd(), "")) : getLang("installedError", info.name, info.error.name, info.error.message));
  }
};
