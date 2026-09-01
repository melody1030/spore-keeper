// Canvas grove scene: layered forest background, Mycel, Puffs, click particles.

const GROVE_W = 480;
const GROVE_H = 270;
const GROUND_Y = 170;

// Mycel pixel sprite (recreated from the character art).
// If assets/mycel.png exists it is used instead.
const MYCEL_PALETTE = {
  O: "#16323c", // outline
  T: "#3fd6c2", // teal cap
  t: "#2aa899", // teal shade
  H: "#eafffb", // cap highlight
  F: "#f7e6dc", // face
  B: "#6db5f2", // scarf blue
  b: "#4a8fd4", // scarf shade
  L: "#b79ae8", // lavender robe
  l: "#9678c8", // robe shade
  W: "#efe3c2", // belt
  o: "#e8a15c", // belt clasp
};

const MYCEL_PIXELS = [
  "......OOOOOO......",
  "....OOTTTTTTOO....",
  "...OTTHHHTTTTTO...",
  "..OTTHHHHTTTTTTO..",
  ".OTTTTHHTTTTTTTTO.",
  ".OTTTTTTTTTTTTTTO.",
  "OTTTTTTTTTTTTTTTTO",
  "OTTTTTTTTTTTTTTTTO",
  "OttTTTTTTTTTTTTttO",
  ".OttTTTTTTTTTTttO.",
  ".OtOttttttttttOtO.",
  "..O.OFFFFFFFFO.O..",
  "....OFFFFFFFFO....",
  "....OBBBBBBBBO....",
  "...OBBbBBBBbBBO...",
  "..OLLBBBBBBBBLLO..",
  ".OLLLBBBBBBBBLLLO.",
  ".OLLOBWWoWWBOLLLO.",
  "OLLLOBBBBBBBOLLOO.",
  "OLLO.OBBBBBO.OLLO.",
  ".OO..OllllO...OO..",
  "......OOOO........",
];

const PUFF_PALETTE = {
  O: "#16323c",
  P: "#e8a2c8", // pink cap
  p: "#c77ba8",
  H: "#ffe9f4",
  S: "#f2ead8", // stem
};

const PUFF_PIXELS = [
  "..OOOO..",
  ".OPPPPO.",
  "OPHHPPPO",
  "OPPPPPPO",
  "OppppppO",
  ".OSSSSO.",
  ".OSSSSO.",
  "..OOOO..",
];

// Scenery sprites from assets/ (512×512 pixel art, drawn small).
const DECO_ASSETS = [
  "tree", "mushrooms", "mushroom-log", "log", "fern",
  "grass", "berry-bush", "moss", "bush", "bush-dark",
];

// Fixed layout: [asset, x, baselineY, size, glows]
const DECO_LAYOUT = [
  ["mushrooms", 396, 186, 40, true],
  ["mushroom-log", 84, 198, 48, true],
  ["berry-bush", 264, 176, 34],
  ["log", 344, 250, 44],
  ["fern", 444, 230, 36],
  ["grass", 30, 246, 32],
  ["moss", 224, 258, 32],
  ["grass", 176, 212, 28],
  ["mushrooms", 134, 252, 30, true],
  ["bush", 320, 172, 36],
];

DECO_LAYOUT.sort((a, b) => a[2] - b[2]);

