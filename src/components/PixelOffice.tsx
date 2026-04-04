"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const S = 3;
const CW = 220;
const CH = 225; // taller for 3 rows

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c; ctx.fillRect(x*S, y*S, w*S, h*S);
}
function d(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) { r(ctx,x,y,1,1,c); }
function hl(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string) { r(ctx,x,y,w,1,c); }
function vl(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, c: string) { r(ctx,x,y,1,h,c); }

interface Agent {
  id: string; name: string; role: string; color: string;
  opChar: string; opEmoji: string; activities: string[];
  kpiKey?: string; // which API field to show
}

const AGENTS: Agent[] = [
  { id:"eli",    name:"Eli",    role:"Orchestrator", color:"#f0c000", opChar:"Luffy",  opEmoji:"🏴‍☠️",
    activities:["Routing tasks to crew...","Planning next mission 🗺️","\"I'll be King of Agents!\"","Coordinating all systems","Calling crew to deck!","Monitoring all agents"] },
  { id:"scout",  name:"Scout",  role:"Analytics",    color:"#ff8c00", opChar:"Nami",   opEmoji:"🗺️",  kpiKey:"visitors",
    activities:["Mapping traffic data 📊","Calculating optimal route...","Charting keyword rankings","3 new leads from search","Analyzing top pages","Weekly traffic report"] },
  { id:"pen",    name:"Pen",    role:"Content",      color:"#9b59b6", opChar:"Robin",  opEmoji:"📖",
    activities:["Writing blog post...","Researching Doi Inthanon 🏔️","Crafting SEO metadata","\"Nihilist-hana!\" ✍️","Sprouting 5 content ideas","Proofreading tour descriptions"] },
  { id:"closer", name:"Closer", role:"Bookings",     color:"#3498db", opChar:"Sanji",  opEmoji:"🦵",  kpiKey:"pending",
    activities:["Checking inquiry inbox...","Following up on lead 🔥","Closing Inthanon 4-pax deal","Cooking up special offer","2 bookings confirmed today!","Kicking stale leads"] },
  { id:"buzz",   name:"Buzz",   role:"Social",       color:"#e67e22", opChar:"Usopp",  opEmoji:"🎯",
    activities:["Drafting IG reel caption...","\"8,000 followers!\" 📣","Sniping trending hashtags 🎯","Scheduling 3 posts this week","Pop Green — content burst!","Monitoring FB engagement"] },
  { id:"ledger", name:"Ledger", role:"Finance",      color:"#2ecc71", opChar:"Zoro",   opEmoji:"⚔️",  kpiKey:"revenue",
    activities:["Tracking monthly revenue","Three-sword bookkeeping ⚔️","Reconciling expenses...","Slashing unnecessary costs 🗡️","Invoice generated","MTD P&L looking good"] },
  { id:"franky", name:"Franky", role:"Tech/Website", color:"#00b4ff", opChar:"Franky", opEmoji:"🤖",
    activities:["Checking Vercel deploy...","SUPER website speed! 🚀","Monitoring page errors","SSL cert ✅ all good","Running lighthouse audit","Fixing broken links 🔧"] },
  { id:"chopper",name:"Chopper",role:"Customer Care",color:"#ff6b9d", opChar:"Chopper",opEmoji:"🦌",
    activities:["Replying Google review 🌟","WhatsApp follow-up sent!","\"I'm not cute!\" 🩺","Customer survey deployed","Handling complaint kindly","Post-tour check-in sent"] },
  { id:"jinbe",  name:"Jinbe",  role:"Operations",   color:"#4a9eff", opChar:"Jinbe",  opEmoji:"🌊",
    activities:["Checking weather forecast 🌤️","Route to Inthanon clear ✅","Vehicle maintenance due!","\"Leave it to me!\" 🧭","Storm warning: standby","Tomorrow: light clouds ⛅"] },
];

const DESKS = [
  {x:8,  y:20}, {x:82, y:20}, {x:156,y:20},
  {x:8,  y:95}, {x:82, y:95}, {x:156,y:95},
  {x:8,  y:168},{x:82, y:168},{x:156,y:168},
];

// ─── Real API data ────────────────────────────────────────────────────────
interface WiroData {
  visitors?: number; pending?: number; revenue?: number;
  topTour?: string; convRate?: number; newToday?: number;
}

