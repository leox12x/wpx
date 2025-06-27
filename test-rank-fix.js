// Quick test to verify the rank command fix
const path = require('path');

// Mock the rank command functions
function getXPForLevel(level) {
    return Math.floor(Math.pow(level, 2) * 50);
}

function createProgressBar(userExp, userLevel) {
    const xpForCurrentLevel = getXPForLevel(userLevel);
    const xpForNextLevel = getXPForLevel(userLevel + 1);
    const xpProgress = Math.max(0, userExp - xpForCurrentLevel);
    const xpNeeded = Math.max(0, xpForNextLevel - userExp);

    // Create progress bar
    const progressBarLength = 10;
    const xpRange = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = xpRange > 0 ? Math.max(0, Math.min(xpProgress / xpRange, 1)) : 0;
    const filledBars = Math.max(0, Math.floor(progressPercent * progressBarLength));
    const emptyBars = Math.max(0, progressBarLength - filledBars);
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

    return {
        progressBar,
        progressPercent: Math.round(progressPercent * 100),
        xpProgress,
        xpNeeded,
        xpForCurrentLevel,
        xpForNextLevel
    };
}

// Test cases that might have caused the error
console.log('Testing rank command fix...\n');

const testCases = [
    { userExp: 0, userLevel: 1, desc: "New user with 0 XP" },
    { userExp: 25, userLevel: 1, desc: "User halfway to level 2" },
    { userExp: 50, userLevel: 2, desc: "User at exact level 2" },
    { userExp: 45, userLevel: 1, desc: "User close to level 2" },
    { userExp: 1000, userLevel: 5, desc: "High level user" },
    { userExp: 10, userLevel: 3, desc: "Edge case: low XP, high level" }
];

testCases.forEach((test, index) => {
    try {
        const result = createProgressBar(test.userExp, test.userLevel);
        console.log(`Test ${index + 1}: ${test.desc}`);
        console.log(`  XP: ${test.userExp}, Level: ${test.userLevel}`);
        console.log(`  Progress: ${result.progressBar} ${result.progressPercent}%`);
        console.log(`  Range: ${result.xpForCurrentLevel} -> ${result.xpForNextLevel}`);
        console.log(`  Progress: ${result.xpProgress}/${result.xpForNextLevel - result.xpForCurrentLevel}`);
        console.log('  ✅ SUCCESS\n');
    } catch (error) {
        console.log(`Test ${index + 1}: ${test.desc}`);
        console.log(`  ❌ ERROR: ${error.message}\n`);
    }
});

console.log('All tests completed! The fix should prevent the String.repeat(-1) error.');
