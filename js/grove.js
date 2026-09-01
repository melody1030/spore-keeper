// Canvas grove scene: Mycel, Puffs, brightness stages, click particles.

const GROVE_W = 320;
const GROVE_H = 180;

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

const grove = {
  canvas: null,
  ctx: null,
  mycelSprite: null,   // offscreen canvas
  puffSprite: null,
  mycel: { x: 150, y: 120, tx: 150, ty: 120, hop: 0 },
  puffs: [],           // {x, y, phase}
  particles: [],       // {x, y, vy, life, text} or sparkles {x, y, vx, vy, life}
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

  for (let i = 0; i < 14; i++) {
    grove.fireflies.push({
      x: Math.random() * GROVE_W,
      y: Math.random() * (GROVE_H - 60),
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

  grove.mycel.tx = Math.max(30, Math.min(GROVE_W - 30, x));
  grove.mycel.ty = Math.max(70, Math.min(GROVE_H - 25, y));
  grove.mycel.hop = 1;

  grove.particles.push({ kind: "text", x, y: y - 10, vy: -0.5, life: 60, text: "+" + formatNum(gained) });
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
      x: 25 + Math.random() * (GROVE_W - 50),
      y: 95 + Math.random() * (GROVE_H - 125),
      phase: Math.random() * Math.PI * 2,
    });
  }
  grove.puffs.length = want;
}

const STAGE_SKY = ["#0a141c", "#0e1c26", "#132836", "#1a3a4a"];
const STAGE_GROUND = ["#14231d", "#1a2f26", "#224033", "#2c5442"];
const STAGE_GLOW = [0.05, 0.15, 0.3, 0.5];

function groveRender() {
  const ctx = grove.ctx;
  const t = grove.time;
  const stage = brightnessStage();

  // sky
  ctx.fillStyle = STAGE_SKY[stage];
  ctx.fillRect(0, 0, GROVE_W, GROVE_H);

  // distant tree silhouettes
  ctx.fillStyle = "rgba(30, 55, 66, 0.6)";
  for (let i = 0; i < 6; i++) {
    const x = i * 60 - 10;
    ctx.fillRect(x + 18, 20, 8, 80);
    ctx.beginPath();
    ctx.arc(x + 22, 30, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // ground
  ctx.fillStyle = STAGE_GROUND[stage];
  ctx.fillRect(0, 95, GROVE_W, GROVE_H - 95);

  // glowing mushroom props
  const props = [[35, 100], [280, 110], [60, 155], [250, 160], [160, 100]];
  props.forEach(([px, py], i) => {
    const glow = STAGE_GLOW[stage] + Math.sin(t * 0.03 + i) * 0.05;
    ctx.fillStyle = `rgba(63, 214, 194, ${Math.max(glow, 0.05)})`;
    ctx.beginPath();
    ctx.arc(px, py - 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2ead8";
    ctx.fillRect(px - 2, py - 4, 4, 6);
    ctx.fillStyle = "#3fd6c2";
    ctx.fillRect(px - 5, py - 8, 10, 4);
    ctx.fillRect(px - 3, py - 10, 6, 2);
  });

  // fireflies (more visible in brighter stages)
  const flies = 4 + stage * 3;
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
  const hopY = Math.sin(m.hop * Math.PI) * 10;
  const idleBob = Math.round(Math.sin(t * 0.03) * 1.5);

  const sw = grove.mycelSprite.width > 64 ? 48 : grove.mycelSprite.width;
  const sh = grove.mycelSprite.width > 64 ? 48 : grove.mycelSprite.height;
  // soft glow under Mycel
  ctx.fillStyle = "rgba(63, 214, 194, 0.15)";
  ctx.beginPath();
  ctx.ellipse(m.x, m.y + sh / 2 - 2, sw / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(grove.mycelSprite, Math.round(m.x - sw / 2), Math.round(m.y - sh / 2 - hopY + idleBob), sw, sh);

  // particles
  for (let i = grove.particles.length - 1; i >= 0; i--) {
    const p = grove.particles[i];
    p.life--;
    if (p.life <= 0) { grove.particles.splice(i, 1); continue; }
    if (p.kind === "text") {
      p.y += p.vy;
      ctx.font = "bold 10px monospace";
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
