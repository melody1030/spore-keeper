// Game state, derived stats, and save/load.

let state = null;

function newState() {
  const upgrades = {};
  for (const u of UPGRADES) upgrades[u.id] = 0;
  return {
    version: CONFIG.saveVersion,
    spores: 0,
    totalEarned: 0,
    upgrades,
    whispersSeen: [],
    lastSave: Date.now(),
  };
}

function totalPuffsOwned(s) {
  let n = 0;
  for (const u of UPGRADES) if (u.isPuff) n += s.upgrades[u.id] || 0;
  return n;
}

function totalUpgradesOwned(s) {
  let n = 0;
  for (const u of UPGRADES) n += s.upgrades[u.id] || 0;
  return n;
}

function upgradeCost(u, s) {
  const owned = s.upgrades[u.id] || 0;
  if (!u.repeatable && owned >= 1) return Infinity;
  return Math.ceil(u.baseCost * Math.pow(u.costMult || 1, owned));
}

function prodMultiplier(s) {
  let mult = 1;
  for (const u of UPGRADES) {
    if (u.prodMult && s.upgrades[u.id] >= 1) mult *= u.prodMult;
  }
  if (s.upgrades.sporeSong >= 1) mult *= 1 + 0.01 * totalPuffsOwned(s);
  return mult;
}

function sporesPerSec(s) {
  let base = 0;
  for (const u of UPGRADES) {
    if (u.sps) base += u.sps * (s.upgrades[u.id] || 0);
  }
  return base * prodMultiplier(s);
}

function sporesPerClick(s) {
  let base = 1;
  for (const u of UPGRADES) {
    if (u.clickAdd) base += u.clickAdd * (s.upgrades[u.id] || 0);
  }
  let mult = 1;
  for (const u of UPGRADES) {
    if (u.clickMult && s.upgrades[u.id] >= 1) mult *= u.clickMult;
  }
  if (s.upgrades.sporeSong >= 1) mult *= 1 + 0.01 * totalPuffsOwned(s);
  return base * mult;
}

function offlineCapMs(s) {
  const hours = s.upgrades.deepRoots >= 1
    ? CONFIG.offlineCapHoursDeepRoots
    : CONFIG.offlineCapHours;
  return hours * 3600 * 1000;
}

function addSpores(amount) {
  state.spores += amount;
  state.totalEarned += amount;
}

// ---- persistence ----

function saveGame() {
  state.lastSave = Date.now();
  try {
    localStorage.setItem(CONFIG.saveKey, JSON.stringify(state));
  } catch (e) { /* storage unavailable (private mode etc.) — play session-only */ }
}

// Returns offline earnings, or 0.
function loadGame() {
  let raw = null;
  try {
    raw = localStorage.getItem(CONFIG.saveKey);
  } catch (e) { /* ignore */ }

  if (!raw) {
    state = newState();
    return 0;
  }

  try {
    state = migrateSave(JSON.parse(raw));
  } catch (e) {
    state = newState();
    return 0;
  }

  const elapsed = Math.min(Math.max(Date.now() - state.lastSave, 0), offlineCapMs(state));
  const earned = (elapsed / 1000) * sporesPerSec(state);
  if (earned > 0) addSpores(earned);
  return earned;
}

function migrateSave(loaded) {
  const fresh = newState();
  const s = Object.assign(fresh, loaded);
  // Ensure any upgrades added in newer versions exist in old saves.
  for (const u of UPGRADES) {
    if (typeof s.upgrades[u.id] !== "number") s.upgrades[u.id] = 0;
  }
  s.version = CONFIG.saveVersion;
  return s;
}

function exportSave() {
  saveGame();
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

function importSave(text) {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(text.trim()))));
    if (typeof parsed.spores !== "number" || typeof parsed.upgrades !== "object") return false;
    state = migrateSave(parsed);
    saveGame();
    return true;
  } catch (e) {
    return false;
  }
}

function resetGame() {
  state = newState();
  saveGame();
}
