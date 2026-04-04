"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const S = 3;
const CW = 220, CH = 300;

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c; ctx.fillRect(x * S, y * S, w * S, h * S);
}
function d(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) { r(ctx, x, y, 1, 1, c); }
function hl(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string) { r(ctx, x, y, w, 1, c); }
function vl(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, c: string) { r(ctx, x, y, 1, h, c); }

interface Agent {
  id: string; name: string; role: string; color: string;
  opChar: string; opEmoji: string;
  logs: string[];
  taskPresets: string[];
}

const AGENTS: Agent[] = [
  { id: "eli",     name: "Eli",     role: "Orchestrator",  color: "#f0c000", opChar: "Luffy",   opEmoji: "🏴‍☠️",
    logs: ["[09:01] Dispatching tasks to 9 crew", "[09:05] All agents online ✓", "[09:12] Routing booking inquiry → Closer", "[09:18] Daily briefing sent", "[09:31] Monitoring all systems"],
    taskPresets: ["Run daily summary", "Check all agent status", "Generate weekly report", "Dispatch urgent mission"] },
  { id: "scout",   name: "Scout",   role: "Analytics",     color: "#ff8c00", opChar: "Nami",    opEmoji: "🗺️",
    logs: ["[09:00] Traffic: 1,240 visitors today", "[09:15] Doi Inthanon page #1 trend", "[09:22] +18% vs last week", "[09:35] 3 new organic leads", "[09:44] Top city: Tel Aviv 🇮🇱"],
    taskPresets: ["Fetch traffic report", "Top pages this week", "Keyword rankings", "Visitor funnel analysis"] },
  { id: "pen",     name: "Pen",     role: "Content/SEO",   color: "#9b59b6", opChar: "Robin",   opEmoji: "📖",
    logs: ["[08:45] Blog draft: Doi Inthanon guide", "[09:10] SEO meta updated ✓", "[09:28] 5 keywords researched", "[09:40] Proofreading tour pages", "[09:55] Content calendar updated"],
    taskPresets: ["Write Doi Inthanon blog", "Create tour description", "Generate FAQ page", "Write IG captions"] },
  { id: "closer",  name: "Closer",  role: "Bookings",      color: "#3498db", opChar: "Sanji",   opEmoji: "🦵",
    logs: ["[09:03] 2 new inquiries received 🔔", "[09:17] David (IL) — sent price quote", "[09:25] Sarah — multi-day confirmed ✓", "[09:38] Follow-up: Anna (3 pax)", "[09:50] Pipeline: 5 active leads"],
    taskPresets: ["Check pending inquiries", "Follow up stale leads", "Draft booking confirm", "Send price quote"] },
  { id: "buzz",    name: "Buzz",    role: "Social Media",  color: "#e67e22", opChar: "Usopp",   opEmoji: "🎯",
    logs: ["[09:05] IG reel posted — 320 views", "[09:20] FB post scheduled ×3", "[09:33] Trending: #ChiangMai #OffRoad", "[09:48] Story uploaded ✓", "[09:59] Engagement up 12%"],
    taskPresets: ["Write 3 IG captions", "Weekly post plan", "Trending hashtags", "Draft FB promotion"] },
  { id: "ledger",  name: "Ledger",  role: "Finance",       color: "#2ecc71", opChar: "Zoro",    opEmoji: "⚔️",
    logs: ["[09:00] MTD revenue: ฿45,000", "[09:15] Invoice #47 sent ✓", "[09:22] Expense log updated", "[09:40] April P&L looking good 📈", "[09:55] 3 payments received"],
    taskPresets: ["Generate MTD report", "List pending invoices", "Calculate profit margin", "Export expenses"] },
  { id: "franky",  name: "Franky",  role: "Tech/Website",  color: "#00b4ff", opChar: "Franky",  opEmoji: "🤖",
    logs: ["[09:02] Vercel deploy: ✅ OK", "[09:18] Lighthouse score: 94/100", "[09:30] SSL cert valid 60d", "[09:45] 0 broken links ✓", "[09:58] Page speed: 1.2s SUPER!"],
    taskPresets: ["Run website audit", "Check Vercel status", "Test page load speed", "Scan broken links"] },
  { id: "chopper", name: "Chopper", role: "Customer Care",  color: "#ff6b9d", opChar: "Chopper", opEmoji: "🦌",
    logs: ["[09:10] Google review replied ⭐×5", "[09:25] WhatsApp follow-up × 2", "[09:37] Customer survey sent", "[09:48] CSAT score: 4.9/5 ✓", "[09:55] 0 unresolved complaints"],
    taskPresets: ["Reply pending reviews", "Send post-tour survey", "Draft WhatsApp msg", "Check feedback"] },
  { id: "jinbe",   name: "Jinbe",   role: "Operations",    color: "#4a9eff", opChar: "Jinbe",   opEmoji: "🌊",
    logs: ["[09:00] Weather: ⛅ 31°C Chiang Mai", "[09:15] Inthanon route: clear ✓", "[09:30] Vehicle #2 service due 🔧", "[09:42] Tomorrow: partly cloudy", "[09:58] 2 tours on schedule ✅"],
    taskPresets: ["Get 7-day forecast", "Check route conditions", "Vehicle maintenance log", "Pre-tour safety check"] },
];

