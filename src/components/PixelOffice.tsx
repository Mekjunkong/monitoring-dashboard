"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Iso engine ────────────────────────────────────────────────────────────
const CW = 245, CH = 195, S = 3;
const HW = 12, HH = 6;        // tile half-width / half-height
const OX = 122, OY = 54;      // canvas origin = room back corner
const WALL_H = 30;
const DESK_H = 7;

function ts(c: number, r: number) {
  return { x: OX + (c - r) * HW, y: OY + (c + r) * HH };
}

function poly(ctx: CanvasRenderingContext2D, pts: [number, number][], fill: string, line?: string) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * S, pts[0][1] * S);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * S, pts[i][1] * S);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = 0.8; ctx.stroke(); }
}

// Floor diamond
function tile(ctx: CanvasRenderingContext2D, c: number, r: number, fill: string, line?: string) {
  const n = ts(c, r), e = ts(c + 1, r), s = ts(c + 1, r + 1), w = ts(c, r + 1);
  poly(ctx, [[n.x, n.y], [e.x, e.y], [s.x, s.y], [w.x, w.y]], fill, line);
}

// Isometric box
function box(ctx: CanvasRenderingContext2D,
  c: number, r: number, W: number, D: number, H: number,
  topC: string, leftC: string, rightC: string, lineC?: string) {
  const fl = ts(c, r + D), fp = ts(c + W, r + D), fr = ts(c + W, r), bk = ts(c, r);
  // Front-left face
  poly(ctx, [[fl.x, fl.y], [fp.x, fp.y], [fp.x, fp.y - H], [fl.x, fl.y - H]], leftC, lineC);
  // Front-right face
  poly(ctx, [[fr.x, fr.y], [fp.x, fp.y], [fp.x, fp.y - H], [fr.x, fr.y - H]], rightC, lineC);
  // Top face
  poly(ctx, [[bk.x, bk.y - H], [fr.x, fr.y - H], [fp.x, fp.y - H], [fl.x, fl.y - H]], topC, lineC);
}

// Right wall panel (row = 0)
function wallR(ctx: CanvasRenderingContext2D, c: number, fill: string, line?: string) {
  const p1 = ts(c, 0), p2 = ts(c + 1, 0);
  poly(ctx, [[p1.x, p1.y], [p2.x, p2.y], [p2.x, p2.y - WALL_H], [p1.x, p1.y - WALL_H]], fill, line);
}

// Left wall panel (col = 0)
function wallL(ctx: CanvasRenderingContext2D, r: number, fill: string, line?: string) {
  const p1 = ts(0, r), p2 = ts(0, r + 1);
  poly(ctx, [[p1.x, p1.y], [p2.x, p2.y], [p2.x, p2.y - WALL_H], [p1.x, p1.y - WALL_H]], fill, line);
}

// ── Agent defs ────────────────────────────────────────────────────────────
interface Agent {
  id: string; name: string; role: string; color: string;
  opChar: string; opEmoji: string; logs: string[]; taskPresets: string[];
}
const AGENTS: Agent[] = [
  { id:"eli",    name:"Eli",    role:"Orchestrator", color:"#f0c000", opChar:"Luffy",  opEmoji:"🏴‍☠️",
    logs:["[09:01] Dispatching to 9 crew","[09:05] All agents online ✓","[09:12] Routing inquiry → Closer","[09:18] Daily briefing sent","[09:31] All systems nominal"],
    taskPresets:["Run daily summary","Check all agents","Weekly report","Dispatch mission"] },
  { id:"scout",  name:"Scout",  role:"Analytics",    color:"#ff8c00", opChar:"Nami",   opEmoji:"🗺️",
    logs:["[09:00] Traffic: 1,240 today","[09:15] Inthanon page trending ↑","[09:22] +18% vs last week","[09:35] 3 new organic leads","[09:44] Top city: Tel Aviv 🇮🇱"],
    taskPresets:["Traffic report","Top pages","Keyword rankings","Funnel analysis"] },
  { id:"pen",    name:"Pen",    role:"Content/SEO",  color:"#9b59b6", opChar:"Robin",  opEmoji:"📖",
    logs:["[08:45] Blog draft: Doi Inthanon","[09:10] SEO meta updated ✓","[09:28] 5 keywords researched","[09:40] Proofreading tour pages","[09:55] Content calendar done"],
    taskPresets:["Write blog post","Tour description","Generate FAQ","IG captions"] },
  { id:"closer", name:"Closer", role:"Bookings",     color:"#3498db", opChar:"Sanji",  opEmoji:"🦵",
    logs:["[09:03] 2 new inquiries 🔔","[09:17] David (IL) — price sent","[09:25] Sarah confirmed ✓","[09:38] Follow-up: Anna 3pax","[09:50] Pipeline: 5 leads active"],
    taskPresets:["Check inquiries","Follow up leads","Booking confirm","Price quote"] },
  { id:"buzz",   name:"Buzz",   role:"Social",       color:"#e67e22", opChar:"Usopp",  opEmoji:"🎯",
    logs:["[09:05] IG reel: 320 views 🔥","[09:20] FB posts scheduled ×3","[09:33] Trending: #ChiangMai","[09:48] Story uploaded ✓","[09:59] Engagement +12%"],
    taskPresets:["Write IG captions","Post plan","Trending tags","FB promotion"] },
  { id:"ledger", name:"Ledger", role:"Finance",      color:"#2ecc71", opChar:"Zoro",   opEmoji:"⚔️",
    logs:["[09:00] MTD revenue: ฿45,000","[09:15] Invoice #47 sent ✓","[09:22] Expenses logged","[09:40] April P&L: healthy 📈","[09:55] 3 payments received"],
    taskPresets:["MTD report","Pending invoices","Profit margin","Export expenses"] },
  { id:"franky", name:"Franky", role:"Tech/Web",     color:"#00b4ff", opChar:"Franky", opEmoji:"🤖",
    logs:["[09:02] Vercel deploy: ✅","[09:18] Lighthouse score: 94","[09:30] SSL cert: 60d valid","[09:45] 0 broken links ✓","[09:58] Load: 1.2s SUPER!"],
    taskPresets:["Website audit","Vercel status","Page speed","Broken links"] },
  { id:"chopper",name:"Chopper",role:"Customer Care",color:"#ff6b9d", opChar:"Chopper",opEmoji:"🦌",
    logs:["[09:10] Review replied ⭐×5","[09:25] WhatsApp follow-up ×2","[09:37] Survey sent","[09:48] CSAT: 4.9/5 ✓","[09:55] 0 complaints pending"],
    taskPresets:["Reply reviews","Post-tour survey","WhatsApp msg","Check feedback"] },
  { id:"jinbe",  name:"Jinbe",  role:"Operations",   color:"#4a9eff", opChar:"Jinbe",  opEmoji:"🌊",
    logs:["[09:00] Weather: ⛅ 31°C","[09:15] Route clear ✓","[09:30] Vehicle #2 svc due 🔧","[09:42] Tomorrow: partly cloudy","[09:58] 2 tours on schedule ✅"],
    taskPresets:["7-day forecast","Route check","Vehicle log","Safety check"] },
];

