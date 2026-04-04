"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Scale: 1 logical px = S real px ──────────────────────────────────────
const S = 3;
const CW = 220; // canvas logical width
const CH = 160; // canvas logical height

// ─── Helpers ──────────────────────────────────────────────────────────────
function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}
function d(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) { r(ctx, x, y, 1, 1, c); }
function hl(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string) { r(ctx, x, y, w, 1, c); }
function vl(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, c: string) { r(ctx, x, y, 1, h, c); }

// ─── One Piece character defs ─────────────────────────────────────────────
// Each char: drawFn draws a 16×26 pixel character at (x,y)
interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  opChar: string;       // OP character name
  opEmoji: string;
  activities: string[]; // rotating activity messages
}

const AGENTS: Agent[] = [
  {
    id: "eli", name: "Eli", role: "Orchestrator", color: "#f0c000", opChar: "Luffy", opEmoji: "🏴‍☠️",
    activities: [
      "Coordinating crew...", "Planning next mission", "Stretching to grab data 🤸",
      "\"I'll be King of Agents!\"", "Routing tasks to crew", "Eating snacks... wait no",
    ],
  },
  {
    id: "scout", name: "Scout", role: "Analytics", color: "#ff8c00", opChar: "Nami", opEmoji: "🗺️",
    activities: [
      "Mapping traffic data 📊", "Calculating route...", "Money money money 💰",
      "Charting rankings", "Weather forecast: 📈 sunny", "Stealing insights",
    ],
  },
  {
    id: "pen", name: "Pen", role: "Content", color: "#9b59b6", opChar: "Robin", opEmoji: "📖",
    activities: [
      "Writing blog post...", "\"Nihilist-hana!\" ✍️", "Researching history",
      "Crafting SEO copy", "Reading ancient scrolls", "Sprouting content ideas",
    ],
  },
  {
    id: "closer", name: "Closer", role: "Bookings", color: "#3498db", opChar: "Sanji", opEmoji: "🦵",
    activities: [
      "Closing a booking 🔥", "Finding perfect tour", "\"Only for ladies!\" 💙",
      "Cooking up a deal", "Kicking out bad leads", "Diable Jambe follow-up",
    ],
  },
  {
    id: "buzz", name: "Buzz", role: "Social", color: "#e67e22", opChar: "Usopp", opEmoji: "🎯",
    activities: [
      "\"8000 followers!\" 📣", "Crafting epic captions", "Sniping viral trends 🎯",
      "Posting reel... maybe", "Lying about reach (jk)", "Pop Green — IG post!",
    ],
  },
  {
    id: "ledger", name: "Ledger", role: "Finance", color: "#2ecc71", opChar: "Zoro", opEmoji: "⚔️",
    activities: [
      "Counting revenue ⚔️", "Three-sword accounting", "Getting lost in numbers",
      "฿45,000 MTD tracked", "Slashing expenses 🗡️", "Napping between P&Ls",
    ],
  },
];

// Desk positions (2 rows of 3)
const DESKS = [
  { x: 8,  y: 20 },
  { x: 82, y: 20 },
  { x: 156, y: 20 },
  { x: 8,  y: 95 },
  { x: 82, y: 95 },
  { x: 156, y: 95 },
];

// ─── Character Drawers ────────────────────────────────────────────────────
// Each draws a ~14×24 pixel character at (ox, oy), bob offset applied

function drawLuffy(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.7) : 0;
  const y = oy + b;
  // Straw hat
  r(ctx, ox+1, y-3, 12, 1, "#c8a000");
  r(ctx, ox+3, y-5, 8, 3, "#f0c000");
  r(ctx, ox+4, y-6, 6, 2, "#f0c000");
  // Head
  r(ctx, ox+3, y-1, 8, 7, "#ffcc99");
  // Hat band (red)
  hl(ctx, ox+3, y-2, 8, "#cc2200");
  // Eyes
  d(ctx, ox+5, y+2, "#111"); d(ctx, ox+8, y+2, "#111");
  // Scar (left eye)
  d(ctx, ox+5, y+3, "#cc3333");
  // Big smile
  r(ctx, ox+4, y+4, 6, 1, "#111");
  d(ctx, ox+4, y+3, "#111"); d(ctx, ox+9, y+3, "#111");
  // Body (red vest)
  r(ctx, ox+2, y+6, 10, 8, "#cc1100");
  // Open chest
  r(ctx, ox+5, y+6, 4, 8, "#ffcc99");
  // Arms
  if (working) {
    const sw = Math.sin(t * 4) > 0 ? 1 : 0;
    r(ctx, ox,    y+7+sw, 3, 5, "#ffcc99");
    r(ctx, ox+11, y+7-sw, 3, 5, "#ffcc99");
  } else {
    r(ctx, ox, y+8, 3, 5, "#ffcc99");
    r(ctx, ox+11, y+8, 3, 5, "#ffcc99");
  }
  // Shorts (blue)
  r(ctx, ox+2, y+13, 10, 6, "#1155aa");
  // Shoes
  r(ctx, ox+2, y+18, 4, 3, "#442200"); r(ctx, ox+8, y+18, 4, 3, "#442200");
}