// 3 rows × 3 cols
const DESKS = [
  { x: 8,  y: 18 }, { x: 80,  y: 18 }, { x: 152, y: 18 },
  { x: 8,  y: 98 }, { x: 80,  y: 98 }, { x: 152, y: 98 },
  { x: 8,  y: 178},{ x: 80,  y: 178},{ x: 152, y: 178},
];

// ── Character sprite drawers (y=0 is feet, drawn upward) ─────────────────
// NOTE: all characters drawn so feet are at (ox, oy), body goes UP

function drawHead(ctx: CanvasRenderingContext2D, ox: number, oy: number, skinC: string, b: number) {
  // head at oy-14 to oy-8 (6px tall)
  r(ctx, ox+3, oy-14+b, 8, 6, skinC);
}

function drawLuffy(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  // feet at oy
  r(ctx, ox+2, oy-2+b, 4, 2, "#442200"); r(ctx, ox+8, oy-2+b, 4, 2, "#442200");
  // legs
  r(ctx, ox+2, oy-8+b, 10, 6, "#1155aa");
  // body
  r(ctx, ox+2, oy-16+b, 10, 8, "#cc1100"); r(ctx, ox+5, oy-16+b, 4, 8, "#ffcc99");
  // arms
  if (working) { const sw = Math.sin(t * 4) > 0 ? 1 : 0;
    r(ctx, ox, oy-14+b+sw, 3, 5, "#ffcc99"); r(ctx, ox+11, oy-14+b-sw, 3, 5, "#ffcc99");
  } else { r(ctx, ox, oy-13+b, 3, 5, "#ffcc99"); r(ctx, ox+11, oy-13+b, 3, 5, "#ffcc99"); }
  // neck
  r(ctx, ox+5, oy-18+b, 4, 3, "#ffcc99");
  // head
  r(ctx, ox+3, oy-24+b, 8, 7, "#ffcc99");
  // hat brim + top
  hl(ctx, ox+1, oy-25+b, 12, "#c8a000"); r(ctx, ox+3, oy-28+b, 8, 3, "#f0c000");
  hl(ctx, ox+3, oy-22+b, 8, "#cc2200");
  // eyes + scar + smile
  d(ctx, ox+5, oy-22+b, "#111"); d(ctx, ox+8, oy-22+b, "#111");
  d(ctx, ox+5, oy-21+b, "#cc3333");
  r(ctx, ox+4, oy-20+b, 6, 1, "#111");
}

function drawNami(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  r(ctx, ox+3, oy-2+b, 4, 2, "#aa3300"); r(ctx, ox+7, oy-2+b, 4, 2, "#aa3300");
  r(ctx, ox+4, oy-6+b, 3, 4, "#ffcc99"); r(ctx, ox+7, oy-6+b, 3, 4, "#ffcc99");
  r(ctx, ox+2, oy-13+b, 10, 7, "#004499");
  r(ctx, ox+3, oy-18+b, 8, 5, "#ff6600");
  r(ctx, ox+1, oy-17+b, 2, 5, "#ffcc99");
  if (working) { r(ctx, ox+13, oy-19+b, 2, 8, "#88aa44"); r(ctx, ox+11, oy-17+b, 2, 5, "#ffcc99"); }
  else { r(ctx, ox+11, oy-17+b, 2, 5, "#ffcc99"); }
  r(ctx, ox+3, oy-24+b, 8, 7, "#ffcc99"); d(ctx, ox+4, oy-22+b, "#0055cc");
  d(ctx, ox+5, oy-22+b, "#552200"); d(ctx, ox+8, oy-22+b, "#552200");
  r(ctx, ox+5, oy-20+b, 4, 1, "#aa5522");
  r(ctx, ox+3, oy-28+b, 9, 2, "#ff8c00"); r(ctx, ox+2, oy-26+b, 10, 8, "#ff8c00"); r(ctx, ox+11, oy-22+b, 2, 6, "#ff8c00");
}

function drawRobin(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  r(ctx, ox+3, oy-2+b, 4, 2, "#1a0a2a"); r(ctx, ox+7, oy-2+b, 4, 2, "#1a0a2a");
  r(ctx, ox+4, oy-6+b, 3, 4, "#f0d0b0"); r(ctx, ox+7, oy-6+b, 3, 4, "#f0d0b0");
  r(ctx, ox+2, oy-11+b, 10, 5, "#3a0a5a");
  r(ctx, ox+2, oy-20+b, 10, 9, "#4a1a6a");
  if (working) {
    r(ctx, ox-2, oy-18+b, 3, 6, "#f0d0b0"); r(ctx, ox+13, oy-18+b, 3, 6, "#f0d0b0");
    r(ctx, ox+1, oy-19+b, 2, 5, "#f0d0b0"); r(ctx, ox+11, oy-19+b, 2, 5, "#f0d0b0");
  } else { r(ctx, ox+1, oy-17+b, 2, 5, "#f0d0b0"); r(ctx, ox+11, oy-17+b, 2, 5, "#f0d0b0"); }
  r(ctx, ox+3, oy-27+b, 8, 7, "#f0d0b0");
  r(ctx, ox+5, oy-25+b, 2, 1, "#1a0a4a"); r(ctx, ox+8, oy-25+b, 2, 1, "#1a0a4a");
  r(ctx, ox+5, oy-23+b, 4, 1, "#aa7755");
  r(ctx, ox+3, oy-31+b, 8, 5, "#1a0a4a"); r(ctx, ox+2, oy-27+b, 2, 5, "#1a0a4a"); r(ctx, ox+12, oy-27+b, 2, 5, "#1a0a4a");
}