// Desk grid positions (col, row)
const DESK_POS = [
  { col:1, row:2 }, { col:4, row:2 }, { col:7, row:2 },
  { col:1, row:5 }, { col:4, row:5 }, { col:7, row:5 },
  { col:1, row:7 }, { col:4, row:7 }, { col:7, row:7 },
];

// ── Character sprites (feet at oy, body goes up) ──────────────────────────
function r2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S);
}
function d2(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) { r2(ctx, x, y, 1, 1, c); }
function hl2(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string) { r2(ctx, x, y, w, 1, c); }

function drawLuffy(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0;
  r2(ctx,ox+2,oy-2+b,4,2,"#442200"); r2(ctx,ox+8,oy-2+b,4,2,"#442200");
  r2(ctx,ox+2,oy-8+b,10,6,"#1155aa");
  r2(ctx,ox+2,oy-16+b,10,8,"#cc1100"); r2(ctx,ox+5,oy-16+b,4,8,"#ffcc99");
  if(w){const sw=Math.sin(t*4)>0?1:0;r2(ctx,ox,oy-14+b+sw,3,5,"#ffcc99");r2(ctx,ox+11,oy-14+b-sw,3,5,"#ffcc99");}
  else{r2(ctx,ox,oy-13+b,3,5,"#ffcc99");r2(ctx,ox+11,oy-13+b,3,5,"#ffcc99");}
  r2(ctx,ox+5,oy-18+b,4,3,"#ffcc99");
  r2(ctx,ox+3,oy-24+b,8,7,"#ffcc99");
  hl2(ctx,ox+1,oy-25+b,12,"#c8a000"); r2(ctx,ox+3,oy-28+b,8,3,"#f0c000");
  hl2(ctx,ox+3,oy-22+b,8,"#cc2200");
  d2(ctx,ox+5,oy-22+b,"#111"); d2(ctx,ox+8,oy-22+b,"#111"); d2(ctx,ox+5,oy-21+b,"#cc3333");
  r2(ctx,ox+4,oy-20+b,6,1,"#111");
}
function drawNami(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0;
  r2(ctx,ox+3,oy-2+b,4,2,"#aa3300"); r2(ctx,ox+7,oy-2+b,4,2,"#aa3300");
  r2(ctx,ox+4,oy-6+b,3,4,"#ffcc99"); r2(ctx,ox+7,oy-6+b,3,4,"#ffcc99");
  r2(ctx,ox+2,oy-13+b,10,7,"#004499"); r2(ctx,ox+3,oy-18+b,8,5,"#ff6600");
  r2(ctx,ox+1,oy-17+b,2,5,"#ffcc99");
  if(w){r2(ctx,ox+13,oy-19+b,2,8,"#88aa44");r2(ctx,ox+11,oy-17+b,2,5,"#ffcc99");}
  else{r2(ctx,ox+11,oy-17+b,2,5,"#ffcc99");}
  r2(ctx,ox+3,oy-24+b,8,7,"#ffcc99"); d2(ctx,ox+4,oy-22+b,"#0055cc");
  d2(ctx,ox+5,oy-22+b,"#552200"); d2(ctx,ox+8,oy-22+b,"#552200"); r2(ctx,ox+5,oy-20+b,4,1,"#aa5522");
  r2(ctx,ox+3,oy-28+b,9,2,"#ff8c00"); r2(ctx,ox+2,oy-26+b,10,6,"#ff8c00");
}
function drawRobin(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0;
  r2(ctx,ox+3,oy-2+b,4,2,"#1a0a2a"); r2(ctx,ox+7,oy-2+b,4,2,"#1a0a2a");
  r2(ctx,ox+4,oy-6+b,3,4,"#f0d0b0"); r2(ctx,ox+7,oy-6+b,3,4,"#f0d0b0");
  r2(ctx,ox+2,oy-11+b,10,5,"#3a0a5a"); r2(ctx,ox+2,oy-20+b,10,9,"#4a1a6a");
  if(w){r2(ctx,ox-2,oy-18+b,3,6,"#f0d0b0");r2(ctx,ox+13,oy-18+b,3,6,"#f0d0b0");r2(ctx,ox+1,oy-19+b,2,5,"#f0d0b0");r2(ctx,ox+11,oy-19+b,2,5,"#f0d0b0");}
  else{r2(ctx,ox+1,oy-17+b,2,5,"#f0d0b0");r2(ctx,ox+11,oy-17+b,2,5,"#f0d0b0");}
  r2(ctx,ox+3,oy-27+b,8,7,"#f0d0b0");
  r2(ctx,ox+5,oy-25+b,2,1,"#1a0a4a"); r2(ctx,ox+8,oy-25+b,2,1,"#1a0a4a"); r2(ctx,ox+5,oy-23+b,4,1,"#aa7755");
  r2(ctx,ox+3,oy-31+b,8,5,"#1a0a4a"); r2(ctx,ox+2,oy-27+b,2,5,"#1a0a4a"); r2(ctx,ox+12,oy-27+b,2,5,"#1a0a4a");
}
function drawSanji(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0;
  r2(ctx,ox+1,oy-2+b,5,2,"#111"); r2(ctx,ox+6,oy-2+b,6,2,"#111");
  if(w){const k=Math.sin(t*5)>0?1:-1;r2(ctx,ox+2,oy-8+b,5,6,"#1a1a2a");r2(ctx,ox+7+k,oy-10+b,5,8,"#1a1a2a");r2(ctx,ox+1,oy-16+b,2,5,"#ffddbb");r2(ctx,ox+11,oy-16+b,2,5,"#ffddbb");}
  else{r2(ctx,ox+2,oy-8+b,5,6,"#1a1a2a");r2(ctx,ox+7,oy-8+b,5,6,"#1a1a2a");r2(ctx,ox+1,oy-15+b,2,5,"#ffddbb");r2(ctx,ox+11,oy-15+b,2,5,"#ffddbb");}
  r2(ctx,ox+2,oy-20+b,10,10,"#1a1a2a"); r2(ctx,ox+5,oy-20+b,4,5,"#ddddee");
  d2(ctx,ox+6,oy-18+b,"#cc1100"); d2(ctx,ox+6,oy-17+b,"#cc1100");
  r2(ctx,ox+3,oy-27+b,8,7,"#ffddbb"); d2(ctx,ox+8,oy-25+b,"#111"); d2(ctx,ox+8,oy-26+b,"#333");
  r2(ctx,ox+9,oy-23+b,4,1,"#fff"); d2(ctx,ox+12,oy-23+b,"#ff4400"); r2(ctx,ox+5,oy-23+b,4,1,"#aa5522");
  r2(ctx,ox+3,oy-31+b,8,5,"#ddaa00"); d2(ctx,ox+4,oy-26+b,"#ddaa00");
}
function drawUsopp(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0;
  r2(ctx,ox+2,oy-2+b,5,2,"#442200"); r2(ctx,ox+7,oy-2+b,5,2,"#442200");
  r2(ctx,ox+3,oy-7+b,4,5,"#885500"); r2(ctx,ox+7,oy-7+b,4,5,"#885500");
  r2(ctx,ox+2,oy-17+b,10,10,"#cc7722"); r2(ctx,ox+5,oy-17+b,4,10,"#885500");
  r2(ctx,ox+1,oy-15+b,2,6,"#cc9966");
  if(w){r2(ctx,ox+12,oy-17+b,2,6,"#cc9966");r2(ctx,ox+14,oy-18+b,2,4,"#885500");d2(ctx,ox+14,oy-19+b,"#ff6600");}
  else{r2(ctx,ox+12,oy-15+b,2,6,"#cc9966");}
  r2(ctx,ox+3,oy-24+b,8,7,"#cc9966"); r2(ctx,ox+7,oy-21+b,6,2,"#bb8855");
  d2(ctx,ox+5,oy-23+b,"#111"); d2(ctx,ox+8,oy-23+b,"#111"); r2(ctx,ox+5,oy-20+b,4,1,"#884422");
  r2(ctx,ox+2,oy-30+b,10,3,"#cc8822"); hl2(ctx,ox+1,oy-28+b,12,"#aa6611");
  r2(ctx,ox+3,oy-31+b,8,6,"#1a1a1a"); r2(ctx,ox+2,oy-28+b,2,5,"#1a1a1a"); r2(ctx,ox+12,oy-28+b,2,5,"#1a1a1a");
}
function drawZoro(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0;
  r2(ctx,ox+2,oy-2+b,4,3,"#111"); r2(ctx,ox+7,oy-2+b,4,3,"#111");
  r2(ctx,ox+2,oy-8+b,10,6,"#1a2a1a"); r2(ctx,ox+2,oy-17+b,10,9,"#ddeedd"); r2(ctx,ox+5,oy-17+b,4,9,"#d4aa88");
  r2(ctx,ox+1,oy-16+b,2,6,"#d4aa88"); r2(ctx,ox+1,oy-16+b,2,2,"#fff");
  if(w){r2(ctx,ox+11,oy-16+b,2,6,"#d4aa88");r2(ctx,ox+13,oy-21+b,1,12,"#aaaacc");r2(ctx,ox-1,oy-21+b,1,12,"#aaaacc");d2(ctx,ox+7,oy-20+b,"#aaaacc");}
  else{r2(ctx,ox+11,oy-16+b,2,6,"#d4aa88");r2(ctx,ox+12,oy-14+b,1,8,"#aaaacc");}
  r2(ctx,ox+3,oy-24+b,8,7,"#d4aa88");
  ctx.fillStyle="#ff3300"; ctx.fillRect((ox+8)*S,(oy-23+b)*S,S,4*S);
  d2(ctx,ox+5,oy-22+b,"#111"); d2(ctx,ox+8,oy-22+b,"#111"); hl2(ctx,ox+5,oy-19+b,4,"#884422"); d2(ctx,ox+3,oy-21+b,"#cccc00");
  r2(ctx,ox+4,oy-31+b,6,5,"#1a7a1a"); r2(ctx,ox+5,oy-33+b,4,3,"#22aa22");
}
function drawFranky(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3)*.6):0;
  r2(ctx,ox+1,oy-2+b,5,2,"#224466"); r2(ctx,ox+6,oy-2+b,5,2,"#224466");
  r2(ctx,ox+2,oy-7+b,4,5,"#4488bb"); hl2(ctx,ox+2,oy-5+b,4,"#88ccff"); r2(ctx,ox+7,oy-7+b,4,5,"#4488bb");
  r2(ctx,ox+2,oy-12+b,10,5,"#0044aa"); r2(ctx,ox+1,oy-22+b,12,10,"#0066aa"); r2(ctx,ox+5,oy-22+b,4,10,"#ffddbb");
  if(w){const mw=Math.sin(t*4)>0?1:0;r2(ctx,ox-3,oy-19+b+mw,5,6,"#4488bb");r2(ctx,ox+12,oy-19+b-mw,5,6,"#4488bb");}
  else{r2(ctx,ox-3,oy-18+b,5,5,"#4488bb");r2(ctx,ox+12,oy-18+b,5,5,"#4488bb");}
  r2(ctx,ox+3,oy-29+b,8,7,"#ffddbb"); r2(ctx,ox+4,oy-27+b,3,2,"#ffcc00"); r2(ctx,ox+8,oy-27+b,3,2,"#ffcc00");
  r2(ctx,ox+4,oy-23+b,6,1,"#111"); d2(ctx,ox+4,oy-24+b,"#111"); d2(ctx,ox+9,oy-24+b,"#111");
  r2(ctx,ox+1,oy-36+b,12,8,"#0088cc"); r2(ctx,ox+3,oy-37+b,8,3,"#00aaff"); hl2(ctx,ox+1,oy-37+b,12,"#44ccff");
}
function drawChopper(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*4)*.5):0;
  r2(ctx,ox+3,oy-2+b,4,2,"#555"); r2(ctx,ox+7,oy-2+b,4,2,"#555");
  r2(ctx,ox+4,oy-7+b,3,5,"#8b5e3c"); r2(ctx,ox+7,oy-7+b,3,5,"#8b5e3c");
  r2(ctx,ox+3,oy-15+b,8,8,"#a0714f"); r2(ctx,ox+1,oy-13+b,3,4,"#a0714f"); r2(ctx,ox+10,oy-13+b,3,4,"#a0714f");
  if(w){r2(ctx,ox+12,oy-14+b,5,4,"#cc3366");r2(ctx,ox+14,oy-11+b,1,2,"#fff");r2(ctx,ox+13,oy-10+b,3,1,"#fff");}
  r2(ctx,ox+2,oy-24+b,10,8,"#a0714f");
  ctx.fillStyle="#ff2200"; ctx.beginPath(); ctx.arc((ox+7)*S+S/2,(oy-19+b)*S+S/2,S*1.2,0,Math.PI*2); ctx.fill();
  r2(ctx,ox+4,oy-23+b,2,2,"#111"); r2(ctx,ox+8,oy-23+b,2,2,"#111"); d2(ctx,ox+5,oy-23+b,"#fff"); d2(ctx,ox+9,oy-23+b,"#fff");
  r2(ctx,ox+5,oy-21+b,4,1,"#7a3a1a");
  r2(ctx,ox+2,oy-29+b,10,5,"#ff99bb"); r2(ctx,ox+1,oy-25+b,12,2,"#ff99bb");
  r2(ctx,ox+6,oy-28+b,2,4,"#cc3366"); r2(ctx,ox+5,oy-27+b,4,2,"#cc3366");
  ctx.fillStyle="#8b4513"; ctx.fillRect((ox+4)*S,(oy-36+b)*S,S,5*S); ctx.fillRect((ox+10)*S,(oy-36+b)*S,S,5*S);
  r2(ctx,ox+2,oy-36+b,3,2,"#8b4513"); r2(ctx,ox+9,oy-36+b,3,2,"#8b4513");
}
function drawJinbe(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*2.5)*.8):0;
  r2(ctx,ox+1,oy-2+b,5,3,"#111"); r2(ctx,ox+7,oy-2+b,5,3,"#111");
  r2(ctx,ox+2,oy-8+b,10,6,"#112244"); r2(ctx,ox+1,oy-19+b,12,11,"#ddddee"); r2(ctx,ox+5,oy-19+b,4,11,"#2255aa");
  hl2(ctx,ox+1,oy-19+b,12,"#fff");
  r2(ctx,ox+4,oy-19+b,3,5,"#ddddee"); r2(ctx,ox+7,oy-19+b,3,5,"#ddddee");
  if(w){const sw=Math.sin(t*3)>0?1:0;r2(ctx,ox-2,oy-17+b+sw,4,7,"#2255aa");r2(ctx,ox+12,oy-17+b-sw,4,7,"#2255aa");}
  else{r2(ctx,ox-2,oy-16+b,4,6,"#2255aa");r2(ctx,ox+12,oy-16+b,4,6,"#2255aa");}
  r2(ctx,ox-1,oy-19+b,3,3,"#ddddee"); r2(ctx,ox+12,oy-19+b,3,3,"#ddddee");
  r2(ctx,ox+1,oy-28+b,12,9,"#2255aa"); r2(ctx,ox+2,oy-27+b,10,8,"#2255aa");
  r2(ctx,ox+1,oy-28+b,2,4,"#1a4488"); r2(ctx,ox+11,oy-28+b,2,4,"#1a4488");
  r2(ctx,ox+4,oy-26+b,3,2,"#fff"); r2(ctx,ox+8,oy-26+b,3,2,"#fff");
  r2(ctx,ox+5,oy-26+b,2,2,"#002288"); r2(ctx,ox+9,oy-26+b,2,2,"#002288");
  hl2(ctx,ox+5,oy-23+b,4,"#1a3366");
}
const CHARACTER_DRAWERS = [drawLuffy,drawNami,drawRobin,drawSanji,drawUsopp,drawZoro,drawFranky,drawChopper,drawJinbe];

