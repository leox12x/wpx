const { getUserData, updateUserData } = require('../database');

/**
 * checkLimit(userId, type, max, cooldownMs)
 * type: 'slots' | 'dice' | 'roulette' (keys must match User schema)
 * returns { allowed, remaining, resetIn } where resetIn is ms
 */
async function checkLimit(userId, type, max, cooldownMs) {
  const user = await getUserData(userId);

  // Map sensible first-key names for each limiter type
  const firstKeyMap = {
    slots: 'firstSlot',
    dice: 'firstRoll',
    roulette: 'firstPlay'
  };
  const firstKey = firstKeyMap[type] || 'first';

  // Ensure target object exists
  if (!user[type]) {
    user[type] = { count: 0, [firstKey]: Date.now() };
  }

  const now = Date.now();
  const firstVal = user[type][firstKey] ? new Date(user[type][firstKey]).getTime() : 0;
  let count = user[type].count || 0;

  // reset if cooldown passed
  if (!firstVal || (now - firstVal) > cooldownMs) {
    count = 0;
    user[type][firstKey] = now;
    user[type].count = 0;
  }

  if (count >= max) {
    const resetIn = cooldownMs - (now - user[type][firstKey]);
    return { allowed: false, remaining: 0, resetIn };
  }

  // increment and save
  user[type].count = count + 1;
  await updateUserData(userId, {
    [`${type}.count`]: user[type].count,
    [`${type}.${firstKey}`]: user[type][firstKey]
  });

  const remaining = Math.max(0, max - user[type].count);
  const resetIn = cooldownMs - (now - user[type][firstKey]);

  return { allowed: true, remaining, resetIn };
}

module.exports = { checkLimit };