function drawSanji(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  r(ctx, ox+1, oy-2+b, 5, 2, "#111"); r(ctx, ox+6, oy-2+b, 6, 2, "#111");
  if (working) { const k = Math.sin(t * 5) > 0 ? 1 : -1;
    r(ctx, ox+2, oy-8+b, 5, 6, "#1a1a2a"); r(ctx, ox+7+k, oy-10+b, 5, 8, "#1a1a2a");
    r(ctx, ox+1, oy-16+b, 2, 5, "#ffddbb"); r(ctx, ox+11, oy-16+b, 2, 5, "#ffddbb");
  } else {
    r(ctx, ox+2, oy-8+b, 5, 6, "#1a1a2a"); r(ctx, ox+7, oy-8+b, 5, 6, "#1a1a2a");
    r(ctx, ox+1, oy-15+b, 2, 5, "#ffddbb"); r(ctx, ox+11, oy-15+b, 2, 5, "#ffddbb");
  }
  r(ctx, ox+2, oy-20+b, 10, 10, "#1a1a2a"); r(ctx, ox+5, oy-20+b, 4, 5, "#ddddee");
  d(ctx, ox+6, oy-18+b, "#cc1100"); d(ctx, ox+6, oy-17+b, "#cc1100");
  r(ctx, ox+3, oy-27+b, 8, 7, "#ffddbb");
  d(ctx, ox+8, oy-25+b, "#111"); d(ctx, ox+8, oy-26+b, "#333");
  r(ctx, ox+9, oy-23+b, 4, 1, "#ffffff"); d(ctx, ox+12, oy-23+b, "#ff4400");
  r(ctx, ox+5, oy-23+b, 4, 1, "#aa5522");
  r(ctx, ox+3, oy-31+b, 8, 5, "#ddaa00"); d(ctx, ox+4, oy-26+b, "#ddaa00");
}

function drawUsopp(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  r(ctx, ox+2, oy-2+b, 5, 2, "#442200"); r(ctx, ox+7, oy-2+b, 5, 2, "#442200");
  r(ctx, ox+3, oy-7+b, 4, 5, "#885500"); r(ctx, ox+7, oy-7+b, 4, 5, "#885500");
  r(ctx, ox+2, oy-17+b, 10, 10, "#cc7722"); r(ctx, ox+5, oy-17+b, 4, 10, "#885500");
  r(ctx, ox+1, oy-15+b, 2, 6, "#cc9966");
  if (working) { r(ctx, ox+12, oy-17+b, 2, 6, "#cc9966"); r(ctx, ox+14, oy-18+b, 2, 4, "#885500"); d(ctx, ox+14, oy-19+b, "#ff6600"); }
  else { r(ctx, ox+12, oy-15+b, 2, 6, "#cc9966"); }
  r(ctx, ox+3, oy-24+b, 8, 7, "#cc9966");
  r(ctx, ox+7, oy-21+b, 6, 2, "#bb8855"); d(ctx, ox+12, oy-21+b, "#aa7744");
  d(ctx, ox+5, oy-23+b, "#111"); d(ctx, ox+8, oy-23+b, "#111");
  r(ctx, ox+5, oy-20+b, 4, 1, "#884422");
  r(ctx, ox+3, oy-2+b+0, 8, 6, "#1a1a1a"); // curly hair  // shadow on head
  r(ctx, ox+2, oy-30+b, 10, 3, "#cc8822"); hl(ctx, ox+1, oy-28+b, 12, "#aa6611");
  r(ctx, ox+3, oy-24+b, 8, 7, "#cc9966");
  r(ctx, ox+3, oy-31+b, 8, 6, "#1a1a1a"); r(ctx, ox+2, oy-28+b, 2, 5, "#1a1a1a"); r(ctx, ox+12, oy-28+b, 2, 5, "#1a1a1a");
}

function drawZoro(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  r(ctx, ox+2, oy-2+b, 4, 3, "#111"); r(ctx, ox+7, oy-2+b, 4, 3, "#111");
  r(ctx, ox+2, oy-8+b, 10, 6, "#1a2a1a");
  r(ctx, ox+2, oy-17+b, 10, 9, "#ddeedd"); r(ctx, ox+5, oy-17+b, 4, 9, "#d4aa88");
  r(ctx, ox+1, oy-16+b, 2, 6, "#d4aa88"); r(ctx, ox+1, oy-16+b, 2, 2, "#ffffff");
  if (working) { r(ctx, ox+11, oy-16+b, 2, 6, "#d4aa88"); r(ctx, ox+13, oy-21+b, 1, 12, "#aaaacc"); r(ctx, ox-1, oy-21+b, 1, 12, "#aaaacc"); d(ctx, ox+7, oy-20+b, "#aaaacc"); }
  else { r(ctx, ox+11, oy-16+b, 2, 6, "#d4aa88"); r(ctx, ox+12, oy-14+b, 1, 8, "#aaaacc"); }
  r(ctx, ox+3, oy-24+b, 8, 7, "#d4aa88");
  vl(ctx, ox+8, oy-23+b, 4, "#ff3300");
  d(ctx, ox+5, oy-22+b, "#111"); d(ctx, ox+8, oy-22+b, "#111");
  hl(ctx, ox+5, oy-19+b, 4, "#884422"); d(ctx, ox+3, oy-21+b, "#cccc00");
  r(ctx, ox+4, oy-31+b, 6, 5, "#1a7a1a"); r(ctx, ox+5, oy-33+b, 4, 3, "#22aa22");
}

