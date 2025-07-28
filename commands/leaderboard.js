const { getAllUserData } = require("../scripts/helpers");

module.exports = {
  config: {
    name: "top",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "economy",
    guide: {
      en: "Use `{pn}` or `{pn} bal` to view richest users, `{pn} exp` to view top EXP users"
    }
  },

  onStart: async function ({ args, message }) {
    try {
      const type = args[0]?.toLowerCase() || "bal";
      const allUsers = await getAllUserData();

      if (type === "exp") {
        const usersWithExp = allUsers.filter(user => user.exp > 0);
        if (usersWithExp.length === 0) return message.reply("❌ No users with EXP found.");

        const topExp = usersWithExp.sort((a, b) => b.exp - a.exp).slice(0, 15);
        const medals = ["🥇", "🥈", "🥉"];
        const topList = topExp.map((user, index) => {
          const rank = index < 3 ? medals[index] : toBoldNumbers(index + 1);
          const name = toBoldUnicode(user.name || "Unknown");
          return `${rank}. ${name}: ${formatNumber(user.exp)} EXP`;
        });

        return message.reply(`👑 𝗧𝗢𝗣 𝟏𝟓 𝗘𝗫𝗣 𝗨𝗦𝗘𝗥𝗦:\n\n${topList.join("\n")}`);
      }

      // Default: bal
      const usersWithCoins = allUsers.filter(user => user.coins > 0);
      if (usersWithCoins.length === 0) return message.reply("❌ No users with coins found.");

      const topCoins = usersWithCoins.sort((a, b) => b.coins - a.coins).slice(0, 15);
      const medals = ["🥇", "🥈", "🥉"];
      const topList = topCoins.map((user, index) => {
        const rank = index < 3 ? medals[index] : toBoldNumbers(index + 1);
        const name = toBoldUnicode(user.name || "Unknown");
        return `${rank}. ${name}: ${formatNumber(user.coins)}$`;
      });

      return message.reply(`👑 | 𝐓𝐨𝐩 𝟏𝟓 𝐑𝐢𝐜𝐡𝐞𝐬𝐭 𝐔𝐬𝐞𝐫𝐬:\n\n${topList.join("\n")}`);

    } catch (err) {
      console.error(err);
      message.reply("❌ An error occurred while fetching the leaderboard.");
    }
  }
};

// Format large numbers
function formatNumber(num) {
  const units = ["", "𝐊", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}

// Convert number to bold
function toBoldNumbers(number) {
  const bold = { "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗" };
  return number.toString().split('').map(c => bold[c] || c).join('');
}

// Convert name to bold Unicode
function toBoldUnicode(text) {
  const bold = {
    "a": "𝐚", "b": "𝐛", "c": "𝐜", "d": "𝐝", "e": "𝐞", "f": "𝐟", "g": "𝐠", "h": "𝐡", "i": "𝐢", "j": "𝐣",
    "k": "𝐤", "l": "𝐥", "m": "𝐦", "n": "𝐧", "o": "𝐨", "p": "𝐩", "q": "𝐪", "r": "𝐫", "s": "𝐬", "t": "𝐭",
    "u": "𝐮", "v": "𝐯", "w": "𝐰", "x": "𝐱", "y": "𝐲", "z": "𝐳",
    "A": "𝐀", "B": "𝐁", "C": "𝐂", "D": "𝐃", "E": "𝐄", "F": "𝐅", "G": "𝐆", "H": "𝐇", "I": "𝐈", "J": "𝐉",
    "K": "𝐊", "L": "𝐋", "M": "𝐌", "N": "𝐍", "O": "𝐎", "P": "𝐏", "Q": "𝐐", "R": "𝐑", "S": "𝐒", "T": "𝐓",
    "U": "𝐔", "V": "𝐕", "W": "𝐖", "X": "𝐗", "Y": "𝐘", "Z": "𝐙", " ": " ", "'": "'", ",": ",", ".": ".", "-": "-"
  };
  return text.split('').map(c => bold[c] || c).join('');
}