function drawNami(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.7) : 0;
  const y = oy + b;
  // Orange hair (long)
  r(ctx, ox+3, y-4, 9, 2, "#ff8c00");
  r(ctx, ox+2, y-2, 10, 8, "#ff8c00");
  r(ctx, ox+11, y+2, 2, 6, "#ff8c00");
  // Head
  r(ctx, ox+3, y-1, 8, 7, "#ffcc99");
  // Tattoo dot
  d(ctx, ox+4, y+2, "#0055cc");
  // Eyes
  d(ctx, ox+5, y+2, "#552200"); d(ctx, ox+8, y+2, "#552200");
  // Smile
  r(ctx, ox+5, y+4, 4, 1, "#aa5522");
  // Body (orange top)
  r(ctx, ox+3, y+6, 8, 5, "#ff6600");
  // Skirt (blue)
  r(ctx, ox+2, y+10, 10, 7, "#004499");
  // Arms with staff (holding map when working)
  r(ctx, ox+1, y+7, 2, 5, "#ffcc99");
  if (working) {
    r(ctx, ox+13, y+6, 2, 8, "#88aa44"); // staff/pencil
    r(ctx, ox+11, y+7, 2, 5, "#ffcc99");
  } else {
    r(ctx, ox+11, y+7, 2, 5, "#ffcc99");
  }
  // Legs
  r(ctx, ox+4, y+17, 3, 4, "#ffcc99"); r(ctx, ox+7, y+17, 3, 4, "#ffcc99");
  // Shoes
  r(ctx, ox+3, y+20, 4, 2, "#aa3300"); r(ctx, ox+7, y+20, 4, 2, "#aa3300");
}

function drawRobin(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.7) : 0;
  const y = oy + b;
  // Dark blue hair
  r(ctx, ox+3, y-5, 8, 6, "#1a0a4a");
  r(ctx, ox+2, y-1, 2, 6, "#1a0a4a");
  r(ctx, ox+12, y-1, 2, 6, "#1a0a4a");
  // Head
  r(ctx, ox+3, y-1, 8, 7, "#f0d0b0");
  // Eyes (elegant)
  r(ctx, ox+5, y+2, 2, 1, "#1a0a4a"); r(ctx, ox+8, y+2, 2, 1, "#1a0a4a");
  // Small smile
  r(ctx, ox+5, y+4, 4, 1, "#aa7755");
  // Body (purple/dark dress)
  r(ctx, ox+2, y+6, 10, 9, "#4a1a6a");
  // Extra arms (Hana Hana) if working
  if (working) {
    r(ctx, ox-2, y+5, 3, 6, "#f0d0b0"); // sprouted arm left
    r(ctx, ox+13, y+5, 3, 6, "#f0d0b0"); // sprouted arm right
    r(ctx, ox+1, y+4, 2, 5, "#f0d0b0");
    r(ctx, ox+11, y+4, 2, 5, "#f0d0b0");
  } else {
    r(ctx, ox+1, y+8, 2, 5, "#f0d0b0");
    r(ctx, ox+11, y+8, 2, 5, "#f0d0b0");
  }
  // Skirt
  r(ctx, ox+2, y+14, 10, 5, "#3a0a5a");
  // Legs
  r(ctx, ox+4, y+18, 3, 4, "#f0d0b0"); r(ctx, ox+7, y+18, 3, 4, "#f0d0b0");
  r(ctx, ox+3, y+21, 4, 2, "#1a0a2a"); r(ctx, ox+7, y+21, 4, 2, "#1a0a2a");
}