// ─── Character Drawers ────────────────────────────────────────────────────
function drawLuffy(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0; const y=oy+b;
  r(ctx,ox+1,y-3,12,1,"#c8a000"); r(ctx,ox+3,y-5,8,3,"#f0c000"); r(ctx,ox+4,y-6,6,2,"#f0c000");
  r(ctx,ox+3,y-1,8,7,"#ffcc99"); hl(ctx,ox+3,y-2,8,"#cc2200");
  d(ctx,ox+5,y+2,"#111"); d(ctx,ox+8,y+2,"#111"); d(ctx,ox+5,y+3,"#cc3333");
  r(ctx,ox+4,y+4,6,1,"#111"); d(ctx,ox+4,y+3,"#111"); d(ctx,ox+9,y+3,"#111");
  r(ctx,ox+2,y+6,10,8,"#cc1100"); r(ctx,ox+5,y+6,4,8,"#ffcc99");
  if(w){const sw=Math.sin(t*4)>0?1:0;r(ctx,ox,y+7+sw,3,5,"#ffcc99");r(ctx,ox+11,y+7-sw,3,5,"#ffcc99");}
  else{r(ctx,ox,y+8,3,5,"#ffcc99");r(ctx,ox+11,y+8,3,5,"#ffcc99");}
  r(ctx,ox+2,y+13,10,6,"#1155aa"); r(ctx,ox+2,y+18,4,3,"#442200"); r(ctx,ox+8,y+18,4,3,"#442200");
}
function drawNami(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0; const y=oy+b;
  r(ctx,ox+3,y-4,9,2,"#ff8c00"); r(ctx,ox+2,y-2,10,8,"#ff8c00"); r(ctx,ox+11,y+2,2,6,"#ff8c00");
  r(ctx,ox+3,y-1,8,7,"#ffcc99"); d(ctx,ox+4,y+2,"#0055cc");
  d(ctx,ox+5,y+2,"#552200"); d(ctx,ox+8,y+2,"#552200"); r(ctx,ox+5,y+4,4,1,"#aa5522");
  r(ctx,ox+3,y+6,8,5,"#ff6600"); r(ctx,ox+2,y+10,10,7,"#004499");
  r(ctx,ox+1,y+7,2,5,"#ffcc99");
  if(w){r(ctx,ox+13,y+6,2,8,"#88aa44");r(ctx,ox+11,y+7,2,5,"#ffcc99");}else{r(ctx,ox+11,y+7,2,5,"#ffcc99");}
  r(ctx,ox+4,y+17,3,4,"#ffcc99"); r(ctx,ox+7,y+17,3,4,"#ffcc99");
  r(ctx,ox+3,y+20,4,2,"#aa3300"); r(ctx,ox+7,y+20,4,2,"#aa3300");
}
function drawRobin(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0; const y=oy+b;
  r(ctx,ox+3,y-5,8,6,"#1a0a4a"); r(ctx,ox+2,y-1,2,6,"#1a0a4a"); r(ctx,ox+12,y-1,2,6,"#1a0a4a");
  r(ctx,ox+3,y-1,8,7,"#f0d0b0"); r(ctx,ox+5,y+2,2,1,"#1a0a4a"); r(ctx,ox+8,y+2,2,1,"#1a0a4a"); r(ctx,ox+5,y+4,4,1,"#aa7755");
  r(ctx,ox+2,y+6,10,9,"#4a1a6a");
  if(w){r(ctx,ox-2,y+5,3,6,"#f0d0b0");r(ctx,ox+13,y+5,3,6,"#f0d0b0");r(ctx,ox+1,y+4,2,5,"#f0d0b0");r(ctx,ox+11,y+4,2,5,"#f0d0b0");}
  else{r(ctx,ox+1,y+8,2,5,"#f0d0b0");r(ctx,ox+11,y+8,2,5,"#f0d0b0");}
  r(ctx,ox+2,y+14,10,5,"#3a0a5a"); r(ctx,ox+4,y+18,3,4,"#f0d0b0"); r(ctx,ox+7,y+18,3,4,"#f0d0b0");
  r(ctx,ox+3,y+21,4,2,"#1a0a2a"); r(ctx,ox+7,y+21,4,2,"#1a0a2a");
}
function drawSanji(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0; const y=oy+b;
  r(ctx,ox+3,y-4,8,5,"#ddaa00"); d(ctx,ox+4,y+1,"#ddaa00");
  r(ctx,ox+3,y-1,8,7,"#ffddbb"); d(ctx,ox+8,y+2,"#111"); d(ctx,ox+8,y+1,"#333");
  r(ctx,ox+9,y+4,4,1,"#ffffff"); d(ctx,ox+12,y+4,"#ff4400"); r(ctx,ox+5,y+4,4,1,"#aa5522");
  r(ctx,ox+2,y+6,10,10,"#1a1a2a"); r(ctx,ox+5,y+6,4,5,"#ddddee"); d(ctx,ox+6,y+8,"#cc1100"); d(ctx,ox+6,y+9,"#cc1100");
  if(w){const k=Math.sin(t*5)>0?1:-1;r(ctx,ox+2,y+16,5,6,"#1a1a2a");r(ctx,ox+7+k,y+14,5,8,"#1a1a2a");r(ctx,ox+1,y+8,2,5,"#ffddbb");r(ctx,ox+11,y+8,2,5,"#ffddbb");}
  else{r(ctx,ox+2,y+16,5,6,"#1a1a2a");r(ctx,ox+7,y+16,5,6,"#1a1a2a");r(ctx,ox+1,y+8,2,5,"#ffddbb");r(ctx,ox+11,y+8,2,5,"#ffddbb");}
  r(ctx,ox+1,y+21,5,2,"#111"); r(ctx,ox+6,y+21,6,2,"#111");
}
function drawUsopp(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0; const y=oy+b;
  r(ctx,ox+3,y-5,8,6,"#1a1a1a"); r(ctx,ox+2,y-2,2,5,"#1a1a1a"); r(ctx,ox+12,y-2,2,5,"#1a1a1a");
  r(ctx,ox+2,y-7,10,3,"#cc8822"); hl(ctx,ox+1,y-5,12,"#aa6611");
  r(ctx,ox+3,y-1,8,7,"#cc9966"); r(ctx,ox+7,y+3,6,2,"#bb8855"); d(ctx,ox+12,y+3,"#aa7744");
  d(ctx,ox+5,y+2,"#111"); d(ctx,ox+8,y+2,"#111"); r(ctx,ox+5,y+5,4,1,"#884422");
  r(ctx,ox+2,y+6,10,10,"#cc7722"); r(ctx,ox+5,y+6,4,10,"#885500"); r(ctx,ox+1,y+7,2,6,"#cc9966");
  if(w){r(ctx,ox+12,y+5,2,6,"#cc9966");r(ctx,ox+14,y+4,2,4,"#885500");d(ctx,ox+14,y+3,"#ff6600");}
  else{r(ctx,ox+12,y+7,2,6,"#cc9966");}
  r(ctx,ox+3,y+16,4,5,"#885500"); r(ctx,ox+7,y+16,4,5,"#885500");
  r(ctx,ox+2,y+20,5,2,"#442200"); r(ctx,ox+7,y+20,5,2,"#442200");
}
function drawZoro(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3.5)*.7):0; const y=oy+b;
  r(ctx,ox+4,y-5,6,5,"#1a7a1a"); r(ctx,ox+5,y-7,4,3,"#22aa22");
  r(ctx,ox+3,y-1,8,7,"#d4aa88"); vl(ctx,ox+8,y+1,4,"#ff3300");
  d(ctx,ox+5,y+2,"#111"); d(ctx,ox+8,y+2,"#111"); hl(ctx,ox+5,y+5,4,"#884422"); d(ctx,ox+3,y+3,"#cccc00");
  r(ctx,ox+2,y+6,10,9,"#ddeedd"); r(ctx,ox+5,y+6,4,9,"#d4aa88"); r(ctx,ox+1,y+7,2,6,"#d4aa88"); r(ctx,ox+1,y+7,2,2,"#ffffff");
  if(w){r(ctx,ox+11,y+7,2,6,"#d4aa88");r(ctx,ox+13,y+3,1,12,"#aaaacc");r(ctx,ox-1,y+3,1,12,"#aaaacc");d(ctx,ox+7,y+4,"#aaaacc");}
  else{r(ctx,ox+11,y+7,2,6,"#d4aa88");r(ctx,ox+12,y+10,1,8,"#aaaacc");}
  r(ctx,ox+2,y+15,10,6,"#1a2a1a"); r(ctx,ox+2,y+20,4,3,"#111"); r(ctx,ox+7,y+20,4,3,"#111");
}

