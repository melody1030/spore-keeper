// Main loop: logic tick (time-delta based), render loop, autosave.

let lastLogicTime = Date.now();

function logicTick() {
  const now = Date.now();
  const dt = (now - lastLogicTime) / 1000; // seconds — accurate even in throttled tabs
  lastLogicTime = now;

  const gain = sporesPerSec(state) * dt;
  if (gain > 0) addSpores(gain);

  checkWhispers();
  uiRender();
}

function renderLoop() {
  groveRender();
  requestAnimationFrame(renderLoop);
}

function init() {
  const offlineEarned = loadGame();

  groveInit();
  uiInit();
  uiRender();
  checkWhispers();

  if (offlineEarned >= 1) showOfflineModal(offlineEarned);

  lastLogicTime = Date.now();
  setInterval(logicTick, CONFIG.logicTickMs);
  setInterval(saveGame, CONFIG.autosaveMs);
  requestAnimationFrame(renderLoop);

  window.addEventListener("beforeunload", saveGame);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveGame();
  });
}

init();