function drawSanji(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.7) : 0;
  const y = oy + b;
  // Blonde hair (covers one eye)
  r(ctx, ox+3, y-4, 8, 5, "#ddaa00");
  d(ctx, ox+4, y+1, "#ddaa00"); // swept over eye
  // Head
  r(ctx, ox+3, y-1, 8, 7, "#ffddbb");
  // Curly eyebrow + covered eye
  d(ctx, ox+8, y+2, "#111"); // visible eye
  d(ctx, ox+8, y+1, "#333"); // eyebrow curl
  // Cigarette
  r(ctx, ox+9, y+4, 4, 1, "#ffffff");
  d(ctx, ox+12, y+4, "#ff4400"); // ember
  // Smile/smirk
  r(ctx, ox+5, y+4, 4, 1, "#aa5522");
  // Suit (black/dark)
  r(ctx, ox+2, y+6, 10, 10, "#1a1a2a");
  // White shirt + tie
  r(ctx, ox+5, y+6, 4, 5, "#ddddee");
  d(ctx, ox+6, y+8, "#cc1100"); // tie
  d(ctx, ox+6, y+9, "#cc1100");
  // Kick leg animation
  if (working) {
    const kick = Math.sin(t * 5) > 0 ? 1 : -1;
    r(ctx, ox+2, y+16, 5, 6, "#1a1a2a");
    r(ctx, ox+7+kick, y+14, 5, 8, "#1a1a2a"); // kick leg
    r(ctx, ox+1, y+8, 2, 5, "#ffddbb");
    r(ctx, ox+11, y+8, 2, 5, "#ffddbb");
  } else {
    r(ctx, ox+2, y+16, 5, 6, "#1a1a2a"); r(ctx, ox+7, y+16, 5, 6, "#1a1a2a");
    r(ctx, ox+1, y+8, 2, 5, "#ffddbb"); r(ctx, ox+11, y+8, 2, 5, "#ffddbb");
  }
  // Shoes
  r(ctx, ox+1, y+21, 5, 2, "#111"); r(ctx, ox+6, y+21, 6, 2, "#111");
}

function drawUsopp(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.7) : 0;
  const y = oy + b;
  // Curly black hair
  r(ctx, ox+3, y-5, 8, 6, "#1a1a1a");
  r(ctx, ox+2, y-2, 2, 5, "#1a1a1a");
  r(ctx, ox+12, y-2, 2, 5, "#1a1a1a");
  // Hat
  r(ctx, ox+2, y-7, 10, 3, "#cc8822");
  hl(ctx, ox+1, y-5, 12, "#aa6611");
  // Head
  r(ctx, ox+3, y-1, 8, 7, "#cc9966");
  // LONG NOSE
  r(ctx, ox+7, y+3, 6, 2, "#bb8855");
  d(ctx, ox+12, y+3, "#aa7744");
  // Eyes
  d(ctx, ox+5, y+2, "#111"); d(ctx, ox+8, y+2, "#111");
  // Sweat drop / scared face
  r(ctx, ox+5, y+5, 4, 1, "#884422");
  // Body (overalls)
  r(ctx, ox+2, y+6, 10, 10, "#cc7722");
  r(ctx, ox+5, y+6, 4, 10, "#885500"); // strap
  // Arms - holding slingshot if working
  r(ctx, ox+1, y+7, 2, 6, "#cc9966");
  if (working) {
    r(ctx, ox+12, y+5, 2, 6, "#cc9966");
    r(ctx, ox+14, y+4, 2, 4, "#885500"); // slingshot
    d(ctx, ox+14, y+3, "#ff6600"); // pebble
  } else {
    r(ctx, ox+12, y+7, 2, 6, "#cc9966");
  }
  // Legs
  r(ctx, ox+3, y+16, 4, 5, "#885500"); r(ctx, ox+7, y+16, 4, 5, "#885500");
  r(ctx, ox+2, y+20, 5, 2, "#442200"); r(ctx, ox+7, y+20, 5, 2, "#442200");
}

function drawZoro(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.7) : 0;
  const y = oy + b;
  // Green hair (short mohawk)
  r(ctx, ox+4, y-5, 6, 5, "#1a7a1a");
  r(ctx, ox+5, y-7, 4, 3, "#22aa22");
  // Head
  r(ctx, ox+3, y-1, 8, 7, "#d4aa88");
  // Scar across eye
  vl(ctx, ox+8, y+1, 4, "#ff3300");
  // Eyes (serious)
  d(ctx, ox+5, y+2, "#111"); d(ctx, ox+8, y+2, "#111");
  // Stern mouth
  hl(ctx, ox+5, y+5, 4, "#884422");
  // Earring
  d(ctx, ox+3, y+3, "#cccc00");
  // Body (white shirt open chest)
  r(ctx, ox+2, y+6, 10, 9, "#ddeedd");
  r(ctx, ox+5, y+6, 4, 9, "#d4aa88"); // open chest
  // Bandana on arm
  r(ctx, ox+1, y+7, 2, 6, "#d4aa88");
  r(ctx, ox+1, y+7, 2, 2, "#ffffff");
  if (working) {
    // Three swords stance — one in mouth, arms out
    r(ctx, ox+11, y+7, 2, 6, "#d4aa88");
    r(ctx, ox+13, y+3, 1, 12, "#aaaacc"); // sword 1
    r(ctx, ox-1, y+3, 1, 12, "#aaaacc");  // sword 2
    d(ctx, ox+7, y+4, "#aaaacc"); // sword in mouth (handle)
  } else {
    r(ctx, ox+11, y+7, 2, 6, "#d4aa88");
    // One sword at hip
    r(ctx, ox+12, y+10, 1, 8, "#aaaacc");
  }
  // Pants (dark)
  r(ctx, ox+2, y+15, 10, 6, "#1a2a1a");
  // Boots
  r(ctx, ox+2, y+20, 4, 3, "#111"); r(ctx, ox+7, y+20, 4, 3, "#111");
}