// ─── NEW: Franky (cyborg, blue pompadour, mechanical arms) ────────────────
function drawFranky(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*3)*0.6):0; const y=oy+b;
  // Giant blue pompadour
  r(ctx,ox+2,y-8,10,8,"#0088cc"); r(ctx,ox+1,y-6,12,5,"#0099dd"); r(ctx,ox+3,y-9,8,3,"#00aaff");
  hl(ctx,ox+2,y-9,10,"#44ccff");
  // Head
  r(ctx,ox+3,y-1,8,7,"#ffddbb");
  // Star sunglasses
  r(ctx,ox+4,y+1,3,2,"#ffcc00"); r(ctx,ox+8,y+1,3,2,"#ffcc00");
  d(ctx,ox+5,y+1,"#ff8800"); d(ctx,ox+9,y+1,"#ff8800");
  // Nose (big)
  r(ctx,ox+6,y+3,2,2,"#ffaa88");
  // Smile (huge)
  r(ctx,ox+4,y+5,6,1,"#111"); d(ctx,ox+4,y+4,"#111"); d(ctx,ox+9,y+4,"#111");
  // Stubble
  d(ctx,ox+4,y+3,"#888"); d(ctx,ox+9,y+3,"#888");
  // Body (broad, blue shirt open)
  r(ctx,ox+1,y+6,12,10,"#0066aa"); r(ctx,ox+5,y+6,4,10,"#ffddbb"); // chest
  // Mechanical arms (large)
  if(w){
    const mw=Math.sin(t*4)>0?1:0;
    r(ctx,ox-3,y+5+mw,5,6,"#4488bb"); r(ctx,ox+12,y+5-mw,5,6,"#4488bb");
    // rivets
    d(ctx,ox-2,y+7,"#88ccff"); d(ctx,ox+15,y+7,"#88ccff");
  } else {
    r(ctx,ox-3,y+7,5,5,"#4488bb"); r(ctx,ox+12,y+7,5,5,"#4488bb");
    d(ctx,ox-2,y+8,"#88ccff"); d(ctx,ox+15,y+8,"#88ccff");
  }
  // Shorts (blue speedo/swim trunks)
  r(ctx,ox+2,y+15,10,5,"#0044aa");
  // Legs (mechanical)
  r(ctx,ox+2,y+19,4,5,"#4488bb"); r(ctx,ox+7,y+19,4,5,"#4488bb");
  hl(ctx,ox+2,y+21,4,"#88ccff"); hl(ctx,ox+7,y+21,4,"#88ccff");
  // Boots
  r(ctx,ox+1,y+23,5,2,"#224466"); r(ctx,ox+6,y+23,5,2,"#224466");
}