// ---- forest background palettes per brightness stage ----
// Stage 0 = dark misty forest → stage 3 = sunlit green clearing.
const STAGES = [
  { // 0: deep gloom
    skyTop: "#0a121b", skyBot: "#1e2c33", haze: "#27383f",
    farTrunk: "#1b2a32", midTrunk: "#141f27", canopy: "#0c161c",
    canopyLit: "#12222a", edgeTrunk: "#231a14", edgeBark: "#2f241b",
    ground: "#18241d", groundDark: "#111a15", groundLit: "#22332a",
    ray: "200, 225, 235", rayA: 0.05, mistA: 0.10, ivy: "#1d3a30",
  },
  { // 1: first light
    skyTop: "#101c26", skyBot: "#2c3f44", haze: "#3a5052",
    farTrunk: "#263a40", midTrunk: "#1b2b31", canopy: "#122019",
    canopyLit: "#1c3324", edgeTrunk: "#2b2018", edgeBark: "#3a2c20",
    ground: "#20301f", groundDark: "#172315", groundLit: "#31472b",
    ray: "215, 235, 225", rayA: 0.07, mistA: 0.08, ivy: "#2a5038",
  },
  { // 2: waking green
    skyTop: "#20343a", skyBot: "#597a5c", haze: "#6f9169",
    farTrunk: "#3c5747", midTrunk: "#2a3d31", canopy: "#1a2e1c",
    canopyLit: "#2f5227", edgeTrunk: "#33251a", edgeBark: "#463323",
    ground: "#2f4a26", groundDark: "#22371b", groundLit: "#48693a",
    ray: "240, 250, 210", rayA: 0.09, mistA: 0.05, ivy: "#3f7040",
  },
  { // 3: everglow clearing
    skyTop: "#4f7350", skyBot: "#a7c072", haze: "#c2d488",
    farTrunk: "#5d7a52", midTrunk: "#41573a", canopy: "#25411f",
    canopyLit: "#45702f", edgeTrunk: "#3d2c1c", edgeBark: "#553f28",
    ground: "#3f6428", groundDark: "#2f4c1e", groundLit: "#63903c",
    ray: "252, 255, 215", rayA: 0.12, mistA: 0.03, ivy: "#4f8a42",
  },
];

// Ray beams: [xTop, width, slant]
const RAYS = [[70, 26, -14], [150, 18, -10], [235, 30, -16], [330, 20, -10], [415, 26, -14]];

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

const grove = {
  canvas: null,
  ctx: null,
  mycelSprite: null,   // offscreen canvas
  puffSprite: null,
  deco: {},            // name -> Image
  bgCache: [],         // stage -> offscreen canvas
  mycel: { x: 230, y: 190, tx: 230, ty: 190, hop: 0 },
  puffs: [],           // {x, y, phase}
  particles: [],       // floating +N text and sparkles
  fireflies: [],
  time: 0,
};

function buildSprite(rows, palette, scale) {
  const c = document.createElement("canvas");
  c.width = rows[0].length * scale;
  c.height = rows.length * scale;
  const g = c.getContext("2d");
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      g.fillStyle = color;
      g.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  return c;
}

