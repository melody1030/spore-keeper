// Spore Keeper — all tuning numbers live here.
// Balance rule of thumb: repeatable cost = baseCost * costMult^owned.

const CONFIG = {
  saveKey: "sporeKeeperSave",
  saveVersion: 1,
  autosaveMs: 15000,
  logicTickMs: 100,
  offlineCapHours: 8,
  offlineCapHoursDeepRoots: 12,
};

const UPGRADES = [
  {
    id: "gloves",
    name: "Glowing Gloves",
    desc: "+1 spore per tap",
    baseCost: 15,
    costMult: 1.15,
    repeatable: true,
    clickAdd: 1,
  },
  {
    id: "sleepyPuff",
    name: "Sleepy Puff",
    desc: "A drowsy helper. +0.5 spores/sec",
    baseCost: 25,
    costMult: 1.15,
    repeatable: true,
    sps: 0.5,
    isPuff: true,
  },
  {
    id: "puffChoir",
    name: "Puff Choir",
    desc: "They hum while they work. +3 spores/sec",
    baseCost: 400,
    costMult: 1.17,
    repeatable: true,
    sps: 3,
    isPuff: true,
  },
  {
    id: "elderPuff",
    name: "Elder Puff",
    desc: "Wise and mossy. +10 spores/sec",
    baseCost: 5000,
    costMult: 1.2,
    repeatable: true,
    sps: 10,
    isPuff: true,
  },
  {
    id: "fireflyLantern",
    name: "Firefly Lantern",
    desc: "Tap power ×2",
    baseCost: 10000,
    repeatable: false,
    clickMult: 2,
  },
  {
    id: "morningDew",
    name: "Morning Dew",
    desc: "All spore production ×2",
    baseCost: 25000,
    repeatable: false,
    prodMult: 2,
  },
  {
    id: "deepRoots",
    name: "Deep Roots",
    desc: "Offline gathering cap 8h → 12h",
    baseCost: 150000,
    repeatable: false,
  },
  {
    id: "sporeSong",
    name: "Spore Song",
    desc: "+1% production for every Puff you own",
    baseCost: 500000,
    repeatable: false,
  },
  {
    id: "moonBloom",
    name: "Moon Bloom",
    desc: "All spore production ×3",
    baseCost: 5000000,
    repeatable: false,
    prodMult: 3,
  },
  {
    id: "mothersBlessing",
    name: "Mother's Blessing",
    desc: "Rekindle the grove and wake the Mother Mushroom",
    baseCost: 100000000,
    repeatable: false,
  },
];

// Story "grove whispers" — shown once each when their condition first becomes true.
const WHISPERS = [
  {
    id: "intro",
    check: (s) => true,
    text: "The Everglow Forest is dark. Mycel, last spore of the Mother Mushroom, begins to gather the scattered light…",
  },
  {
    id: "firstUpgrade",
    check: (s) => totalUpgradesOwned(s) >= 1,
    text: "A faint warmth returns to Mycel's hands. The forest notices.",
  },
  {
    id: "firstPuff",
    check: (s) => totalPuffsOwned(s) >= 1,
    text: "A sleepy Puff blinks awake and toddles after Mycel. You are not alone anymore.",
  },
  {
    id: "thousand",
    check: (s) => s.totalEarned >= 1000,
    text: "The moss underfoot glows softly where Mycel walks. The grove remembers light.",
  },
  {
    id: "hundredK",
    check: (s) => s.totalEarned >= 100000,
    text: "Deep below, something vast breathes slower… and warmer. The Mother Mushroom is dreaming of you.",
  },
  {
    id: "million",
    check: (s) => s.totalEarned >= 1000000,
    text: "Fireflies spiral above the canopy. The whole forest leans toward the growing glow.",
  },
  {
    id: "ending",
    check: (s) => s.upgrades.mothersBlessing >= 1,
    text: "The grove blazes with gentle light. The Mother Mushroom opens one great eye — and smiles. \"Well done, little spore.\" (The forest's dreams hold more places yet…)",
  },
];

// Grove brightness stages by total spores earned.
const BRIGHTNESS_STAGES = [0, 1000, 250000, 20000000];