// ─── NEW: Chopper (reindeer, pink hat, cute) ──────────────────────────────
function drawChopper(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*4)*.5):0; const y=oy+b;
  // Antlers
  vl(ctx,ox+4,y-10,5,"#8b4513"); r(ctx,ox+2,y-10,3,2,"#8b4513"); r(ctx,ox+6,y-9,3,2,"#8b4513");
  vl(ctx,ox+10,y-10,5,"#8b4513"); r(ctx,ox+9,y-10,3,2,"#8b4513"); r(ctx,ox+11,y-9,3,2,"#8b4513");
  // Pink hat (doctor hat)
  r(ctx,ox+2,y-7,10,5,"#ff99bb"); r(ctx,ox+1,y-3,12,2,"#ff99bb");
  hl(ctx,ox+1,y-3,12,"#ffbbcc");
  // Cross on hat
  r(ctx,ox+6,y-6,2,4,"#cc3366"); r(ctx,ox+5,y-5,4,2,"#cc3366");
  // Head (round, brown reindeer)
  r(ctx,ox+2,y-1,10,8,"#8b5e3c");
  r(ctx,ox+3,y-1,8,8,"#a0714f");
  // Big red nose
  r(ctx,ox+6,y+4,3,2,"#ff2200"); ctx.fillStyle="#ff4422"; ctx.beginPath(); ctx.arc((ox+7)*S+S/2,(y+4)*S+S/2,S*1.2,0,Math.PI*2); ctx.fill();
  // Eyes (big cute)
  r(ctx,ox+4,y+1,2,2,"#111"); r(ctx,ox+8,y+1,2,2,"#111");
  d(ctx,ox+4,y+1,"#333"); d(ctx,ox+8,y+1,"#333");
  d(ctx,ox+5,y+1,"#ffffff"); d(ctx,ox+9,y+1,"#ffffff"); // shine
  // Smile
  r(ctx,ox+5,y+5,4,1,"#7a3a1a");
  // Body (small, cute)
  r(ctx,ox+3,y+7,8,8,"#a0714f"); r(ctx,ox+4,y+7,6,8,"#8b5e3c");
  // Doctor bag (if working)
  if(w){
    r(ctx,ox+12,y+8,5,4,"#cc3366");
    r(ctx,ox+13,y+7,3,2,"#cc3366");
    hl(ctx,ox+12,y+8,5,"#ff6699");
    // cross on bag
    r(ctx,ox+14,y+9,1,2,"#fff"); r(ctx,ox+13,y+10,3,1,"#fff");
  }
  // Arms
  r(ctx,ox+1,y+8,3,4,"#a0714f"); r(ctx,ox+10,y+8,3,4,"#a0714f");
  // Stubby legs
  r(ctx,ox+4,y+14,3,5,"#8b5e3c"); r(ctx,ox+7,y+14,3,5,"#8b5e3c");
  r(ctx,ox+3,y+18,4,2,"#555"); r(ctx,ox+7,y+18,4,2,"#555");
}

// ─── NEW: Jinbe (fish-man, blue skin, formal white jacket) ────────────────
function drawJinbe(ctx: CanvasRenderingContext2D, ox: number, oy: number, t: number, w: boolean) {
  const b=w?Math.round(Math.sin(t*2.5)*.8):0; const y=oy+b;
  // Head (large, fish-man blue)
  r(ctx,ox+2,y-2,10,9,"#2255aa"); r(ctx,ox+1,y-1,12,8,"#2255aa");
  // Fish features on head
  r(ctx,ox+1,y,2,4,"#1a4488"); r(ctx,ox+11,y,2,4,"#1a4488"); // side fins
  // Eyes (large, serious)
  r(ctx,ox+4,y+2,3,2,"#ffffff"); r(ctx,ox+8,y+2,3,2,"#ffffff");
  r(ctx,ox+5,y+2,2,2,"#1a0a00"); r(ctx,ox+9,y+2,2,2,"#1a0a00");
  d(ctx,ox+5,y+2,"#002288"); d(ctx,ox+9,y+2,"#002288");
  // Eyebrows (thick)
  hl(ctx,ox+4,y+1,3,"#1a3366"); hl(ctx,ox+8,y+1,3,"#1a3366");
  // Serious mouth
  hl(ctx,ox+5,y+5,4,"#1a3366"); d(ctx,ox+5,y+4,"#1a3366"); d(ctx,ox+8,y+4,"#1a3366");
  // Beard dots (fish-man markings)
  d(ctx,ox+5,y+6,"#1a3366"); d(ctx,ox+7,y+6,"#1a3366"); d(ctx,ox+9,y+6,"#1a3366");
  // Body (large, white formal jacket)
  r(ctx,ox+1,y+7,12,11,"#ddddee"); r(ctx,ox+5,y+7,4,11,"#2255aa"); // shirt under
  hl(ctx,ox+1,y+7,12,"#ffffff");
  // Jacket lapels
  r(ctx,ox+4,y+7,3,5,"#ddddee"); r(ctx,ox+7,y+7,3,5,"#ddddee");
  // Arms (large, blue)
  if(w){
    const sw=Math.sin(t*3)>0?1:0;
    r(ctx,ox-2,y+8+sw,4,7,"#2255aa"); r(ctx,ox+12,y+8-sw,4,7,"#2255aa");
  } else {
    r(ctx,ox-2,y+9,4,6,"#2255aa"); r(ctx,ox+12,y+9,4,6,"#2255aa");
  }
  // White sleeves on jacket
  r(ctx,ox-1,y+8,3,3,"#ddddee"); r(ctx,ox+12,y+8,3,3,"#ddddee");
  // Pants (dark blue)
  r(ctx,ox+2,y+17,10,6,"#112244");
  // Large boots
  r(ctx,ox+1,y+22,5,3,"#111"); r(ctx,ox+7,y+22,5,3,"#111");
  hl(ctx,ox+1,y+22,5,"#334466"); hl(ctx,ox+7,y+22,5,"#334466");
}