const CHARACTER_DRAWERS = [drawLuffy, drawNami, drawRobin, drawSanji, drawUsopp, drawZoro];

// ─── Scene ────────────────────────────────────────────────────────────────
function drawBG(ctx: CanvasRenderingContext2D, t: number) {
  // ── Sky (ocean horizon) ──────────────────────────────────────────────
  // Animated sky gradient
  const skyShift = Math.sin(t * 0.2) * 0.05;
  const grad = ctx.createLinearGradient(0, 0, 0, 45 * S);
  grad.addColorStop(0, "#1a3a6a");
  grad.addColorStop(0.5, "#2255aa");
  grad.addColorStop(1, "#4488cc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW * S, 45 * S);

  // Clouds drifting
  const clouds = [
    { bx: 10, by: 5, w: 20, spd: 0.3 },
    { bx: 70, by: 8, w: 30, spd: 0.18 },
    { bx: 150, by: 4, w: 22, spd: 0.25 },
  ];
  clouds.forEach(cl => {
    const cx = ((cl.bx + t * cl.spd * 20) % (CW + cl.w)) - cl.w;
    r(ctx, cx, cl.by, cl.w, 3, "#c8ddf0");
    r(ctx, cx+2, cl.by-2, cl.w-4, 3, "#ddeeff");
    r(ctx, cx+4, cl.by-3, cl.w-8, 2, "#ffffff");
  });

  // ── Ocean waves ──────────────────────────────────────────────────────
  // Far sea
  r(ctx, 0, 38, CW, 8, "#1a5588");
  r(ctx, 0, 42, CW, 4, "#1e6699");
  // Wave crests (animated)
  for (let wx = 0; wx < CW; wx += 18) {
    const woff = Math.floor(Math.sin(t * 1.5 + wx * 0.2) * 2);
    hl(ctx, wx, 39 + woff, 10, "#4499cc");
    hl(ctx, wx + 5, 40 + woff, 6, "#88ccee");
  }
  // Sea foam / spray at hull
  for (let fx = 0; fx < CW; fx += 10) {
    const fo = Math.floor(Math.sin(t * 2 + fx * 0.3) * 1.5);
    d(ctx, fx + 2, 43 + fo, "#aaddff");
    d(ctx, fx + 5, 44 + fo, "#cceeff");
  }

  // ── Going Merry hull (white) ─────────────────────────────────────────
  r(ctx, 0, 44, CW, 4, "#f0f0e8");
  hl(ctx, 0, 44, CW, "#d8d8c8"); // shadow top
  hl(ctx, 0, 47, CW, "#c8c8b8"); // shadow bottom
  // Blue stripe on hull
  r(ctx, 0, 45, CW, 2, "#2255aa");

  // ── Ship wall (wood paneling below deck) ─────────────────────────────
  r(ctx, 0, 48, CW, 12, "#7a4e2a");
  // Horizontal wood planks on wall
  for (let wy = 48; wy < 60; wy += 4) {
    hl(ctx, 0, wy, CW, "#8a5e3a");
    hl(ctx, 0, wy+1, CW, "#6a3e1a");
  }
  // Vertical support beams
  for (let bx = 0; bx < CW; bx += 36) {
    r(ctx, bx, 48, 3, 12, "#5a3010");
    r(ctx, bx+1, 48, 1, 12, "#8a6040");
  }
  // Wall top rail
  r(ctx, 0, 48, CW, 2, "#aa7040");
  hl(ctx, 0, 48, CW, "#cc9060");

  // ── Deck (wooden planks) ─────────────────────────────────────────────
  // Base deck color
  r(ctx, 0, 59, CW, CH - 59, "#7a5028");
  // Plank rows
  for (let py = 59; py < CH - 8; py += 5) {
    hl(ctx, 0, py, CW, "#8a6030");
    hl(ctx, 0, py+1, CW, "#6a4018");
    hl(ctx, 0, py+4, CW, "#5a3010");
  }
  // Plank vertical breaks (staggered)
  for (let px = 0; px < CW; px += 22) {
    const offset = ((px / 22) % 2) * 11;
    vl(ctx, px + offset, 59, CH - 67, "#5a3010");
  }
  // Deck nails
  for (let nx = 4; nx < CW; nx += 22) {
    for (let ny = 61; ny < CH - 10; ny += 5) {
      d(ctx, nx, ny, "#442200");
    }
  }

  // ── Rope coils on deck corners ───────────────────────────────────────
  // Left coil
  r(ctx, 1, 62, 6, 3, "#aa8844");
  r(ctx, 2, 61, 4, 5, "#aa8844");
  hl(ctx, 1, 63, 6, "#cc9955");
  // Right coil
  r(ctx, CW-7, 62, 6, 3, "#aa8844");
  r(ctx, CW-6, 61, 4, 5, "#aa8844");
  hl(ctx, CW-7, 63, 6, "#cc9955");

  // ── Ropes from mast (hanging diagonals) ─────────────────────────────
  // Left rope
  for (let i = 0; i < 20; i++) {
    d(ctx, 5 + i * 2, 2 + i, "#cc9944");
  }
  // Right rope
  for (let i = 0; i < 20; i++) {
    d(ctx, CW - 5 - i * 2, 2 + i, "#cc9944");
  }
  // Horizontal rope rail at wall top
  for (let rx = 0; rx < CW; rx += 3) {
    const sag = Math.sin(rx / CW * Math.PI) * 2;
    d(ctx, rx, Math.round(48 + sag), "#cc9944");
    d(ctx, rx+1, Math.round(48 + sag), "#bb8833");
  }
}

// Draw a circular porthole window (Going Merry style)
function drawPorthole(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const R = 11; // radius in logical px

  // Outer brass ring
  ctx.beginPath();
  ctx.arc(cx * S, cy * S, (R+3) * S, 0, Math.PI*2);
  ctx.fillStyle = "#8a6020";
  ctx.fill();
  // Brass highlight
  ctx.beginPath();
  ctx.arc(cx * S, cy * S, (R+2) * S, -Math.PI*0.8, -Math.PI*0.2);
  ctx.strokeStyle = "#ccaa44";
  ctx.lineWidth = S * 1.5;
  ctx.stroke();

  // Inner ring (dark metal)
  ctx.beginPath();
  ctx.arc(cx * S, cy * S, (R+1) * S, 0, Math.PI*2);
  ctx.fillStyle = "#443010";
  ctx.fill();

  // Glass (ocean view)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx * S, cy * S, R * S, 0, Math.PI*2);
  ctx.clip();

  // Sky portion (top half)
  const skyGrad = ctx.createLinearGradient(0, (cy-R)*S, 0, cy*S);
  skyGrad.addColorStop(0, "#2255aa");
  skyGrad.addColorStop(1, "#4488cc");
  ctx.fillStyle = skyGrad;
  ctx.fillRect((cx-R)*S, (cy-R)*S, R*2*S, R*S);

  // Ocean (bottom half)
  const seaGrad = ctx.createLinearGradient(0, cy*S, 0, (cy+R)*S);
  seaGrad.addColorStop(0, "#1a6699");
  seaGrad.addColorStop(1, "#0a3355");
  ctx.fillStyle = seaGrad;
  ctx.fillRect((cx-R)*S, cy*S, R*2*S, R*S);

  // Animated wave in porthole
  for (let wx = cx-R; wx < cx+R; wx += 4) {
    const wh = Math.floor(Math.sin(t * 1.5 + wx * 0.4) * 2);
    r(ctx, wx, cy + wh, 3, 1, "#4499bb");
    r(ctx, wx+1, cy + wh - 1, 2, 1, "#88ccee");
  }

  // Seagull (tiny, animated)
  const bx = cx - R + ((t * 15) % (R*2.2));
  const by = cy - R + 3 + Math.sin(t * 2 + cx) * 2;
  if (bx < cx + R - 1) {
    r(ctx, Math.round(bx), Math.round(by), 2, 1, "#ffffff");
    d(ctx, Math.round(bx)-1, Math.round(by)+1, "#ffffff");
    d(ctx, Math.round(bx)+2, Math.round(by)+1, "#ffffff");
  }

  // Reflection glare
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse((cx-4)*S, (cy-5)*S, 3*S, 5*S, -0.5, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();

  // Cross divider (porthole frame bars)
  ctx.fillStyle = "#7a5520";
  ctx.fillRect((cx-1)*S, (cy-R)*S, 2*S, R*2*S);
  ctx.fillRect((cx-R)*S, (cy-1)*S, R*2*S, 2*S);
  ctx.fillStyle = "#aa8840";
  ctx.fillRect(cx*S, (cy-R)*S, S, R*2*S);
  ctx.fillRect((cx-R)*S, cy*S, R*2*S, S);

  // Bolts at 4 corners of brass ring
  const boltPos = [[-8,-8],[8,-8],[-8,8],[8,8]];
  boltPos.forEach(([bpx,bpy]) => {
    ctx.beginPath();
    ctx.arc((cx+bpx)*S, (cy+bpy)*S, S*1.2, 0, Math.PI*2);
    ctx.fillStyle = "#cc9933";
    ctx.fill();
    ctx.beginPath();
    ctx.arc((cx+bpx)*S, (cy+bpy)*S, S*0.6, 0, Math.PI*2);
    ctx.fillStyle = "#665511";
    ctx.fill();
  });

  // Warm light on deck below
  ctx.fillStyle = `rgba(180,220,255,${0.05 + Math.sin(t*0.5)*0.02})`;
  ctx.fillRect((cx-R)*S, 59*S, R*2*S, 80*S);
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Legs (metallic)
  vl(ctx, x+2, y+14, 9, "#2a2a4a"); vl(ctx, x+22, y+14, 9, "#2a2a4a");
  vl(ctx, x+3, y+14, 9, "#3a3a5a"); vl(ctx, x+23, y+14, 9, "#3a3a5a");
  // Desk side
  r(ctx, x+1, y+10, 24, 5, "#1a1a3a");
  hl(ctx, x+1, y+10, 24, "#2a2a4a");
  // Desktop (neon trim)
  r(ctx, x, y+8, 26, 3, "#222244");
  hl(ctx, x, y+8, 26, "#4a4a8a");
  hl(ctx, x, y+9, 26, "#333366");
  // Keyboard (on desk)
  r(ctx, x+6, y+7, 10, 2, "#1a1a33");
  hl(ctx, x+7, y+7, 8, "#333355");
  // Monitor glow on desk
  ctx.fillStyle = "rgba(0,150,255,0.06)";
  ctx.fillRect((x + 2) * S, (y + 4) * S, 22 * S, 8 * S);
}

function drawMonitor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number, working: boolean) {
  // Stand
  r(ctx, x+9, y+6, 4, 4, "#1a1a3a");
  r(ctx, x+6, y+9, 10, 2, "#111122");
  // Bezel
  r(ctx, x+1, y-5, 20, 13, "#111122");
  hl(ctx, x+1, y-5, 20, "#2a2a5a");
  // Screen
  r(ctx, x+2, y-4, 18, 11, "#000811");
  // Content
  if (working) {
    const sc = Math.floor(t * 3) % 10;
    const hex = color.replace('#', '');
    const rr = parseInt(hex.slice(0,2), 16);
    const gg = parseInt(hex.slice(2,4), 16);
    const bb = parseInt(hex.slice(4,6), 16);
    for (let i = 0; i < 4; i++) {
      const ly = y - 3 + ((i * 3 + sc) % 10);
      if (ly >= y-4 && ly < y+6) {
        r(ctx, x+3, ly, 5 + (i%3)*3, 1, color);
        r(ctx, x+3+6+(i%3)*3+1, ly, 3, 1, "#334455");
      }
    }
    // Cursor blink
    if (Math.floor(t * 2) % 2 === 0) d(ctx, x+3, y+5, "#ffffff");
    // Screen glow
    ctx.fillStyle = `rgba(${rr},${gg},${bb},0.12)`;
    ctx.fillRect((x-1)*S, (y-7)*S, 24*S, 20*S);
  } else {
    // Screensaver pulse
    const hex = color.replace('#', '');
    const rr = parseInt(hex.slice(0,2), 16);
    const gg = parseInt(hex.slice(2,4), 16);
    const bb = parseInt(hex.slice(4,6), 16);
    const alpha = 0.2 + Math.sin(t * 0.7 + parseInt(hex.slice(0,2), 16)) * 0.15;
    ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
    ctx.fillRect((x+3)*S, (y-2)*S, 14*S, 6*S);
  }
  // Neon bezel glow
  ctx.strokeStyle = working ? `${color}66` : "#2a2a5a";
  ctx.lineWidth = S * 0.6;
  ctx.strokeRect((x+1)*S, (y-5)*S, 20*S, 13*S);
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  // Back
  r(ctx, x+7, y+18, 12, 11, "#0a1a2a");
  hl(ctx, x+7, y+18, 12, color + "44");
  // Seat
  r(ctx, x+5, y+27, 16, 4, "#112233");
  hl(ctx, x+5, y+27, 16, "#1a3344");
  // Legs
  vl(ctx, x+6, y+30, 6, "#0a1a2a"); vl(ctx, x+18, y+30, 6, "#0a1a2a");
  vl(ctx, x+10, y+30, 6, "#0a1a2a"); vl(ctx, x+14, y+30, 6, "#0a1a2a");
}

// ─── Speech Bubble ─────────────────────────────────────────────────────────
function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.save();
  // Measure text
  ctx.font = `bold ${S * 1.8}px 'Courier New', monospace`;
  const tw = ctx.measureText(text).width;
  const bw = tw + S * 4;
  const bh = S * 8;
  const bx = Math.max(2 * S, Math.min(x * S - bw / 2, (CW - 2) * S - bw));
  const by = y * S - bh - S * 4;

  // Bubble bg
  ctx.fillStyle = "#0a0a1aee";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, S * 2);
  ctx.fill();

  // Bubble border (colored)
  ctx.strokeStyle = color;
  ctx.lineWidth = S * 0.7;
  ctx.stroke();

  // Tail
  ctx.fillStyle = "#0a0a1aee";
  ctx.beginPath();
  ctx.moveTo(x * S - S, by + bh);
  ctx.lineTo(x * S + S, by + bh);
  ctx.lineTo(x * S, by + bh + S * 3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = S * 0.5;
  ctx.stroke();

  // Text
  ctx.fillStyle = color;
  ctx.font = `bold ${S * 1.8}px 'Courier New', monospace`;
  ctx.fillText(text, bx + S * 2, by + bh - S * 2);
  ctx.restore();
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const [hovered, setHovered] = useState<string | null>(null);

  const workingRef = useRef<Record<string, boolean>>({
    eli: true, scout: true, pen: false, closer: true, buzz: false, ledger: true,
  });

  // Rotate activity messages every ~3s per agent
  const activityIdxRef = useRef<Record<string, number>>(
    Object.fromEntries(AGENTS.map((a, i) => [a.id, i % a.activities.length]))
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    tRef.current += 0.04;
    const t = tRef.current;

    // Rotate activities every 3s
    if (Math.round(t * 25) % 75 === 0) {
      AGENTS.forEach(a => {
        activityIdxRef.current[a.id] = (activityIdxRef.current[a.id] + 1) % a.activities.length;
      });
    }

    ctx.clearRect(0, 0, CW * S, CH * S);
    drawBG(ctx, t);

    // Portholes (on ship wall)
    drawPorthole(ctx, 18,  53, t);
    drawPorthole(ctx, 110, 53, t);
    drawPorthole(ctx, 202, 53, t);

    // Jolly Roger flag (top left corner — on mast suggestion)
    const flagWave = Math.sin(t * 2) * 1.5;
    // Mast stub at top
    vl(ctx, 3, 0, 12, "#5a3010");
    r(ctx, 4, 0, 2, 12, "#7a4a20");
    // Flag
    r(ctx, 5, 1, 14, 9, "#111111");
    hl(ctx, 5, 1+Math.round(flagWave), 14, "#1a1a1a");
    // Skull
    r(ctx, 9, 2, 6, 4, "#eeeeee");
    r(ctx, 10, 5, 4, 2, "#eeeeee");
    d(ctx, 10, 3, "#111111"); d(ctx, 13, 3, "#111111");
    // Crossbones
    d(ctx, 8, 6, "#eeeeee"); d(ctx, 15, 6, "#eeeeee");
    d(ctx, 9, 7, "#eeeeee"); d(ctx, 14, 7, "#eeeeee");
    d(ctx, 10, 8, "#eeeeee"); d(ctx, 13, 8, "#eeeeee");
    d(ctx, 8, 8, "#eeeeee"); d(ctx, 15, 8, "#eeeeee");

    // Barrel (right side — Going Merry prop)
    r(ctx, CW-12, 100, 10, 14, "#6a4010");
    hl(ctx, CW-12, 100, 10, "#8a5a20"); hl(ctx, CW-12, 107, 10, "#8a5a20"); hl(ctx, CW-12, 113, 10, "#8a5a20");
    // Barrel hoops (metal)
    r(ctx, CW-13, 102, 12, 2, "#666666");
    r(ctx, CW-13, 109, 12, 2, "#666666");
    hl(ctx, CW-13, 102, 12, "#888888"); hl(ctx, CW-13, 109, 12, "#888888");

    // Anchor (left wall decoration)
    vl(ctx, 4, 65, 18, "#888899");
    r(ctx, 2, 65, 5, 2, "#888899"); // stock
    r(ctx, 2, 80, 2, 4, "#888899"); r(ctx, 7, 80, 2, 4, "#888899"); // flukes
    d(ctx, 3, 83, "#888899"); d(ctx, 8, 83, "#888899"); // tips
    r(ctx, 4, 62, 3, 4, "#aaaaaa"); // ring
    hl(ctx, 3, 62, 5, "#cccccc");

    // Draw all workstations
    AGENTS.forEach((agent, i) => {
      const { x, y } = DESKS[i];
      const working = workingRef.current[agent.id] ?? true;
      drawChair(ctx, x, y, agent.color);
      drawDesk(ctx, x, y);
      drawMonitor(ctx, x + 3, y + 2, agent.color, t, working);
      CHARACTER_DRAWERS[i](ctx, x + 5, y - 24, t, working);

      // Status dot
      r(ctx, x + 24, y - 26, 2, 2, working ? "#44ff88" : "#555566");
    });

    // Speech bubbles — show for hovered OR cycle through active ones
    const showId = hovered ?? AGENTS[Math.floor(t / 2.5) % AGENTS.length].id;
    const showIdx = AGENTS.findIndex(a => a.id === showId);
    if (showIdx >= 0) {
      const ag = AGENTS[showIdx];
      const { x, y } = DESKS[showIdx];
      const msg = ag.activities[activityIdxRef.current[ag.id]];
      drawBubble(ctx, x + 13, y - 26, msg, ag.color);
    }

    // Hover highlight
    if (hovered) {
      const idx = AGENTS.findIndex(a => a.id === hovered);
      if (idx >= 0) {
        const { x, y } = DESKS[idx];
        ctx.strokeStyle = AGENTS[idx].color;
        ctx.lineWidth = S * 0.7;
        ctx.setLineDash([S * 2, S]);
        ctx.strokeRect((x - 2) * S, (y - 28) * S, 32 * S, 58 * S);
        ctx.setLineDash([]);
      }
    }

    // HUD bar
    r(ctx, 0, CH - 9, CW, 9, "#06060f");
    hl(ctx, 0, CH - 9, CW, "#2a2a5a");
    ctx.fillStyle = "#6c63ff";
    ctx.font = `bold ${S * 1.7}px 'Courier New', monospace`;
    ctx.fillText("⚓ WIRO 4x4  Eli HQ", 3 * S, (CH - 2) * S);
    const active = Object.values(workingRef.current).filter(Boolean).length;
    ctx.fillStyle = active >= 4 ? "#44ff88" : "#ffaa44";
    ctx.font = `bold ${S * 1.7}px 'Courier New', monospace`;
    ctx.fillText(`${active}/6 active`, (CW - 32) * S, (CH - 2) * S);

    animRef.current = requestAnimationFrame(draw);
  }, [hovered]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  function getAgentAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect2 = e.currentTarget.getBoundingClientRect();
    const scaleX = (CW * S) / rect2.width;
    const scaleY = (CH * S) / rect2.height;
    const mx = (e.clientX - rect2.left) * scaleX / S;
    const my = (e.clientY - rect2.top) * scaleY / S;
    return AGENTS.find((_, i) => {
      const { x, y } = DESKS[i];
      return mx >= x-2 && mx <= x+30 && my >= y-28 && my <= y+32;
    });
  }

  return (
    <div className="space-y-4">
      {/* Canvas card */}
      <div className="rounded-2xl overflow-hidden border border-[#2a2a5a] bg-[#06060f] shadow-2xl shadow-black/70">
        {/* macOS-style titlebar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a3a] bg-[#0a0a1a]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[11px] font-bold text-[#6c63ff] tracking-widest">⚓ ELI HQ — PIXEL OFFICE</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44ff88] animate-pulse" />
            <span className="text-[9px] text-[#44ff88] font-mono">LIVE</span>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CW * S}
          height={CH * S}
          className="w-full block cursor-crosshair"
          style={{ imageRendering: "pixelated" }}
          onMouseMove={e => setHovered(getAgentAt(e)?.id ?? null)}
          onMouseLeave={() => setHovered(null)}
          onClick={e => {
            const ag = getAgentAt(e);
            if (ag) workingRef.current[ag.id] = !workingRef.current[ag.id];
          }}
        />

        {/* Hint bar */}
        <div className="px-4 py-1.5 border-t border-[#1a1a3a] bg-[#0a0a1a] flex items-center gap-6">
          <span className="text-[10px] text-[#4a4a7a] font-mono">Hover to inspect · Click to toggle</span>
          <span className="text-[10px] text-[#4a4a7a] font-mono ml-auto">Bubbles rotate every 3s</span>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AGENTS.map(agent => {
          const working = workingRef.current[agent.id];
          const isHov = hovered === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => { workingRef.current[agent.id] = !workingRef.current[agent.id]; }}
              onMouseEnter={() => setHovered(agent.id)}
              onMouseLeave={() => setHovered(null)}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left"
              style={{
                background: isHov ? `${agent.color}20` : `${agent.color}0c`,
                borderColor: isHov ? agent.color : `${agent.color}30`,
                boxShadow: isHov ? `0 0 12px ${agent.color}33` : "none",
              }}
            >
              <div className="text-xl leading-none">{agent.opEmoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold leading-none" style={{ color: agent.color }}>
                    {agent.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono">({agent.opChar})</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{agent.role}</div>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                working ? "bg-green-500/20 text-green-400" : "bg-gray-500/15 text-gray-500"
              }`}>
                {working ? "ON" : "IDLE"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
