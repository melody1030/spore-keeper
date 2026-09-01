// DOM rendering: counters, upgrade buttons, whispers, modals.

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi"];

function formatNum(n) {
  if (n < 1000) return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString();
  let tier = Math.floor(Math.log10(n) / 3);
  tier = Math.min(tier, SUFFIXES.length - 1);
  const scaled = n / Math.pow(1000, tier);
  return (scaled >= 100 ? scaled.toFixed(0) : scaled.toFixed(1)) + SUFFIXES[tier];
}

const ui = {
  sporeCount: null,
  sps: null,
  upgradeEls: {},   // id -> {btn, cost, count}
  whisperEl: null,
  whisperTimer: null,
};

function uiInit() {
  ui.sporeCount = document.getElementById("spore-count");
  ui.sps = document.getElementById("sps");
  ui.whisperEl = document.getElementById("whisper");

  const wrap = document.getElementById("upgrades");
  wrap.innerHTML = "";
  ui.upgradeEls = {};

  for (const u of UPGRADES) {
    const btn = document.createElement("button");
    btn.className = "upgrade";
    btn.innerHTML = `
      <div class="u-name">${u.name} <span class="u-count"></span></div>
      <div class="u-desc">${u.desc}</div>
      <div class="u-cost"></div>`;
    btn.addEventListener("click", () => buyUpgrade(u));
    wrap.appendChild(btn);
    ui.upgradeEls[u.id] = {
      btn,
      count: btn.querySelector(".u-count"),
      cost: btn.querySelector(".u-cost"),
    };
  }

  document.getElementById("btn-export").addEventListener("click", showExportModal);
  document.getElementById("btn-import").addEventListener("click", showImportModal);
  document.getElementById("btn-reset").addEventListener("click", showResetModal);
}

function buyUpgrade(u) {
  const cost = upgradeCost(u, state);
  if (state.spores < cost) return;
  state.spores -= cost;
  state.upgrades[u.id]++;
  checkWhispers();
  uiRender();
  saveGame();
}

function uiRender() {
  ui.sporeCount.textContent = formatNum(state.spores);
  ui.sps.textContent = formatNum(sporesPerSec(state)) + " / sec  ·  " + formatNum(sporesPerClick(state)) + " / tap";

  for (const u of UPGRADES) {
    const el = ui.upgradeEls[u.id];
    const owned = state.upgrades[u.id];
    const cost = upgradeCost(u, state);
    const soldOut = !u.repeatable && owned >= 1;

    el.count.textContent = u.repeatable && owned > 0 ? "×" + owned : "";
    el.cost.textContent = soldOut ? "✦ rooted in the grove" : formatNum(cost) + " spores";
    el.btn.disabled = soldOut || state.spores < cost;
    el.btn.classList.toggle("affordable", !soldOut && state.spores >= cost);
    el.btn.classList.toggle("owned", soldOut);
  }
}

// ---- story whispers ----

function checkWhispers() {
  for (const w of WHISPERS) {
    if (state.whispersSeen.includes(w.id)) continue;
    if (w.check(state)) {
      state.whispersSeen.push(w.id);
      showWhisper(w.text);
      break; // one at a time
    }
  }
}

function showWhisper(text) {
  ui.whisperEl.textContent = text;
  ui.whisperEl.classList.remove("hidden");
  clearTimeout(ui.whisperTimer);
  ui.whisperTimer = setTimeout(() => ui.whisperEl.classList.add("hidden"), 7000);
}

// ---- modals ----

function openModal({ title, body, textValue, textEditable, buttons }) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").textContent = body;
  const ta = document.getElementById("modal-text");
  if (textValue !== undefined || textEditable) {
    ta.classList.remove("hidden");
    ta.value = textValue || "";
    ta.readOnly = !textEditable;
  } else {
    ta.classList.add("hidden");
  }
  const btnWrap = document.getElementById("modal-buttons");
  btnWrap.innerHTML = "";
  for (const b of buttons) {
    const btn = document.createElement("button");
    btn.textContent = b.label;
    btn.addEventListener("click", () => {
      closeModal();
      if (b.onClick) b.onClick(ta.value);
    });
    btnWrap.appendChild(btn);
  }
  document.getElementById("modal-backdrop").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.add("hidden");
}

function showOfflineModal(earned) {
  openModal({
    title: "While you were away…",
    body: `The Puffs kept gathering in the dark. You return to find ${formatNum(earned)} Lumen Spores waiting for you.`,
    buttons: [{ label: "Collect" }],
  });
}

function showExportModal() {
  openModal({
    title: "Export Save",
    body: "Copy this code somewhere safe. Paste it into Import to restore your grove.",
    textValue: exportSave(),
    buttons: [{ label: "Done" }],
  });
}

function showImportModal() {
  openModal({
    title: "Import Save",
    body: "Paste your save code below. This replaces your current grove.",
    textValue: "",
    textEditable: true,
    buttons: [
      { label: "Cancel" },
      {
        label: "Import",
        onClick: (text) => {
          if (importSave(text)) {
            uiRender();
            showWhisper("The grove remembers…");
          } else {
            showWhisper("That save code has faded beyond reading.");
          }
        },
      },
    ],
  });
}

function showResetModal() {
  openModal({
    title: "Reset Grove",
    body: "This erases all progress and returns the forest to darkness. Are you sure?",
    buttons: [
      { label: "Cancel" },
      {
        label: "Reset Everything",
        onClick: () => {
          resetGame();
          grove.puffs = [];
          uiRender();
          checkWhispers();
        },
      },
    ],
  });
}