const CHARACTER_DRAWERS = [drawLuffy,drawNami,drawRobin,drawSanji,drawUsopp,drawZoro,drawFranky,drawChopper,drawJinbe];

// ─── Background ───────────────────────────────────────────────────────────
function drawBG(ctx: CanvasRenderingContext2D, t: number) {
  const grad = ctx.createLinearGradient(0,0,0,45*S);
  grad.addColorStop(0,"#1a3a6a"); grad.addColorStop(.5,"#2255aa"); grad.addColorStop(1,"#4488cc");
  ctx.fillStyle=grad; ctx.fillRect(0,0,CW*S,45*S);
  [{bx:10,by:5,w:20,spd:.3},{bx:70,by:8,w:30,spd:.18},{bx:150,by:4,w:22,spd:.25}].forEach(cl=>{
    const cx=((cl.bx+t*cl.spd*20)%(CW+cl.w))-cl.w;
    r(ctx,cx,cl.by,cl.w,3,"#c8ddf0"); r(ctx,cx+2,cl.by-2,cl.w-4,3,"#ddeeff"); r(ctx,cx+4,cl.by-3,cl.w-8,2,"#ffffff");
  });
  r(ctx,0,38,CW,8,"#1a5588"); r(ctx,0,42,CW,4,"#1e6699");
  for(let wx=0;wx<CW;wx+=18){const wo=Math.floor(Math.sin(t*1.5+wx*.2)*2);hl(ctx,wx,39+wo,10,"#4499cc");hl(ctx,wx+5,40+wo,6,"#88ccee");}
  for(let fx=0;fx<CW;fx+=10){const fo=Math.floor(Math.sin(t*2+fx*.3)*1.5);d(ctx,fx+2,43+fo,"#aaddff");d(ctx,fx+5,44+fo,"#cceeff");}
  r(ctx,0,44,CW,4,"#f0f0e8"); hl(ctx,0,44,CW,"#d8d8c8"); hl(ctx,0,47,CW,"#c8c8b8"); r(ctx,0,45,CW,2,"#2255aa");
  r(ctx,0,48,CW,12,"#7a4e2a");
  for(let wy=48;wy<60;wy+=4){hl(ctx,0,wy,CW,"#8a5e3a");hl(ctx,0,wy+1,CW,"#6a3e1a");}
  for(let bx=0;bx<CW;bx+=36){r(ctx,bx,48,3,12,"#5a3010");r(ctx,bx+1,48,1,12,"#8a6040");}
  r(ctx,0,48,CW,2,"#aa7040"); hl(ctx,0,48,CW,"#cc9060");
  r(ctx,0,59,CW,CH-59,"#7a5028");
  for(let py=59;py<CH-8;py+=5){hl(ctx,0,py,CW,"#8a6030");hl(ctx,0,py+1,CW,"#6a4018");hl(ctx,0,py+4,CW,"#5a3010");}
  for(let px=0;px<CW;px+=22){const off=((px/22)%2)*11;vl(ctx,px+off,59,CH-67,"#5a3010");}
  for(let nx=4;nx<CW;nx+=22){for(let ny=61;ny<CH-10;ny+=5)d(ctx,nx,ny,"#442200");}
  r(ctx,1,62,6,3,"#aa8844"); r(ctx,2,61,4,5,"#aa8844"); hl(ctx,1,63,6,"#cc9955");
  r(ctx,CW-7,62,6,3,"#aa8844"); r(ctx,CW-6,61,4,5,"#aa8844"); hl(ctx,CW-7,63,6,"#cc9955");
  for(let i=0;i<20;i++){d(ctx,5+i*2,2+i,"#cc9944");d(ctx,CW-5-i*2,2+i,"#cc9944");}
  for(let rx=0;rx<CW;rx+=3){const sag=Math.sin(rx/CW*Math.PI)*2;d(ctx,rx,Math.round(48+sag),"#cc9944");d(ctx,rx+1,Math.round(48+sag),"#bb8833");}
}