// Pre-render the static forest for one stage into an offscreen canvas.
function buildBackground(stage) {
  const P = STAGES[stage];
  const rnd = mulberry32(1337); // same seed every stage → stable scene
  const c = document.createElement("canvas");
  c.width = GROVE_W; c.height = GROVE_H;
  const g = c.getContext("2d");

  // sky/haze gradient
  const sky = g.createLinearGradient(0, 0, 0, GROUND_Y + 20);
  sky.addColorStop(0, P.skyTop);
  sky.addColorStop(0.75, P.skyBot);
  sky.addColorStop(1, P.haze);
  g.fillStyle = sky;
  g.fillRect(0, 0, GROVE_W, GROUND_Y + 20);

  // far trunks — thin hazy bars
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(rnd() * GROVE_W);
    const w = 5 + Math.floor(rnd() * 8);
    g.globalAlpha = 0.35 + rnd() * 0.3;
    g.fillStyle = P.farTrunk;
    g.fillRect(x, 0, w, GROUND_Y + 4);
    // branch nubs
    if (rnd() < 0.6) {
      const by = 30 + rnd() * 70;
      g.fillRect(x - 6, by, 6, 3);
    }
    if (rnd() < 0.6) {
      const by = 30 + rnd() * 70;
      g.fillRect(x + w, by, 6, 3);
    }
  }
  g.globalAlpha = 1;

  // mist band across the middle
  const mist = g.createLinearGradient(0, 90, 0, 165);
  mist.addColorStop(0, "rgba(255,255,255,0)");
  mist.addColorStop(0.5, `rgba(220,235,235,${P.mistA})`);
  mist.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = mist;
  g.fillRect(0, 90, GROVE_W, 75);

  // mid trunks — thicker, with ivy specks
  const midXs = [55, 130, 205, 275, 350, 425];
  for (const baseX of midXs) {
    const x = baseX + Math.floor(rnd() * 14 - 7);
    const w = 16 + Math.floor(rnd() * 10);
    g.fillStyle = P.midTrunk;
    g.fillRect(x, 0, w, GROUND_Y + 8);
    // slight rounding at root
    g.fillRect(x - 3, GROUND_Y - 2, w + 6, 10);
    // branches
    g.fillRect(x - 12, 20 + rnd() * 40, 12, 4);
    g.fillRect(x + w, 30 + rnd() * 40, 12, 4);
    // bark streaks
    g.fillStyle = "rgba(0,0,0,0.25)";
    for (let s = 0; s < 5; s++) {
      g.fillRect(x + 2 + Math.floor(rnd() * (w - 4)), Math.floor(rnd() * GROUND_Y), 2, 8 + rnd() * 18);
    }
    // ivy climbing the trunk
    g.fillStyle = P.ivy;
    for (let s = 0; s < 14; s++) {
      g.fillRect(x + Math.floor(rnd() * w), Math.floor(rnd() * (GROUND_Y - 20)) + 10, 3, 3);
    }
  }

  // canopy overhang across the top
  g.fillStyle = P.canopy;
  for (let i = 0; i < 26; i++) {
    const x = i * 20 + Math.floor(rnd() * 10 - 5);
    const r = 16 + rnd() * 18;
    const y = -4 + rnd() * 26;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // lit dapples on the canopy underside
  g.fillStyle = P.canopyLit;
  for (let i = 0; i < 40; i++) {
    g.fillRect(Math.floor(rnd() * GROVE_W), Math.floor(rnd() * 34), 4, 3);
  }
  // hanging vines
  g.fillStyle = P.canopy;
  for (let i = 0; i < 6; i++) {
    const x = 30 + Math.floor(rnd() * (GROVE_W - 60));
    const len = 16 + rnd() * 26;
    g.fillRect(x, 20, 2, len);
    g.fillRect(x - 2, 20 + len, 6, 4);
  }

  // big foreground edge trunks with leafy corner branches
  for (const side of [0, 1]) {
    const x = side === 0 ? -14 : GROVE_W - 30;
    g.fillStyle = P.edgeTrunk;
    g.fillRect(x, 0, 44, GROVE_H);
    g.fillStyle = P.edgeBark;
    for (let s = 0; s < 20; s++) {
      g.fillRect(x + 4 + Math.floor(rnd() * 34), Math.floor(rnd() * GROVE_H), 3, 10 + rnd() * 24);
    }
    // root flare
    g.fillStyle = P.edgeTrunk;
    g.fillRect(x - 10, GROVE_H - 40, 64, 40);
    // branch reaching into the top corner
    const bx = side === 0 ? 24 : GROVE_W - 24;
    const dir = side === 0 ? 1 : -1;
    g.fillRect(Math.min(bx, bx + dir * 60), 28, 60, 8);
    g.fillStyle = P.canopy;
    for (let i = 0; i < 8; i++) {
      const lx = bx + dir * (10 + rnd() * 70);
      g.beginPath(); g.arc(lx, 26 + rnd() * 20, 10 + rnd() * 10, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = P.canopyLit;
    for (let i = 0; i < 12; i++) {
      g.fillRect(bx + dir * Math.floor(rnd() * 80), 16 + Math.floor(rnd() * 28), 3, 3);
    }
    // ivy on the edge trunk
    g.fillStyle = P.ivy;
    for (let s = 0; s < 22; s++) {
      g.fillRect(x + Math.floor(rnd() * 44), Math.floor(rnd() * GROVE_H), 3, 3);
    }
  }

  // ground
  const gr = g.createLinearGradient(0, GROUND_Y, 0, GROVE_H);
  gr.addColorStop(0, P.groundLit);
  gr.addColorStop(0.3, P.ground);
  gr.addColorStop(1, P.groundDark);
  g.fillStyle = gr;
  g.fillRect(0, GROUND_Y, GROVE_W, GROVE_H - GROUND_Y);

  // undergrowth silhouettes along the horizon
  g.fillStyle = P.groundDark;
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(rnd() * GROVE_W);
    g.beginPath(); g.arc(x, GROUND_Y + 2, 4 + rnd() * 7, Math.PI, 0); g.fill();
  }

  // grass/dirt texture specks
  for (let i = 0; i < 420; i++) {
    const x = Math.floor(rnd() * GROVE_W);
    const y = GROUND_Y + 4 + Math.floor(rnd() * (GROVE_H - GROUND_Y - 4));
    g.fillStyle = rnd() < 0.5 ? P.groundDark : P.groundLit;
    g.fillRect(x, y, 2, rnd() < 0.3 ? 3 : 2);
  }
  // grass blades
  g.fillStyle = P.groundLit;
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * GROVE_W);
    const y = GROUND_Y + 6 + Math.floor(rnd() * (GROVE_H - GROUND_Y - 12));
    g.fillRect(x, y - 3, 1, 4);
    if (rnd() < 0.5) g.fillRect(x + 2, y - 2, 1, 3);
  }

  // light pools under the rays (brighter stages only)
  if (stage >= 1) {
    g.fillStyle = `rgba(${P.ray}, ${P.rayA * 1.6})`;
    for (const [rx, rw, slant] of RAYS) {
      g.beginPath();
      g.ellipse(rx + slant + rw / 2, GROUND_Y + 26, rw + 16, 7, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  // tiny flowers in the waking stages
  if (stage >= 2) {
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * GROVE_W);
      const y = GROUND_Y + 8 + Math.floor(rnd() * (GROVE_H - GROUND_Y - 16));
      g.fillStyle = rnd() < 0.5 ? "#e8f3d8" : (rnd() < 0.5 ? "#9ec7e8" : "#ffd98a");
      g.fillRect(x, y, 2, 2);
    }
  }

  return c;
}