function drawFranky(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 3) * 0.6) : 0;
  r(ctx, ox+1, oy-2+b, 5, 2, "#224466"); r(ctx, ox+6, oy-2+b, 5, 2, "#224466");
  r(ctx, ox+2, oy-7+b, 4, 5, "#4488bb"); hl(ctx, ox+2, oy-5+b, 4, "#88ccff");
  r(ctx, ox+7, oy-7+b, 4, 5, "#4488bb"); hl(ctx, ox+7, oy-5+b, 4, "#88ccff");
  r(ctx, ox+2, oy-12+b, 10, 5, "#0044aa");
  r(ctx, ox+1, oy-22+b, 12, 10, "#0066aa"); r(ctx, ox+5, oy-22+b, 4, 10, "#ffddbb");
  if (working) { const mw = Math.sin(t * 4) > 0 ? 1 : 0;
    r(ctx, ox-3, oy-19+b+mw, 5, 6, "#4488bb"); r(ctx, ox+12, oy-19+b-mw, 5, 6, "#4488bb");
    d(ctx, ox-2, oy-17+b, "#88ccff"); d(ctx, ox+15, oy-17+b, "#88ccff");
  } else { r(ctx, ox-3, oy-18+b, 5, 5, "#4488bb"); r(ctx, ox+12, oy-18+b, 5, 5, "#4488bb"); }
  r(ctx, ox+3, oy-29+b, 8, 7, "#ffddbb");
  r(ctx, ox+4, oy-27+b, 3, 2, "#ffcc00"); r(ctx, ox+8, oy-27+b, 3, 2, "#ffcc00");
  r(ctx, ox+6, oy-25+b, 2, 2, "#ffaa88");
  r(ctx, ox+4, oy-23+b, 6, 1, "#111"); d(ctx, ox+4, oy-24+b, "#111"); d(ctx, ox+9, oy-24+b, "#111");
  r(ctx, ox+1, oy-36+b, 12, 8, "#0088cc"); r(ctx, ox+3, oy-37+b, 8, 3, "#00aaff");
  hl(ctx, ox+1, oy-37+b, 12, "#44ccff");
}

function drawChopper(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 4) * 0.5) : 0;
  r(ctx, ox+3, oy-2+b, 4, 2, "#555"); r(ctx, ox+7, oy-2+b, 4, 2, "#555");
  r(ctx, ox+4, oy-7+b, 3, 5, "#8b5e3c"); r(ctx, ox+7, oy-7+b, 3, 5, "#8b5e3c");
  r(ctx, ox+3, oy-15+b, 8, 8, "#a0714f"); r(ctx, ox+4, oy-15+b, 6, 8, "#8b5e3c");
  r(ctx, ox+1, oy-13+b, 3, 4, "#a0714f"); r(ctx, ox+10, oy-13+b, 3, 4, "#a0714f");
  if (working) { r(ctx, ox+12, oy-14+b, 5, 4, "#cc3366"); r(ctx, ox+14, oy-11+b, 1, 2, "#fff"); r(ctx, ox+13, oy-10+b, 3, 1, "#fff"); }
  r(ctx, ox+2, oy-24+b, 10, 8, "#a0714f"); r(ctx, ox+3, oy-24+b, 8, 8, "#a0714f");
  ctx.fillStyle = "#ff2200"; ctx.beginPath(); ctx.arc((ox+7)*S+S/2,(oy-19+b)*S+S/2,S*1.2,0,Math.PI*2); ctx.fill();
  r(ctx, ox+4, oy-23+b, 2, 2, "#111"); r(ctx, ox+8, oy-23+b, 2, 2, "#111");
  d(ctx, ox+5, oy-23+b, "#ffffff"); d(ctx, ox+9, oy-23+b, "#ffffff");
  r(ctx, ox+5, oy-21+b, 4, 1, "#7a3a1a");
  r(ctx, ox+2, oy-29+b, 10, 5, "#ff99bb"); r(ctx, ox+1, oy-25+b, 12, 2, "#ff99bb");
  r(ctx, ox+6, oy-28+b, 2, 4, "#cc3366"); r(ctx, ox+5, oy-27+b, 4, 2, "#cc3366");
  vl(ctx, ox+4, oy-36+b, 5, "#8b4513"); r(ctx, ox+2, oy-36+b, 3, 2, "#8b4513");
  vl(ctx, ox+10, oy-36+b, 5, "#8b4513"); r(ctx, ox+9, oy-36+b, 3, 2, "#8b4513");
}