function drawPorthole(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
  const R=11;
  ctx.beginPath();ctx.arc(cx*S,cy*S,(R+3)*S,0,Math.PI*2);ctx.fillStyle="#8a6020";ctx.fill();
  ctx.beginPath();ctx.arc(cx*S,cy*S,(R+2)*S,-Math.PI*.8,-Math.PI*.2);ctx.strokeStyle="#ccaa44";ctx.lineWidth=S*1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(cx*S,cy*S,(R+1)*S,0,Math.PI*2);ctx.fillStyle="#443010";ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx*S,cy*S,R*S,0,Math.PI*2);ctx.clip();
  const sg=ctx.createLinearGradient(0,(cy-R)*S,0,cy*S);sg.addColorStop(0,"#2255aa");sg.addColorStop(1,"#4488cc");ctx.fillStyle=sg;ctx.fillRect((cx-R)*S,(cy-R)*S,R*2*S,R*S);
  const og=ctx.createLinearGradient(0,cy*S,0,(cy+R)*S);og.addColorStop(0,"#1a6699");og.addColorStop(1,"#0a3355");ctx.fillStyle=og;ctx.fillRect((cx-R)*S,cy*S,R*2*S,R*S);
  for(let wx=cx-R;wx<cx+R;wx+=4){const wh=Math.floor(Math.sin(t*1.5+wx*.4)*2);r(ctx,wx,cy+wh,3,1,"#4499bb");r(ctx,wx+1,cy+wh-1,2,1,"#88ccee");}
  const bx2=cx-R+((t*15)%(R*2.2));const by2=cy-R+3+Math.sin(t*2+cx)*2;
  if(bx2<cx+R-1){r(ctx,Math.round(bx2),Math.round(by2),2,1,"#ffffff");d(ctx,Math.round(bx2)-1,Math.round(by2)+1,"#ffffff");d(ctx,Math.round(bx2)+2,Math.round(by2)+1,"#ffffff");}
  ctx.fillStyle="rgba(255,255,255,0.12)";ctx.beginPath();ctx.ellipse((cx-4)*S,(cy-5)*S,3*S,5*S,-0.5,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.fillStyle="#7a5520";ctx.fillRect((cx-1)*S,(cy-R)*S,2*S,R*2*S);ctx.fillRect((cx-R)*S,(cy-1)*S,R*2*S,2*S);
  ctx.fillStyle="#aa8840";ctx.fillRect(cx*S,(cy-R)*S,S,R*2*S);ctx.fillRect((cx-R)*S,cy*S,R*2*S,S);
  [[-8,-8],[8,-8],[-8,8],[8,8]].forEach(([bpx,bpy])=>{
    ctx.beginPath();ctx.arc((cx+bpx)*S,(cy+bpy)*S,S*1.2,0,Math.PI*2);ctx.fillStyle="#cc9933";ctx.fill();
    ctx.beginPath();ctx.arc((cx+bpx)*S,(cy+bpy)*S,S*.6,0,Math.PI*2);ctx.fillStyle="#665511";ctx.fill();
  });
  ctx.fillStyle=`rgba(180,220,255,${.05+Math.sin(t*.5)*.02})`;ctx.fillRect((cx-R)*S,59*S,R*2*S,120*S);
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  vl(ctx,x+2,y+14,9,"#2a2a4a");vl(ctx,x+22,y+14,9,"#2a2a4a");vl(ctx,x+3,y+14,9,"#3a3a5a");vl(ctx,x+23,y+14,9,"#3a3a5a");
  r(ctx,x+1,y+10,24,5,"#1a1a3a");hl(ctx,x+1,y+10,24,"#2a2a4a");
  r(ctx,x,y+8,26,3,"#222244");hl(ctx,x,y+8,26,"#4a4a8a");hl(ctx,x,y+9,26,"#333366");
  r(ctx,x+6,y+7,10,2,"#1a1a33");hl(ctx,x+7,y+7,8,"#333355");
  ctx.fillStyle="rgba(0,150,255,0.06)";ctx.fillRect((x+2)*S,(y+4)*S,22*S,8*S);
}
function drawMonitor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number, working: boolean) {
  r(ctx,x+9,y+6,4,4,"#1a1a3a");r(ctx,x+6,y+9,10,2,"#111122");
  r(ctx,x+1,y-5,20,13,"#111122");hl(ctx,x+1,y-5,20,"#2a2a5a");
  r(ctx,x+2,y-4,18,11,"#000811");
  const hex=color.replace('#','');const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
  if(working){
    const sc=Math.floor(t*3)%10;
    for(let i=0;i<4;i++){const ly=y-3+((i*3+sc)%10);if(ly>=y-4&&ly<y+6){r(ctx,x+3,ly,5+(i%3)*3,1,color);r(ctx,x+3+6+(i%3)*3+1,ly,3,1,"#334455");}}
    if(Math.floor(t*2)%2===0)d(ctx,x+3,y+5,"#ffffff");
    ctx.fillStyle=`rgba(${rr},${gg},${bb},0.12)`;ctx.fillRect((x-1)*S,(y-7)*S,24*S,20*S);
  } else {
    const alpha=.2+Math.sin(t*.7+rr)*.15;ctx.fillStyle=`rgba(${rr},${gg},${bb},${alpha})`;ctx.fillRect((x+3)*S,(y-2)*S,14*S,6*S);
  }
  ctx.strokeStyle=working?`${color}66`:"#2a2a5a";ctx.lineWidth=S*.6;ctx.strokeRect((x+1)*S,(y-5)*S,20*S,13*S);
}
function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  r(ctx,x+7,y+18,12,11,"#0a1a2a");hl(ctx,x+7,y+18,12,color+"44");
  r(ctx,x+5,y+27,16,4,"#112233");hl(ctx,x+5,y+27,16,"#1a3344");
  vl(ctx,x+6,y+30,6,"#0a1a2a");vl(ctx,x+18,y+30,6,"#0a1a2a");vl(ctx,x+10,y+30,6,"#0a1a2a");vl(ctx,x+14,y+30,6,"#0a1a2a");
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const workingRef = useRef<Record<string,boolean>>({
    eli:true, scout:true, pen:false, closer:true, buzz:false, ledger:true,
    franky:true, chopper:true, jinbe:true,
  });
  const activityIdxRef = useRef<Record<string,number>>(
    Object.fromEntries(AGENTS.map((a,i)=>[a.id,i%a.activities.length]))
  );
  const [uiWorking, setUiWorking] = useState({...workingRef.current});
  const [uiActivity, setUiActivity] = useState({...activityIdxRef.current});
  const [wiroData, setWiroData] = useState<WiroData>({});
  const [notifyIds, setNotifyIds] = useState<Set<string>>(new Set());
  const prevPendingRef = useRef<number>(0);

  // ── Fetch real WIRO data ──────────────────────────────────────────────
  useEffect(() => {
    const KEY = "a19cd93295b6f5d1d010c3364111d301fa5303b1fb7e8dce9322ddc2983854ae";
    const BASE = "https://wiro4x4indochina.com/api/agent";
    async function fetchData() {
      try {
        const [bookRes, analytRes] = await Promise.allSettled([
          fetch(`${BASE}/bookings/pending`,   {headers:{"X-Agent-Key":KEY}}),
          fetch(`${BASE}/analytics/summary`,  {headers:{"X-Agent-Key":KEY}}),
        ]);
        const out: WiroData = {};
        if (bookRes.status==="fulfilled" && bookRes.value.ok) {
          const j = await bookRes.value.json();
          out.pending = Array.isArray(j?.data) ? j.data.length : (j?.count ?? 0);
          // notify Closer if new pending
          if (out.pending > prevPendingRef.current && prevPendingRef.current > 0) {
            setNotifyIds(s => new Set([...s,"closer"]));
            setTimeout(()=>setNotifyIds(s=>{const n=new Set(s);n.delete("closer");return n;}), 5000);
          }
          prevPendingRef.current = out.pending;
        }
        if (analytRes.status==="fulfilled" && analytRes.value.ok) {
          const j = await analytRes.value.json();
          out.visitors  = j?.data?.overview?.totalVisitors ?? j?.visitors;
          out.topTour   = j?.data?.topTours?.[0]?.name;
          out.convRate  = j?.data?.funnel?.conversionRate;
        }
        setWiroData(out);
      } catch { /* silent */ }
    }
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Sync refs → state for HTML panel ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setUiWorking({...workingRef.current});
      setUiActivity({...activityIdxRef.current});
    }, 800);
    return () => clearInterval(id);
  }, []);

  function toggleAgent(id: string) {
    workingRef.current[id] = !workingRef.current[id];
    setUiWorking({...workingRef.current});
  }

  // ── Canvas draw loop ──────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d"); if(!ctx) return;
    ctx.imageSmoothingEnabled=false;
    tRef.current+=0.04;
    const t=tRef.current;

    if(Math.round(t*25)%100===0) AGENTS.forEach(a=>{ activityIdxRef.current[a.id]=(activityIdxRef.current[a.id]+1)%a.activities.length; });

    ctx.clearRect(0,0,CW*S,CH*S);
    drawBG(ctx,t);
    drawPorthole(ctx,18,53,t); drawPorthole(ctx,110,53,t); drawPorthole(ctx,202,53,t);

    // Mast + Jolly Roger
    vl(ctx,3,0,12,"#5a3010");r(ctx,4,0,2,12,"#7a4a20");
    const fw=Math.sin(t*2)*1.5;
    r(ctx,5,1,14,9,"#111111");hl(ctx,5,1+Math.round(fw),14,"#1a1a1a");
    r(ctx,9,2,6,4,"#eeeeee");r(ctx,10,5,4,2,"#eeeeee");
    d(ctx,10,3,"#111111");d(ctx,13,3,"#111111");
    d(ctx,8,6,"#eeeeee");d(ctx,15,6,"#eeeeee");d(ctx,9,7,"#eeeeee");d(ctx,14,7,"#eeeeee");
    d(ctx,10,8,"#eeeeee");d(ctx,13,8,"#eeeeee");d(ctx,8,8,"#eeeeee");d(ctx,15,8,"#eeeeee");

    // Barrel + Anchor
    r(ctx,CW-12,100,10,14,"#6a4010");hl(ctx,CW-12,100,10,"#8a5a20");hl(ctx,CW-12,107,10,"#8a5a20");hl(ctx,CW-12,113,10,"#8a5a20");
    r(ctx,CW-13,102,12,2,"#666666");r(ctx,CW-13,109,12,2,"#666666");
    vl(ctx,4,65,18,"#888899");r(ctx,2,65,5,2,"#888899");r(ctx,2,80,2,4,"#888899");r(ctx,7,80,2,4,"#888899");
    d(ctx,3,83,"#888899");d(ctx,8,83,"#888899");r(ctx,4,62,3,4,"#aaaaaa");hl(ctx,3,62,5,"#cccccc");

    // Workstations
    AGENTS.forEach((agent,i)=>{
      const{x,y}=DESKS[i]; const working=workingRef.current[agent.id]??true;
      const isNotify=notifyIds.has(agent.id);
      drawChair(ctx,x,y,agent.color);
      drawDesk(ctx,x,y);
      drawMonitor(ctx,x+3,y+2,agent.color,t,working);
      CHARACTER_DRAWERS[i](ctx,x+5,y-26,t,working);

      // Status dot — pulse if notification
      if(isNotify){
        const pulse=Math.sin(t*10)>0;
        r(ctx,x+23,y-27,4,4,pulse?"#ff4444":"#ff0000");
      } else {
        r(ctx,x+24,y-26,2,2,working?"#44ff88":"#555566");
      }
    });

    // Hover highlight
    if(hovered){
      const idx=AGENTS.findIndex(a=>a.id===hovered);
      if(idx>=0){
        const{x,y}=DESKS[idx];
        ctx.strokeStyle=AGENTS[idx].color;ctx.lineWidth=S*.7;
        ctx.setLineDash([S*2,S]);
        ctx.strokeRect((x-2)*S,(y-30)*S,32*S,62*S);
        ctx.setLineDash([]);
      }
    }

    // HUD
    r(ctx,0,CH-9,CW,9,"#06060f");hl(ctx,0,CH-9,CW,"#4a3a10");
    ctx.fillStyle="#f0c000";ctx.font=`bold ${S*1.7}px 'Courier New',monospace`;
    ctx.fillText("⚓ Going Merry — Eli HQ",3*S,(CH-2)*S);
    const active=Object.values(workingRef.current).filter(Boolean).length;
    ctx.fillStyle=active>=7?"#44ff88":active>=5?"#ffaa44":"#ff4444";
    ctx.fillText(`${active}/9 crew`,(CW-26)*S,(CH-2)*S);

    animRef.current=requestAnimationFrame(draw);
  },[hovered, notifyIds]);

  useEffect(()=>{animRef.current=requestAnimationFrame(draw);return()=>cancelAnimationFrame(animRef.current);},[draw]);

  function getAgentAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect2=e.currentTarget.getBoundingClientRect();
    const mx=(e.clientX-rect2.left)*(CW*S/rect2.width)/S;
    const my=(e.clientY-rect2.top)*(CH*S/rect2.height)/S;
    return AGENTS.find((_,i)=>{const{x,y}=DESKS[i];return mx>=x-2&&mx<=x+30&&my>=y-30&&my<=y+34;});
  }

  // Real KPI label for each agent
  function getKPI(agent: Agent): { label: string; value: string } | null {
    if(agent.id==="closer" && wiroData.pending!=null)
      return { label:"Pending inquiries", value: `${wiroData.pending}` + (wiroData.pending>0?" 🔴":" ✅") };
    if(agent.id==="scout" && wiroData.visitors!=null)
      return { label:"Total visitors", value: wiroData.visitors.toLocaleString() };
    if(agent.id==="scout" && wiroData.topTour)
      return { label:"Top tour", value: wiroData.topTour! };
    if(agent.id==="jinbe") return { label:"Weather check", value:"Chiang Mai ⛅ 31°C" };
    if(agent.id==="franky") return { label:"Deploy status", value:"✅ Vercel live" };
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="rounded-2xl overflow-hidden border border-amber-900/40 bg-[#06060f] shadow-2xl shadow-black/70">
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
          onMouseMove={e=>setHovered(getAgentAt(e)?.id??null)}
          onMouseLeave={()=>setHovered(null)}
          onClick={e=>{const ag=getAgentAt(e);if(ag)toggleAgent(ag.id);}}
        />
        <div className="px-4 py-1.5 border-t border-amber-900/30 bg-[#0a0800]">
          <span className="text-[10px] text-amber-800 font-mono">Click to toggle crew · 🔴 = new notification</span>
        </div>
      </div>

      {/* Crew Activity Feed */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-base">🏴‍☠️</span>
          <h3 className="text-sm font-bold text-foreground">Crew Activity</h3>
          {Object.values(wiroData).some(v=>v!=null) && (
            <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-mono">● Live data</span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">updates ~4s</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AGENTS.map(agent=>{
            const isWorking=uiWorking[agent.id];
            const isHov=hovered===agent.id;
            const isNotify=notifyIds.has(agent.id);
            const msg=agent.activities[uiActivity[agent.id]??0];
            const kpi=getKPI(agent);
            return (
              <button
                key={agent.id}
                onClick={()=>toggleAgent(agent.id)}
                onMouseEnter={()=>setHovered(agent.id)}
                onMouseLeave={()=>setHovered(null)}
                className="flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden"
                style={{
                  background: isNotify ? `${agent.color}20` : isHov ? `${agent.color}18` : `${agent.color}08`,
                  borderColor: isNotify ? "#ff4444" : isHov ? `${agent.color}88` : `${agent.color}25`,
                  boxShadow: isNotify ? "0 0 20px rgba(255,68,68,0.3)" : isHov ? `0 0 16px ${agent.color}22` : "none",
                  animation: isNotify ? "pulse 1s infinite" : "none",
                }}
              >
                {isNotify && <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-bounce">NEW!</span>}
                <div className="text-3xl leading-none mt-0.5 select-none">{agent.opEmoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold" style={{color:agent.color}}>{agent.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{agent.opChar}</span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${isWorking?"bg-green-500/15 text-green-400":"bg-gray-500/15 text-gray-500"}`}>
                      {isWorking?"● ON":"○ IDLE"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-2">{agent.role}</div>
                  {/* Activity */}
                  <div className="text-sm font-medium leading-snug mb-2" style={{color:isWorking?agent.color:"#666677"}}>
                    {isWorking ? msg : "💤 Idle — awaiting orders"}
                  </div>
                  {/* Real KPI badge */}
                  {kpi && isWorking && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{kpi.label}:</span>
                      <span className="text-[11px] font-bold" style={{color:agent.color}}>{kpi.value}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