function groveInit() {
  grove.canvas = document.getElementById("grove");
  grove.canvas.width = GROVE_W;
  grove.canvas.height = GROVE_H;
  grove.ctx = grove.canvas.getContext("2d");
  grove.ctx.imageSmoothingEnabled = false;

  grove.mycelSprite = buildSprite(MYCEL_PIXELS, MYCEL_PALETTE, 2);
  grove.puffSprite = buildSprite(PUFF_PIXELS, PUFF_PALETTE, 2);

  // Prefer the original character art if present.
  const img = new Image();
  img.onload = () => { grove.mycelSprite = img; };
  img.src = "assets/mycel.png";

  for (const name of DECO_ASSETS) {
    const d = new Image();
    d.src = "assets/" + name + ".png";
    grove.deco[name] = d;
  }

  for (let i = 0; i < 18; i++) {
    grove.fireflies.push({
      x: Math.random() * GROVE_W,
      y: 40 + Math.random() * (GROUND_Y - 20),
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.3,
    });
  }

  grove.canvas.addEventListener("pointerdown", onGroveTap);
}

function onGroveTap(e) {
  const rect = grove.canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * GROVE_W;
  const y = ((e.clientY - rect.top) / rect.height) * GROVE_H;

  const gained = sporesPerClick(state);
  addSpores(gained);

  grove.mycel.tx = Math.max(50, Math.min(GROVE_W - 50, x));
  grove.mycel.ty = Math.max(GROUND_Y + 8, Math.min(GROVE_H - 30, y));
  grove.mycel.hop = 1;

  grove.particles.push({ kind: "text", x, y: y - 12, vy: -0.5, life: 60, text: "+" + formatNum(gained) });
  for (let i = 0; i < 6; i++) {
    grove.particles.push({
      kind: "spark",
      x, y,
      vx: (Math.random() - 0.5) * 1.6,
      vy: -Math.random() * 1.4 - 0.3,
      life: 30 + Math.random() * 20,
    });
  }
  checkWhispers();
}

function brightnessStage() {
  let stage = 0;
  for (let i = 0; i < BRIGHTNESS_STAGES.length; i++) {
    if (state.totalEarned >= BRIGHTNESS_STAGES[i]) stage = i;
  }
  return stage;
}

// Sync visible puffs with owned helper count (max 12 shown).
function syncPuffs() {
  const want = Math.min(totalPuffsOwned(state), 12);
  while (grove.puffs.length < want) {
    grove.puffs.push({
      x: 40 + Math.random() * (GROVE_W - 80),
      y: GROUND_Y + 12 + Math.random() * (GROVE_H - GROUND_Y - 42),
      phase: Math.random() * Math.PI * 2,
    });
  }
  grove.puffs.length = want;
}

const STAGE_GLOW = [0.12, 0.18, 0.26, 0.34];