function drawJinbe(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t * 2.5) * 0.8) : 0;
  r(ctx, ox+1, oy-2+b, 5, 3, "#111"); r(ctx, ox+7, oy-2+b, 5, 3, "#111");
  r(ctx, ox+2, oy-8+b, 10, 6, "#112244");
  r(ctx, ox+1, oy-19+b, 12, 11, "#ddddee"); r(ctx, ox+5, oy-19+b, 4, 11, "#2255aa");
  hl(ctx, ox+1, oy-19+b, 12, "#ffffff");
  r(ctx, ox+4, oy-19+b, 3, 5, "#ddddee"); r(ctx, ox+7, oy-19+b, 3, 5, "#ddddee");
  if (working) { const sw = Math.sin(t*3) > 0 ? 1 : 0;
    r(ctx, ox-2, oy-17+b+sw, 4, 7, "#2255aa"); r(ctx, ox+12, oy-17+b-sw, 4, 7, "#2255aa");
  } else { r(ctx, ox-2, oy-16+b, 4, 6, "#2255aa"); r(ctx, ox+12, oy-16+b, 4, 6, "#2255aa"); }
  r(ctx, ox-1, oy-19+b, 3, 3, "#ddddee"); r(ctx, ox+12, oy-19+b, 3, 3, "#ddddee");
  r(ctx, ox+1, oy-28+b, 12, 9, "#2255aa"); r(ctx, ox+2, oy-27+b, 10, 8, "#2255aa");
  r(ctx, ox+1, oy-28+b, 2, 4, "#1a4488"); r(ctx, ox+11, oy-28+b, 2, 4, "#1a4488");
  r(ctx, ox+4, oy-26+b, 3, 2, "#ffffff"); r(ctx, ox+8, oy-26+b, 3, 2, "#ffffff");
  r(ctx, ox+5, oy-26+b, 2, 2, "#1a0a00"); r(ctx, ox+9, oy-26+b, 2, 2, "#1a0a00");
  hl(ctx, ox+5, oy-23+b, 4, "#1a3366");
}

const CHARACTER_DRAWERS = [drawLuffy,drawNami,drawRobin,drawSanji,drawUsopp,drawZoro,drawFranky,drawChopper,drawJinbe];

// ── Background ─────────────────────────────────────────────────────────────
function drawBG(ctx: CanvasRenderingContext2D, t: number, totalH: number) {
  // sky
  const grad = ctx.createLinearGradient(0, 0, 0, 45 * S);
  grad.addColorStop(0, "#1a3a6a"); grad.addColorStop(.5, "#2255aa"); grad.addColorStop(1, "#4488cc");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, CW * S, 45 * S);
  // clouds
  [{bx:10,by:5,w:20,spd:.3},{bx:70,by:8,w:30,spd:.18},{bx:150,by:4,w:22,spd:.25}].forEach(cl => {
    const cx = ((cl.bx + t*cl.spd*20) % (CW+cl.w)) - cl.w;
    r(ctx,cx,cl.by,cl.w,3,"#c8ddf0"); r(ctx,cx+2,cl.by-2,cl.w-4,3,"#ddeeff");
  });
  // ocean
  r(ctx,0,38,CW,8,"#1a5588"); r(ctx,0,42,CW,4,"#1e6699");
  for (let wx=0;wx<CW;wx+=18) { const wo=Math.floor(Math.sin(t*1.5+wx*.2)*2); hl(ctx,wx,39+wo,10,"#4499cc"); }
  // hull
  r(ctx,0,44,CW,4,"#f0f0e8"); r(ctx,0,45,CW,2,"#2255aa");
  // wood wall
  r(ctx,0,48,CW,12,"#7a4e2a");
  for (let wy=48;wy<60;wy+=4) { hl(ctx,0,wy,CW,"#8a5e3a"); hl(ctx,0,wy+1,CW,"#6a3e1a"); }
  for (let bx=0;bx<CW;bx+=36) { r(ctx,bx,48,3,12,"#5a3010"); }
  r(ctx,0,48,CW,2,"#aa7040"); hl(ctx,0,48,CW,"#cc9060");
  // deck planks (full height)
  r(ctx,0,59,CW,totalH-59,"#7a5028");
  for (let py=59;py<totalH-4;py+=5) { hl(ctx,0,py,CW,"#8a6030"); hl(ctx,0,py+1,CW,"#6a4018"); hl(ctx,0,py+4,CW,"#5a3010"); }
  for (let px=0;px<CW;px+=22) { const off=((px/22)%2)*11; vl(ctx,px+off,59,totalH-63,"#5a3010"); }
  // portholes
  for (const cx of [18,110,202]) drawPorthole(ctx,cx,53,t);
  // mast + jolly roger
  vl(ctx,3,0,12,"#5a3010"); r(ctx,4,0,2,12,"#7a4a20");
  const fw=Math.sin(t*2)*1.5;
  r(ctx,5,1,14,9,"#111111"); hl(ctx,5,1+Math.round(fw),14,"#1a1a1a");
  r(ctx,9,2,6,4,"#eeeeee"); r(ctx,10,5,4,2,"#eeeeee");
  d(ctx,10,3,"#111111"); d(ctx,13,3,"#111111");
  [[8,6],[15,6],[9,7],[14,7],[10,8],[13,8],[8,8],[15,8]].forEach(([x,y])=>d(ctx,x,y,"#eeeeee"));
  // ropes
  for (let i=0;i<20;i++) { d(ctx,5+i*2,2+i,"#cc9944"); d(ctx,CW-5-i*2,2+i,"#cc9944"); }
  for (let rx=0;rx<CW;rx+=3) { const sag=Math.sin(rx/CW*Math.PI)*2; d(ctx,rx,Math.round(48+sag),"#cc9944"); }
  // barrel
  r(ctx,CW-12,100,10,14,"#6a4010"); r(ctx,CW-13,102,12,2,"#666666"); r(ctx,CW-13,109,12,2,"#666666");
}