// ── Plant helper ──────────────────────────────────────────────────────────
function drawPlant(ctx: CanvasRenderingContext2D, sc: {x:number,y:number}, t: number, idx: number) {
  const sway = Math.sin(t * 0.8 + idx) * 0.5;
  // pot
  box(ctx, 0, 0, 0, 0, 0, "#8b4513", "#6a3010", "#7a3a18"); // placeholder - draw as circle
  ctx.fillStyle = "#7a4010";
  ctx.fillRect((sc.x - 3) * S, (sc.y - 2) * S, 6 * S, 4 * S);
  ctx.fillStyle = "#9a5020";
  ctx.fillRect((sc.x - 2) * S, (sc.y - 3) * S, 4 * S, 2 * S);
  // stem
  ctx.fillStyle = "#2a6a18";
  ctx.fillRect((sc.x - 0.5) * S, (sc.y - 10) * S, S, 8 * S);
  // leaves
  ctx.fillStyle = "#2d8a20";
  ctx.beginPath();
  ctx.ellipse((sc.x + sway) * S, (sc.y - 13) * S, 5 * S, 7 * S, sway * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3aaa28";
  ctx.beginPath();
  ctx.ellipse((sc.x + 3 + sway) * S, (sc.y - 12) * S, 4 * S, 5 * S, 0.3 + sway * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a6010";
  ctx.beginPath();
  ctx.ellipse((sc.x - 3 - sway) * S, (sc.y - 11) * S, 3 * S, 5 * S, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Main scene ────────────────────────────────────────────────────────────
function drawIsoScene(
  ctx: CanvasRenderingContext2D, t: number,
  agents: Agent[], workingRef: React.MutableRefObject<Record<string,boolean>>,
  logIdxRef: React.MutableRefObject<Record<string,number>>,
  hovered: string | null, notifyIds: Set<string>
) {
  // ── Background ──────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, OY * S);
  bgGrad.addColorStop(0, "#08041a"); bgGrad.addColorStop(1, "#100830");
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, CW * S, CH * S);

  // ── RIGHT WALL (row=0) ──────────────────────────────────────────────
  for (let c = 0; c < 10; c++) {
    const shades = ["#1c1038","#201240","#1a0e34","#201240","#1c1038"];
    wallR(ctx, c, shades[c % shades.length]);
    // Wall stripe decoration
    const p1 = ts(c, 0), p2 = ts(c + 1, 0);
    poly(ctx, [[p1.x,p1.y-WALL_H],[p2.x,p2.y-WALL_H],[p2.x,p2.y-WALL_H+2],[p1.x,p1.y-WALL_H+2]], "#4a2a7a");

    // Windows at col 2 and 6
    if (c === 2 || c === 6) {
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const wTop = mid.y - WALL_H + 5;
      // Window frame
      poly(ctx, [[mid.x-4,wTop],[mid.x+4,wTop],[mid.x+4,wTop+11],[mid.x-4,wTop+11]], "#2a1a5a");
      // Sky gradient in window
      const wg = ctx.createLinearGradient(0, wTop * S, 0, (wTop + 11) * S);
      wg.addColorStop(0, "#1a4a8a"); wg.addColorStop(1, "#3388cc");
      ctx.fillStyle = wg;
      ctx.fillRect((mid.x - 3) * S, (wTop + 1) * S, 6 * S, 9 * S);
      // Window cross
      ctx.fillStyle = "#2a1a5a";
      ctx.fillRect(mid.x * S - 0.5, (wTop + 1) * S, S, 9 * S);
      ctx.fillRect((mid.x - 3) * S, (wTop + 5) * S, 6 * S, S);
      // Glow below window
      ctx.fillStyle = `rgba(50,130,200,${0.06 + Math.sin(t * 0.5 + c) * 0.02})`;
      ctx.fillRect((mid.x - 4) * S, (wTop + 10) * S, 8 * S, 70 * S);
    }
  }

  // ── LEFT WALL (col=0) ───────────────────────────────────────────────
  for (let r = 0; r < 9; r++) {
    wallL(ctx, r, r % 2 === 0 ? "#241645" : "#1e1238");
    // Trim at top
    const p1 = ts(0, r), p2 = ts(0, r + 1);
    poly(ctx, [[p1.x,p1.y-WALL_H],[p2.x,p2.y-WALL_H],[p2.x,p2.y-WALL_H+2],[p1.x,p1.y-WALL_H+2]], "#3a2060");

    // Artwork / poster on left wall at row 2
    if (r === 2) {
      const mid = { x: (ts(0,r).x + ts(0,r+1).x) / 2, y: (ts(0,r).y + ts(0,r+1).y) / 2 };
      const aTop = mid.y - WALL_H + 6;
      poly(ctx,[[mid.x-5,aTop],[mid.x+5,aTop],[mid.x+5,aTop+10],[mid.x-5,aTop+10]],"#1a1a3a");
      poly(ctx,[[mid.x-4,aTop+1],[mid.x+4,aTop+1],[mid.x+4,aTop+9],[mid.x-4,aTop+9]],"#2a4a1a");
      // 🗺 map pixel art inside frame
      ctx.fillStyle="#4a8a4a"; ctx.fillRect((mid.x-3)*S,(aTop+2)*S,3*S,4*S);
      ctx.fillStyle="#3a5a8a"; ctx.fillRect((mid.x)*S,(aTop+2)*S,3*S,6*S);
      ctx.fillStyle="#8a8a2a"; ctx.fillRect((mid.x-3)*S,(aTop+6)*S,3*S,2*S);
    }
    // Logo/sign at row 5
    if (r === 5) {
      const mid = { x: (ts(0,r).x + ts(0,r+1).x) / 2, y: (ts(0,r).y + ts(0,r+1).y) / 2 };
      const aTop = mid.y - WALL_H + 5;
      poly(ctx,[[mid.x-6,aTop],[mid.x+6,aTop],[mid.x+6,aTop+8],[mid.x-6,aTop+8]],"#1a0a3a");
      ctx.fillStyle = "#f0c000";
      ctx.font = `bold ${S * 1.6}px 'Courier New', monospace`;
      ctx.fillText("WIRO", (mid.x - 5) * S, (aTop + 6) * S);
    }
  }

  // ── Build depth-sorted render list ──────────────────────────────────
  type Item = { depth: number; draw: () => void };
  const items: Item[] = [];

  // Floor tiles
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 10; c++) {
      const isRug = c >= 3 && c <= 7 && r >= 3 && r <= 6;
      const isRug2 = c >= 4 && c <= 6 && r >= 3 && r <= 6;
      const fc = isRug2 ? "#3a1a5a" : isRug ? "#2e1448" : ((c + r) % 2 === 0 ? "#c8a060" : "#b89050");
      const lc = isRug ? "#2a1042" : "#9a7840";
      const dc = c, dr2 = r;
      items.push({ depth: c + r, draw: () => tile(ctx, dc, dr2, fc, lc) });
    }
  }

  // Bookshelf (near right wall)
  items.push({ depth: 2 + 1 - 0.4, draw: () => {
    box(ctx, 2, 1, 2, 0.7, 15, "#7a5a28", "#4a3010", "#5a3e18", "#2a1808");
    // colored book spines on shelf face
    const fp = ts(4, 1.7);
    const books = ["#cc2200","#2255aa","#22aa44","#aaaa22","#aa22aa","#22aaaa","#ff6600"];
    books.forEach((bc, i) => {
      ctx.fillStyle = bc;
      ctx.fillRect((fp.x - 7 + i * 2) * S, (fp.y - 11) * S, S * 1.5, 4 * S);
    });
    // Second shelf
    books.slice(0, 5).forEach((bc, i) => {
      ctx.fillStyle = bc;
      ctx.fillRect((fp.x - 5 + i * 2) * S, (fp.y - 6) * S, S * 1.5, 3 * S);
    });
  }});

  // Server rack (near right wall)
  items.push({ depth: 7 + 1 - 0.4, draw: () => {
    box(ctx, 7, 1, 1.5, 0.7, 18, "#1a2a3a", "#0a1620", "#122030", "#080e18");
    const fp = ts(8.5, 1.7);
    // LED indicators
    for (let i = 0; i < 6; i++) {
      const ledC = i % 3 === 0 ? "#44ff88" : i % 3 === 1 ? "#ffaa44" : "#4488ff";
      ctx.fillStyle = ledC;
      ctx.fillRect((fp.x - 1) * S, (fp.y - 2 - i * 3) * S, S, S);
      // Blink
      if (Math.sin(t * 3 + i) > 0.8) { ctx.fillStyle = "#ffffff"; ctx.fillRect((fp.x - 1) * S, (fp.y - 2 - i * 3) * S, S, S); }
    }
    // Label
    ctx.fillStyle = "#44ff88"; ctx.font = `${S}px monospace`;
    ctx.fillText("SRV", (fp.x - 3) * S, (fp.y - 20) * S);
  }});

  // Plants
  const plantCells = [
    { c: 0.3, r: 1.5 }, { c: 9.2, r: 1.5 },
    { c: 0.3, r: 7.5 }, { c: 9.2, r: 7.5 },
  ];
  plantCells.forEach(({ c, r }, idx) => {
    const sc = ts(c, r);
    items.push({ depth: c + r, draw: () => drawPlant(ctx, sc, t, idx) });
  });

  // Central rug border decoration
  items.push({ depth: 3 + 3, draw: () => {
    const corners = [ts(3,3), ts(8,3), ts(8,7), ts(3,7)];
    ctx.strokeStyle = "#5a2a7a";
    ctx.lineWidth = S;
    ctx.setLineDash([S * 2, S]);
    ctx.beginPath();
    ctx.moveTo(corners[0].x * S, corners[0].y * S);
    corners.slice(1).forEach(p => ctx.lineTo(p.x * S, p.y * S));
    ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
  }});

  // Desks + monitors + characters
  AGENTS.forEach((agent, i) => {
    const { col, row } = DESK_POS[i];
    const working = workingRef.current[agent.id] ?? true;
    const logLine = agent.logs[logIdxRef.current[agent.id] ?? 0];
    const isHov = hovered === agent.id;
    const isNotify = notifyIds.has(agent.id);
    const depth = col + row;

    // Chair (slight offset behind desk)
    items.push({ depth: depth - 0.2, draw: () => {
      const cs = agent.color.replace('#','');
      const cr = parseInt(cs.slice(0,2),16), cg = parseInt(cs.slice(2,4),16), cb = parseInt(cs.slice(4,6),16);
      const dark = `rgba(${cr},${cg},${cb},0.25)`;
      const mid  = `rgba(${cr},${cg},${cb},0.18)`;
      box(ctx, col + 0.15, row + 0.4, 0.7, 0.45, 5, dark, mid, mid);
    }});

    // Desk
    items.push({ depth, draw: () => {
      box(ctx, col, row, 1, 1, DESK_H, "#9a7040", "#5a3814", "#7a5028", "#3a2008");
      // Keyboard
      box(ctx, col + 0.1, row + 0.65, 0.8, 0.25, 1.5, "#1a1a2a", "#111118", "#141422");
      // Coffee mug (tiny)
      const mugPos = ts(col + 0.8, row + 0.2);
      ctx.fillStyle = "#9a9aaa";
      ctx.fillRect((mugPos.x - 1) * S, (mugPos.y - DESK_H - 3) * S, 2 * S, 3 * S);
      ctx.fillStyle = "#44aaff"; // coffee
      ctx.fillRect((mugPos.x - 1) * S, (mugPos.y - DESK_H - 3) * S, 2 * S, S);
    }});

    // Monitor
    items.push({ depth: depth + 0.15, draw: () => {
      // Stand
      box(ctx, col + 0.45, row + 0.15, 0.12, 0.2, 3, "#1a1a3a", "#0e0e22", "#141430");
      // Screen back
      box(ctx, col + 0.08, row + 0.05, 0.85, 0.35, 14,
        working ? agent.color + "aa" : "#1e1e3a",
        "#0a0a18", "#141428", "#0a0a20");
      // Screen glow
      if (working) {
        const hex = agent.color.replace('#','');
        const rr=parseInt(hex.slice(0,2),16), gg=parseInt(hex.slice(2,4),16), bb=parseInt(hex.slice(4,6),16);
        const fp = ts(col + 0.5, row + 0.25);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},0.12)`;
        ctx.beginPath();
        ctx.ellipse(fp.x * S, (fp.y - DESK_H - 8) * S, 14 * S, 7 * S, 0, 0, Math.PI * 2);
        ctx.fill();
        // Scrolling log text on screen
        ctx.save();
        ctx.font = `bold ${S * 1.5}px 'Courier New', monospace`;
        ctx.fillStyle = agent.color;
        const scroll = Math.floor(t * 1.5) % (logLine.length + 8);
        const visible = logLine.slice(Math.max(0, scroll - 14), scroll + 14);
        const tp = ts(col + 0.55, row + 0.15);
        ctx.fillText(visible, (tp.x - 6) * S, (tp.y - DESK_H - 5) * S);
        ctx.restore();
      }
    }});

    // Character
    items.push({ depth: depth + 0.4, draw: () => {
      const charPos = ts(col + 0.45, row + 0.4);
      const footY = charPos.y - DESK_H;
      const ox = charPos.x - 7;
      const oy = footY;

      CHARACTER_DRAWERS[i](ctx, ox, oy, t, working);

      // Name label ABOVE character head (bigger & readable)
      ctx.font = `bold ${S * 2.2}px 'Courier New', monospace`;
      ctx.fillStyle = isHov ? "#ffffff" : agent.color;
      const nameW = ctx.measureText(agent.name).width;
      // Background pill
      ctx.fillStyle = `rgba(0,0,0,0.6)`;
      ctx.fillRect((charPos.x - 8) * S, (footY - 38) * S, (nameW + S * 3), S * 3.5);
      ctx.fillStyle = isHov ? "#ffffff" : agent.color;
      ctx.fillText(agent.name, (charPos.x - 7) * S, (footY - 35) * S);

      // Status dot
      const dotC = isNotify
        ? (Math.sin(t * 10) > 0 ? "#ff4444" : "#ff0000")
        : (working ? "#44ff88" : "#555566");
      ctx.fillStyle = dotC;
      ctx.beginPath();
      ctx.arc((charPos.x + 6) * S, (footY - 38) * S, 2 * S, 0, Math.PI * 2);
      ctx.fill();
    }});

    // Hover selection ring
    if (isHov) {
      items.push({ depth: depth + 0.5, draw: () => {
        const hp = ts(col + 0.5, row + 0.5);
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = S;
        ctx.setLineDash([S * 2, S]);
        ctx.beginPath();
        ctx.ellipse(hp.x * S, (hp.y) * S, 13 * S, 6.5 * S, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }});
    }
  });

  // ── Sort & draw ──────────────────────────────────────────────────────
  items.sort((a, b) => a.depth - b.depth);
  items.forEach(item => item.draw());

  // ── HUD bar ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#060210";
  ctx.fillRect(0, (CH - 10) * S, CW * S, 10 * S);
  ctx.fillStyle = "#3a1a6a";
  ctx.fillRect(0, (CH - 10) * S, CW * S, S);
  ctx.fillStyle = "#f0c000";
  ctx.font = `bold ${S * 2}px 'Courier New', monospace`;
  ctx.fillText("⚓ Eli HQ — Going Merry", 4 * S, (CH - 3) * S);
  const active = Object.values(workingRef.current).filter(Boolean).length;
  ctx.fillStyle = active >= 7 ? "#44ff88" : active >= 5 ? "#ffaa44" : "#ff4444";
  ctx.fillText(`${active}/9 crew`, (CW - 36) * S, (CH - 3) * S);
}

// ── Main Component ────────────────────────────────────────────────────────
export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const [hovered,  setHovered]  = useState<string | null>(null);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [notifyIds, setNotifyIds] = useState<Set<string>>(new Set());

  const workingRef = useRef<Record<string, boolean>>({
    eli:true, scout:true, pen:false, closer:true, buzz:false,
    ledger:true, franky:true, chopper:true, jinbe:true,
  });
  const logIdxRef = useRef<Record<string, number>>(
    Object.fromEntries(AGENTS.map((a, i) => [a.id, i % a.logs.length]))
  );
  const [uiWorking, setUiWorking] = useState({ ...workingRef.current });
  const [uiLogIdx,  setUiLogIdx]  = useState({ ...logIdxRef.current });
  const [wiroData, setWiroData]   = useState<{ pending?: number; visitors?: number }>({});

  // ── Real WIRO API ─────────────────────────────────────────────────
  useEffect(() => {
    const KEY = "a19cd93295b6f5d1d010c3364111d301fa5303b1fb7e8dce9322ddc2983854ae";
    const BASE = "https://wiro4x4indochina.com/api/agent";
    async function fetchData() {
      try {
        const [bk, an] = await Promise.allSettled([
          fetch(`${BASE}/bookings/pending`,  { headers: { "X-Agent-Key": KEY } }),
          fetch(`${BASE}/analytics/summary`, { headers: { "X-Agent-Key": KEY } }),
        ]);
        const out: { pending?: number; visitors?: number } = {};
        if (bk.status === "fulfilled" && bk.value.ok) {
          const j = await bk.value.json();
          out.pending = Array.isArray(j?.data) ? j.data.length : (j?.count ?? 0);
          const closerIdx = AGENTS.findIndex(a => a.id === "closer");
          if (closerIdx >= 0) AGENTS[closerIdx].logs[0] = `[LIVE] Pending: ${out.pending} ${(out.pending ?? 0) > 0 ? "🔔" : "✅"}`;
        }
        if (an.status === "fulfilled" && an.value.ok) {
          const j = await an.value.json();
          out.visitors = j?.data?.overview?.totalVisitors;
          const scoutIdx = AGENTS.findIndex(a => a.id === "scout");
          if (scoutIdx >= 0 && out.visitors != null)
            AGENTS[scoutIdx].logs[0] = `[LIVE] Visitors: ${out.visitors.toLocaleString()}`;
        }
        setWiroData(out);
      } catch { /* silent */ }
    }
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Sync refs → React ─────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setUiWorking({ ...workingRef.current });
      setUiLogIdx({ ...logIdxRef.current });
    }, 800);
    return () => clearInterval(id);
  }, []);

  function toggleAgent(id: string) {
    workingRef.current[id] = !workingRef.current[id];
    setUiWorking({ ...workingRef.current });
  }

  // ── Draw loop ─────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    tRef.current += 0.04;
    const t = tRef.current;
    // Rotate logs ~every 4s
    if (Math.round(t * 25) % 100 === 0)
      AGENTS.forEach(a => { logIdxRef.current[a.id] = (logIdxRef.current[a.id] + 1) % a.logs.length; });
    ctx.clearRect(0, 0, CW * S, CH * S);
    drawIsoScene(ctx, t, AGENTS, workingRef, logIdxRef, hovered, notifyIds);
    animRef.current = requestAnimationFrame(draw);
  }, [hovered, notifyIds]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  function getAgentAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CW * S / rect.width) / S;
    const my = (e.clientY - rect.top)  * (CH * S / rect.height) / S;
    return AGENTS.find((_, i) => {
      const { col, row } = DESK_POS[i];
      const charPos = ts(col + 0.45, row + 0.4);
      const cx = charPos.x, cy = charPos.y - DESK_H;
      return Math.abs(mx - cx) < 10 && my > cy - 38 && my < cy;
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Canvas ── */}
      <div className="rounded-2xl overflow-hidden border border-[#3a2a6a]/50 bg-[#060210] shadow-2xl shadow-purple-950/50">
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0420] border-b border-[#2a1a4a]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]"/>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
            <span className="w-3 h-3 rounded-full bg-[#28c840]"/>
          </div>
          <span className="text-[11px] font-bold text-[#9b59b6] tracking-widest">⚓ ELI HQ — ISOMETRIC OFFICE</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44ff88] animate-pulse"/>
            <span className="text-[9px] text-[#44ff88] font-mono">LIVE</span>
          </div>
        </div>
        <canvas
          ref={canvasRef} width={CW * S} height={CH * S}
          className="w-full block cursor-crosshair"
          style={{ imageRendering: "pixelated" }}
          onMouseMove={e => setHovered(getAgentAt(e)?.id ?? null)}
          onMouseLeave={() => setHovered(null)}
          onClick={e => { const ag = getAgentAt(e); if (ag) setSelected(ag); }}
        />
        <div className="px-4 py-1.5 bg-[#0a0420] border-t border-[#2a1a4a]">
          <span className="text-[10px] text-[#4a3a6a] font-mono">Hover = highlight · Click crew member = task panel · Monitor = live log</span>
        </div>
      </div>

      {/* ── Agent Log Cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-base">📋</span>
          <h3 className="text-sm font-bold text-foreground">Agent Logs</h3>
          {wiroData.pending != null && (
            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-mono">● Live API</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AGENTS.map(agent => {
            const isWorking = uiWorking[agent.id];
            const isHov = hovered === agent.id;
            const isNotify = notifyIds.has(agent.id);
            const currentLog = agent.logs[uiLogIdx[agent.id] ?? 0];
            return (
              <button
                key={agent.id}
                onClick={() => setSelected(agent)}
                onMouseEnter={() => setHovered(agent.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex flex-col gap-2 px-4 py-3 rounded-xl border text-left transition-all duration-200"
                style={{
                  background: isNotify ? `${agent.color}20` : isHov ? `${agent.color}12` : `${agent.color}07`,
                  borderColor: isNotify ? "#ff4444" : isHov ? `${agent.color}66` : `${agent.color}20`,
                  boxShadow: isHov ? `0 0 16px ${agent.color}18` : "none",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{agent.opEmoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{ color: agent.color }}>{agent.name}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{agent.opChar}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{agent.role}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isWorking ? "bg-green-500/15 text-green-400" : "bg-gray-500/15 text-gray-500"}`}>
                    {isWorking ? "● ON" : "○ IDLE"}
                  </span>
                </div>
                <div className="rounded-lg px-3 py-2 font-mono" style={{ background: "#0a0a14", border: `1px solid ${agent.color}25` }}>
                  <div className="text-[9px] mb-1" style={{ color: `${agent.color}55` }}>
                    {agent.name.toUpperCase()} · {new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {agent.logs.slice(-3).map((line, li, arr) => (
                    <div key={li} className="text-xs leading-relaxed"
                      style={{ color: li === arr.length - 1 ? agent.color : `${agent.color}55` }}>
                      {li === arr.length - 1 ? "▶ " : "  "}{line}
                    </div>
                  ))}
                  {!isWorking && <div className="text-xs text-gray-500 mt-1">💤 Agent offline</div>}
                  {isNotify && <div className="text-xs text-red-400 font-bold mt-1 animate-pulse">⚠ NEW ALERT</div>}
                </div>
                <div className="text-[9px] text-muted-foreground/40 font-mono">Click to open task panel →</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Task Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: "#0d0d1a", borderColor: `${selected.color}44` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: `${selected.color}22`, background: `${selected.color}0e` }}>
              <span className="text-4xl">{selected.opEmoji}</span>
              <div>
                <div className="text-lg font-bold" style={{ color: selected.color }}>
                  {selected.name} <span className="text-sm text-muted-foreground font-normal">({selected.opChar})</span>
                </div>
                <div className="text-sm text-muted-foreground">{selected.role}</div>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-muted-foreground hover:text-foreground text-xl px-2">✕</button>
            </div>
            <div className="px-5 py-3">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 font-mono tracking-widest">ACTIVITY LOG</div>
              <div className="rounded-lg p-3 space-y-1.5 font-mono text-xs" style={{ background: "#060610", border: `1px solid ${selected.color}20` }}>
                {selected.logs.map((line, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span style={{ color: selected.color }} className="shrink-0">›</span>
                    <span className={i === selected.logs.length - 1 ? "text-white" : "text-gray-400"}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 font-mono tracking-widest">QUICK TASKS</div>
              <div className="grid grid-cols-2 gap-2">
                {selected.taskPresets.map((task, i) => (
                  <button key={i}
                    className="text-xs px-3 py-2 rounded-lg border text-left font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ borderColor: `${selected.color}44`, background: `${selected.color}10`, color: selected.color }}
                    onClick={() => alert(`🚀 Spawning ${selected.name}: "${task}"\n\nAgent execution — coming soon!`)}>
                    ▷ {task}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