function groveRender() {
  const ctx = grove.ctx;
  const t = grove.time;
  const stage = brightnessStage();

  // static forest layers (cached per stage)
  if (!grove.bgCache[stage]) grove.bgCache[stage] = buildBackground(stage);
  ctx.drawImage(grove.bgCache[stage], 0, 0);

  const P = STAGES[stage];

  // god rays, gently pulsing
  for (let i = 0; i < RAYS.length; i++) {
    const [rx, rw, slant] = RAYS[i];
    const a = P.rayA * (0.75 + 0.25 * Math.sin(t * 0.008 + i * 1.7));
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 30);
    grad.addColorStop(0, `rgba(${P.ray}, ${a})`);
    grad.addColorStop(1, `rgba(${P.ray}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + rw, 0);
    ctx.lineTo(rx + rw + slant, GROUND_Y + 30);
    ctx.lineTo(rx + slant, GROUND_Y + 30);
    ctx.closePath();
    ctx.fill();
  }

  // drifting mist (fades away as the grove brightens)
  if (P.mistA > 0.03) {
    for (let i = 0; i < 2; i++) {
      const mx = ((t * (0.12 + i * 0.07)) + i * 260) % (GROVE_W + 240) - 120;
      ctx.fillStyle = `rgba(215, 232, 232, ${P.mistA * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(mx, 128 + i * 26, 110, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // scenery sprites (sorted back-to-front by baseline)
  for (const [name, dx, dy, size, glows] of DECO_LAYOUT) {
    const img = grove.deco[name];
    if (!img || !img.complete || !img.naturalWidth) continue;
    if (glows) {
      const glow = STAGE_GLOW[stage] + Math.sin(t * 0.03 + dx) * 0.05;
      ctx.fillStyle = `rgba(63, 214, 194, ${Math.max(glow, 0.05)})`;
      ctx.beginPath();
      ctx.arc(dx, dy - size * 0.3, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.drawImage(img, Math.round(dx - size / 2), Math.round(dy - size), size, size);
  }

  // fireflies (more visible in brighter stages)
  const flies = 6 + stage * 4;
  for (let i = 0; i < flies && i < grove.fireflies.length; i++) {
    const f = grove.fireflies[i];
    f.x += Math.sin(t * 0.01 + f.phase) * f.speed;
    f.y += Math.cos(t * 0.013 + f.phase) * f.speed * 0.5;
    if (f.x < 0) f.x = GROVE_W; if (f.x > GROVE_W) f.x = 0;
    const a = 0.3 + Math.sin(t * 0.05 + f.phase) * 0.3;
    ctx.fillStyle = `rgba(255, 217, 138, ${Math.max(a, 0)})`;
    ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
  }

  // puffs
  syncPuffs();
  for (const p of grove.puffs) {
    const bob = Math.round(Math.sin(t * 0.04 + p.phase) * 1.5);
    ctx.drawImage(grove.puffSprite, Math.round(p.x - 8), Math.round(p.y - 16 + bob));
  }

  // Mycel — glide toward tap target with a hop
  const m = grove.mycel;
  m.x += (m.tx - m.x) * 0.12;
  m.y += (m.ty - m.y) * 0.12;
  if (m.hop > 0) m.hop = Math.max(0, m.hop - 0.06);
  const hopY = Math.sin(m.hop * Math.PI) * 12;
  const idleBob = Math.round(Math.sin(t * 0.03) * 1.5);

  // The 512px character art carries transparent padding, so draw it larger.
  const sw = grove.mycelSprite.width > 64 ? 64 : grove.mycelSprite.width;
  const sh = grove.mycelSprite.width > 64 ? 64 : grove.mycelSprite.height;
  // soft glow under Mycel
  ctx.fillStyle = "rgba(63, 214, 194, 0.15)";
  ctx.beginPath();
  ctx.ellipse(m.x, m.y + sh / 2 - 4, sw / 2.2, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(grove.mycelSprite, Math.round(m.x - sw / 2), Math.round(m.y - sh / 2 - hopY + idleBob), sw, sh);

  // particles
  for (let i = grove.particles.length - 1; i >= 0; i--) {
    const p = grove.particles[i];
    p.life--;
    if (p.life <= 0) { grove.particles.splice(i, 1); continue; }
    if (p.kind === "text") {
      p.y += p.vy;
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = `rgba(255, 217, 138, ${Math.min(p.life / 30, 1)})`;
      ctx.textAlign = "center";
      ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      ctx.fillStyle = `rgba(63, 214, 194, ${Math.min(p.life / 25, 1)})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }
  }

  grove.time++;
}