function drawPorthole(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const R=11;
  ctx.beginPath();ctx.arc(cx*S,cy*S,(R+3)*S,0,Math.PI*2);ctx.fillStyle="#8a6020";ctx.fill();
  ctx.beginPath();ctx.arc(cx*S,cy*S,(R+1)*S,0,Math.PI*2);ctx.fillStyle="#443010";ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx*S,cy*S,R*S,0,Math.PI*2);ctx.clip();
  const sg=ctx.createLinearGradient(0,(cy-R)*S,0,cy*S);sg.addColorStop(0,"#2255aa");sg.addColorStop(1,"#4488cc");ctx.fillStyle=sg;ctx.fillRect((cx-R)*S,(cy-R)*S,R*2*S,R*S);
  const og=ctx.createLinearGradient(0,cy*S,0,(cy+R)*S);og.addColorStop(0,"#1a6699");og.addColorStop(1,"#0a3355");ctx.fillStyle=og;ctx.fillRect((cx-R)*S,cy*S,R*2*S,R*S);
  for(let wx=cx-R;wx<cx+R;wx+=4){const wh=Math.floor(Math.sin(t*1.5+wx*.4)*2);r(ctx,wx,cy+wh,3,1,"#4499bb");}
  ctx.restore();
  ctx.fillStyle="#7a5520";ctx.fillRect((cx-1)*S,(cy-R)*S,2*S,R*2*S);ctx.fillRect((cx-R)*S,(cy-1)*S,R*2*S,2*S);
  [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(([bpx,bpy])=>{
    ctx.beginPath();ctx.arc((cx+bpx)*S,(cy+bpy)*S,S*1.2,0,Math.PI*2);ctx.fillStyle="#cc9933";ctx.fill();
  });
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // legs
  vl(ctx,x+2,y+14,9,"#2a2a4a");vl(ctx,x+22,y+14,9,"#2a2a4a");
  // side
  r(ctx,x+1,y+10,24,5,"#1a1a3a"); hl(ctx,x+1,y+10,24,"#2a2a4a");
  // top
  r(ctx,x,y+8,26,3,"#222244"); hl(ctx,x,y+8,26,"#4a4a8a");
  // keyboard
  r(ctx,x+6,y+7,10,2,"#1a1a33");
}

function drawMonitor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number, working: boolean, logLine: string) {
  // stand
  r(ctx,x+9,y+6,4,4,"#1a1a3a"); r(ctx,x+6,y+9,10,2,"#111122");
  // bezel
  r(ctx,x+1,y-5,20,13,"#111122"); hl(ctx,x+1,y-5,20,"#2a2a5a");
  // screen
  r(ctx,x+2,y-4,18,11,"#000811");
  const hex=color.replace('#',''); const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
  if (working) {
    // scrolling log text on screen
    ctx.save();
    ctx.beginPath(); ctx.rect((x+2)*S,(y-4)*S,18*S,11*S); ctx.clip();
    ctx.font = `bold ${S*1.6}px 'Courier New', monospace`;
    ctx.fillStyle = color;
    // show last part of logLine, scroll effect
    const scroll = Math.floor(t * 2) % (logLine.length + 10);
    const visible = logLine.slice(Math.max(0, scroll - 18), scroll + 18);
    ctx.fillText(visible, (x+3)*S, (y+2)*S);
    // second line: static snippet
    ctx.fillStyle = `rgba(${rr},${gg},${bb},0.5)`;
    ctx.fillText(logLine.slice(0, 15) + "...", (x+3)*S, (y+5)*S);
    // cursor blink
    if (Math.floor(t*2)%2===0) { ctx.fillStyle="#ffffff"; ctx.fillRect((x+3)*S,(y+6)*S,S,S*1.5); }
    ctx.restore();
    ctx.fillStyle=`rgba(${rr},${gg},${bb},0.10)`;ctx.fillRect((x-1)*S,(y-7)*S,24*S,20*S);
  } else {
    const alpha=.15+Math.sin(t*.7+rr)*.1;ctx.fillStyle=`rgba(${rr},${gg},${bb},${alpha})`;ctx.fillRect((x+3)*S,(y-2)*S,14*S,6*S);
  }
  ctx.strokeStyle=working?`${color}66`:"#2a2a5a";ctx.lineWidth=S*.6;ctx.strokeRect((x+1)*S,(y-5)*S,20*S,13*S);
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  r(ctx,x+7,y+18,12,11,"#0a1a2a"); hl(ctx,x+7,y+18,12,color+"44");
  r(ctx,x+5,y+27,16,4,"#112233"); hl(ctx,x+5,y+27,16,"#1a3344");
  vl(ctx,x+6,y+30,6,"#0a1a2a"); vl(ctx,x+18,y+30,6,"#0a1a2a"); vl(ctx,x+10,y+30,6,"#0a1a2a"); vl(ctx,x+14,y+30,6,"#0a1a2a");
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const [hovered, setHovered]     = useState<string | null>(null);
  const [selected, setSelected]   = useState<Agent | null>(null);
  const [notifyIds, setNotifyIds] = useState<Set<string>>(new Set());

  const workingRef = useRef<Record<string,boolean>>({
    eli:true, scout:true, pen:false, closer:true, buzz:false, ledger:true,
    franky:true, chopper:true, jinbe:true,
  });
  const logIdxRef = useRef<Record<string,number>>(
    Object.fromEntries(AGENTS.map((a,i)=>[a.id,i%a.logs.length]))
  );
  const [uiWorking, setUiWorking] = useState({...workingRef.current});
  const [uiLogIdx,  setUiLogIdx]  = useState({...logIdxRef.current});
  const [wiroData,  setWiroData]  = useState<{pending?:number,visitors?:number}>({});

  // ── Real API fetch ──────────────────────────────────────────────────
  useEffect(() => {
    const KEY = "a19cd93295b6f5d1d010c3364111d301fa5303b1fb7e8dce9322ddc2983854ae";
    const BASE = "https://wiro4x4indochina.com/api/agent";
    async function fetchData() {
      try {
        const [bk, an] = await Promise.allSettled([
          fetch(`${BASE}/bookings/pending`,  {headers:{"X-Agent-Key":KEY}}),
          fetch(`${BASE}/analytics/summary`, {headers:{"X-Agent-Key":KEY}}),
        ]);
        const out: {pending?:number,visitors?:number} = {};
        if (bk.status==="fulfilled" && bk.value.ok) {
          const j = await bk.value.json();
          out.pending = Array.isArray(j?.data) ? j.data.length : (j?.count ?? 0);
        }
        if (an.status==="fulfilled" && an.value.ok) {
          const j = await an.value.json();
          out.visitors = j?.data?.overview?.totalVisitors;
        }
        setWiroData(out);
        // inject real data into logs
        if (out.pending != null) {
          const closerIdx = AGENTS.findIndex(a=>a.id==="closer");
          if (closerIdx>=0) AGENTS[closerIdx].logs[0] = `[LIVE] Pending inquiries: ${out.pending} ${out.pending>0?"🔔":"✅"}`;
        }
        if (out.visitors != null) {
          const scoutIdx = AGENTS.findIndex(a=>a.id==="scout");
          if (scoutIdx>=0) AGENTS[scoutIdx].logs[0] = `[LIVE] Traffic today: ${out.visitors.toLocaleString()} visitors`;
        }
      } catch { /* silent */ }
    }
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Sync refs → React state ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setUiWorking({...workingRef.current});
      setUiLogIdx({...logIdxRef.current});
    }, 800);
    return () => clearInterval(id);
  }, []);

  function toggleAgent(id: string) {
    workingRef.current[id] = !workingRef.current[id];
    setUiWorking({...workingRef.current});
  }

  // ── Canvas loop ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    tRef.current += 0.04;
    const t = tRef.current;

    // rotate log every 4s
    if (Math.round(t*25) % 100 === 0)
      AGENTS.forEach(a => { logIdxRef.current[a.id] = (logIdxRef.current[a.id]+1) % a.logs.length; });

    ctx.clearRect(0, 0, CW*S, CH*S);
    drawBG(ctx, t, CH);

    AGENTS.forEach((agent, i) => {
      const {x,y} = DESKS[i];
      const working = workingRef.current[agent.id] ?? true;
      const logLine = agent.logs[logIdxRef.current[agent.id] ?? 0];
      const isNotify = notifyIds.has(agent.id);

      drawChair(ctx, x, y, agent.color);
      drawDesk(ctx, x, y);
      drawMonitor(ctx, x+3, y+2, agent.color, t, working, logLine);

      // character feet at desk top (y+8), body goes up
      CHARACTER_DRAWERS[i](ctx, x+5, y+8, t, working);

      // name label above desk
      ctx.font = `bold ${S * 2.2}px 'Courier New', monospace`;
      ctx.fillStyle = agent.color;
      ctx.fillText(agent.name, (x + 1) * S, (y - 5) * S);
      // status dot
      if (isNotify) { r(ctx,x+23,y-2,4,4,Math.sin(t*10)>0?"#ff4444":"#ff0000"); }
      else { r(ctx,x+24,y-1,2,2,working?"#44ff88":"#555566"); }
    });

    // hover outline
    if (hovered) {
      const idx = AGENTS.findIndex(a=>a.id===hovered);
      if (idx>=0) {
        const {x,y} = DESKS[idx];
        ctx.strokeStyle = AGENTS[idx].color; ctx.lineWidth = S*.7;
        ctx.setLineDash([S*2,S]);
        ctx.strokeRect((x-2)*S,(y-4)*S,32*S,42*S);
        ctx.setLineDash([]);
      }
    }

    // HUD
    r(ctx,0,CH-9,CW,9,"#06060f"); hl(ctx,0,CH-9,CW,"#4a3a10");
    ctx.fillStyle="#f0c000"; ctx.font=`bold ${S*1.7}px 'Courier New',monospace`;
    ctx.fillText("⚓ Going Merry — Eli HQ", 3*S, (CH-2)*S);
    const active = Object.values(workingRef.current).filter(Boolean).length;
    ctx.fillStyle = active>=7?"#44ff88":active>=5?"#ffaa44":"#ff4444";
    ctx.fillText(`${active}/9 crew`, (CW-26)*S, (CH-2)*S);

    animRef.current = requestAnimationFrame(draw);
  }, [hovered, notifyIds]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  function getAgentAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect2 = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX-rect2.left)*(CW*S/rect2.width)/S;
    const my = (e.clientY-rect2.top)*(CH*S/rect2.height)/S;
    return AGENTS.find((_,i)=>{const{x,y}=DESKS[i];return mx>=x-2&&mx<=x+28&&my>=y-4&&my<=y+38;});
  }

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="rounded-2xl overflow-hidden border border-amber-900/40 bg-[#06060f] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 border-b border-amber-900/30 bg-[#0a0800]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]"/>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
            <span className="w-3 h-3 rounded-full bg-[#28c840]"/>
          </div>
          <span className="text-[11px] font-bold text-amber-400 tracking-widest">⚓ GOING MERRY — 9 CREW MEMBERS</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44ff88] animate-pulse"/>
            <span className="text-[9px] text-[#44ff88] font-mono">LIVE</span>
          </div>
        </div>
        <canvas
          ref={canvasRef} width={CW*S} height={CH*S}
          className="w-full block cursor-crosshair"
          style={{imageRendering:"pixelated"}}
          onMouseMove={e => setHovered(getAgentAt(e)?.id ?? null)}
          onMouseLeave={() => setHovered(null)}
          onClick={e => {
            const ag = getAgentAt(e);
            if (ag) { setSelected(ag); }
          }}
        />
        <div className="px-4 py-1.5 border-t border-amber-900/30 bg-[#0a0800]">
          <span className="text-[10px] text-amber-800 font-mono">Monitor screen = live agent log · Click crew member to open task panel</span>
        </div>
      </div>

      {/* ── Agent Log Cards ───────────────────────────────────────────── */}
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
                  background: isNotify ? `${agent.color}20` : isHov ? `${agent.color}15` : `${agent.color}08`,
                  borderColor: isNotify ? "#ff4444" : isHov ? `${agent.color}77` : `${agent.color}22`,
                  boxShadow: isNotify ? "0 0 20px rgba(255,68,68,0.25)" : isHov ? `0 0 14px ${agent.color}20` : "none",
                }}
              >
                {/* header */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{agent.opEmoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{color:agent.color}}>{agent.name}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{agent.opChar}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{agent.role}</div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isWorking?"bg-green-500/15 text-green-400":"bg-gray-500/15 text-gray-500"}`}>
                    {isWorking?"● ON":"○ IDLE"}
                  </span>
                </div>

                {/* log terminal box */}
                <div className="rounded-lg px-3 py-2 font-mono" style={{background:"#0a0a14", border:`1px solid ${agent.color}33`}}>
                  <div className="text-[9px] mb-1" style={{color:`${agent.color}66`}}>
                    {agent.name.toUpperCase()} LOG — {new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                  {/* last 3 log lines */}
                  {agent.logs.slice(-3).map((line, li) => (
                    <div key={li} className="text-xs leading-relaxed" style={{
                      color: li === agent.logs.slice(-3).length-1
                        ? agent.color
                        : `${agent.color}66`
                    }}>
                      {li === agent.logs.slice(-3).length-1 ? "▶ " : "  "}{line}
                    </div>
                  ))}
                  {!isWorking && <div className="text-xs text-gray-500 mt-1">💤 Agent offline</div>}
                  {isNotify && <div className="text-xs text-red-400 font-bold mt-1 animate-pulse">⚠ NEW NOTIFICATION</div>}
                </div>

                <div className="text-[9px] text-muted-foreground/50 font-mono">Click to open task panel →</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Task Modal ─────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={()=>setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
            style={{background:"#0d0d1a", borderColor:`${selected.color}44`}}
            onClick={e=>e.stopPropagation()}>
            {/* modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{borderColor:`${selected.color}22`, background:`${selected.color}10`}}>
              <span className="text-4xl">{selected.opEmoji}</span>
              <div>
                <div className="text-lg font-bold" style={{color:selected.color}}>{selected.name} <span className="text-sm text-muted-foreground font-normal">({selected.opChar})</span></div>
                <div className="text-sm text-muted-foreground">{selected.role}</div>
              </div>
              <button onClick={()=>setSelected(null)} className="ml-auto text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            {/* full log */}
            <div className="px-5 py-3">
              <div className="text-xs font-bold text-muted-foreground mb-2 font-mono">ACTIVITY LOG</div>
              <div className="rounded-lg p-3 space-y-1.5 font-mono text-xs" style={{background:"#060610", border:`1px solid ${selected.color}22`}}>
                {selected.logs.map((line,i)=>(
                  <div key={i} className="flex gap-2 items-start">
                    <span style={{color:selected.color}} className="shrink-0">›</span>
                    <span className={i===selected.logs.length-1?"text-white":"text-gray-400"}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* task presets */}
            <div className="px-5 pb-5">
              <div className="text-xs font-bold text-muted-foreground mb-2 font-mono">QUICK TASKS</div>
              <div className="grid grid-cols-2 gap-2">
                {selected.taskPresets.map((task,i)=>(
                  <button key={i}
                    className="text-xs px-3 py-2 rounded-lg border text-left font-medium transition-all hover:scale-[1.02]"
                    style={{borderColor:`${selected.color}44`, background:`${selected.color}10`, color:selected.color}}
                    onClick={() => {
                      alert(`🚀 Spawning ${selected.name}: "${task}"\n\n(Agent execution coming soon!)`);
                    }}>
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
