"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Iso config ─────────────────────────────────────────────────────────────
const CW = 280, CH = 210, S = 3;
const HW = 14, HH = 7;
const OX = 140, OY = 58;
const WALL_H = 34;

function ts(c: number, r: number) {
  return { x: OX + (c - r) * HW, y: OY + (c + r) * HH };
}
function poly(ctx: CanvasRenderingContext2D, pts: [number,number][], fill: string, stroke?: string, lw = 0.8) {
  ctx.beginPath(); ctx.moveTo(pts[0][0]*S, pts[0][1]*S);
  for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0]*S, pts[i][1]*S);
  ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
  if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.stroke(); }
}

function isoFloor(ctx: CanvasRenderingContext2D, c: number, r: number, fill: string, stroke?: string) {
  const n=ts(c,r), e=ts(c+1,r), s=ts(c+1,r+1), w=ts(c,r+1);
  poly(ctx,[[n.x,n.y],[e.x,e.y],[s.x,s.y],[w.x,w.y]], fill, stroke);
}

function isoBox(ctx: CanvasRenderingContext2D, c: number, r: number, W: number, D: number, H: number,
  topC: string, leftC: string, rightC: string, line?: string) {
  const fl=ts(c,r+D), fp=ts(c+W,r+D), fr=ts(c+W,r), bk=ts(c,r);
  poly(ctx,[[fl.x,fl.y],[fp.x,fp.y],[fp.x,fp.y-H],[fl.x,fl.y-H]], leftC, line);
  poly(ctx,[[fr.x,fr.y],[fp.x,fp.y],[fp.x,fp.y-H],[fr.x,fr.y-H]], rightC, line);
  poly(ctx,[[bk.x,bk.y-H],[fr.x,fr.y-H],[fp.x,fp.y-H],[fl.x,fl.y-H]], topC, line);
}

function wallR(ctx: CanvasRenderingContext2D, c: number, fill: string) {
  const p1=ts(c,0), p2=ts(c+1,0);
  poly(ctx,[[p1.x,p1.y],[p2.x,p2.y],[p2.x,p2.y-WALL_H],[p1.x,p1.y-WALL_H]], fill);
}
function wallL(ctx: CanvasRenderingContext2D, r: number, fill: string) {
  const p1=ts(0,r), p2=ts(0,r+1);
  poly(ctx,[[p1.x,p1.y],[p2.x,p2.y],[p2.x,p2.y-WALL_H],[p1.x,p1.y-WALL_H]], fill);
}

// ── Pixel helpers ──────────────────────────────────────────────────────────
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle=c; ctx.fillRect(x*S,y*S,w*S,h*S);
}
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) { px(ctx,x,y,1,1,c); }
function hln(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string) { px(ctx,x,y,w,1,c); }

// ── Agents ────────────────────────────────────────────────────────────────
interface Agent {
  id: string; name: string; role: string; color: string;
  opEmoji: string; skinC: string; hairC: string; topC: string;
  logs: string[]; taskPresets: string[];
}
const AGENTS: Agent[] = [
  { id:"eli",    name:"Eli",    role:"Orchestrator", color:"#f0c000", opEmoji:"🏴‍☠️",
    skinC:"#f4c27e", hairC:"#2a1a08", topC:"#cc1100",
    logs:["[09:01] All 9 crew dispatched","[09:05] Systems online ✓","[09:12] Routing → Closer","[09:18] Daily brief sent","[09:31] Monitoring HQ"],
    taskPresets:["Daily summary","Agent status","Weekly report","Urgent mission"] },
  { id:"scout",  name:"Scout",  role:"Analytics",    color:"#ff8c00", opEmoji:"🗺️",
    skinC:"#e8b896", hairC:"#c87000", topC:"#ff6600",
    logs:["[09:00] Traffic: 1,240 today","[09:15] Inthanon trending ↑","[09:22] +18% this week","[09:35] 3 new leads","[09:44] Top: Tel Aviv 🇮🇱"],
    taskPresets:["Traffic report","Top pages","Rankings","Funnel"] },
  { id:"pen",    name:"Pen",    role:"Content/SEO",  color:"#9b59b6", opEmoji:"📖",
    skinC:"#d4a882", hairC:"#1a0a3a", topC:"#4a1a6a",
    logs:["[08:45] Blog: Doi Inthanon","[09:10] SEO meta done ✓","[09:28] 5 keywords","[09:40] Proofreading","[09:55] Calendar updated"],
    taskPresets:["Write blog","Tour desc","FAQ page","IG captions"] },
  { id:"closer", name:"Closer", role:"Bookings",     color:"#3498db", opEmoji:"🦵",
    skinC:"#c8905a", hairC:"#ddaa00", topC:"#1a1a2a",
    logs:["[09:03] 2 new inquiries 🔔","[09:17] David (IL) — quoted","[09:25] Sarah confirmed ✓","[09:38] Follow-up: Anna","[09:50] Pipeline: 5 leads"],
    taskPresets:["Check inquiries","Follow up","Confirm booking","Price quote"] },
  { id:"buzz",   name:"Buzz",   role:"Social",       color:"#e67e22", opEmoji:"🎯",
    skinC:"#8a5030", hairC:"#1a1a1a", topC:"#cc7722",
    logs:["[09:05] IG reel: 320 views 🔥","[09:20] FB scheduled ×3","[09:33] #ChiangMai trending","[09:48] Story uploaded ✓","[09:59] Engagement +12%"],
    taskPresets:["IG captions","Post plan","Trending tags","FB post"] },
  { id:"ledger", name:"Ledger", role:"Finance",      color:"#2ecc71", opEmoji:"⚔️",
    skinC:"#a07040", hairC:"#1a2a1a", topC:"#1a4a1a",
    logs:["[09:00] Revenue: ฿45,000","[09:15] Invoice #47 sent ✓","[09:22] Expenses logged","[09:40] P&L: healthy 📈","[09:55] 3 payments in"],
    taskPresets:["MTD report","Invoices","Profit margin","Export"] },
  { id:"franky", name:"Franky", role:"Tech/Web",     color:"#00b4ff", opEmoji:"🤖",
    skinC:"#f4d4a0", hairC:"#0088cc", topC:"#0066aa",
    logs:["[09:02] Vercel: ✅ live","[09:18] Lighthouse: 94","[09:30] SSL: 60d valid","[09:45] 0 broken links ✓","[09:58] Speed: 1.2s SUPER!"],
    taskPresets:["Site audit","Vercel status","Page speed","Broken links"] },
  { id:"chopper",name:"Chopper",role:"Customer Care",color:"#ff6b9d", opEmoji:"🦌",
    skinC:"#f8c090", hairC:"#cc3366", topC:"#ff99bb",
    logs:["[09:10] Review replied ⭐×5","[09:25] WA follow-up ×2","[09:37] Survey sent","[09:48] CSAT: 4.9/5 ✓","[09:55] 0 complaints"],
    taskPresets:["Reply reviews","Survey","WA message","Feedback"] },
  { id:"jinbe",  name:"Jinbe",  role:"Operations",   color:"#4a9eff", opEmoji:"🌊",
    skinC:"#6888cc", hairC:"#1a3a6a", topC:"#ddddee",
    logs:["[09:00] Weather: ⛅ 31°C","[09:15] Route: clear ✓","[09:30] Vehicle #2 due 🔧","[09:42] Tomorrow: cloudy","[09:58] 2 tours on track ✅"],
    taskPresets:["Forecast","Route check","Vehicle log","Safety check"] },
];

// Desk grid (col, row)
const DESK_POS = [
  {col:1,row:1},{col:4,row:1},{col:7,row:1},
  {col:1,row:4},{col:4,row:4},{col:7,row:4},
  {col:1,row:7},{col:4,row:7},{col:7,row:7},
];

// ── Character drawing ─────────────────────────────────────────────────────
function drawChar(ctx: CanvasRenderingContext2D, agent: Agent, cx: number, cy: number, t: number, working: boolean) {
  const b = working ? Math.round(Math.sin(t*3.5)*0.6) : 0;
  const y = cy + b;
  const skin = agent.skinC, hair = agent.hairC, top = agent.topC;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(cx*S, (y+2)*S, 7*S, 2*S, 0, 0, Math.PI*2); ctx.fill();

  // Shoes
  px(ctx, cx-4, y, 3, 2, "#111"); px(ctx, cx+1, y, 3, 2, "#111");
  hln(ctx, cx-4, y, 3, "#333"); hln(ctx, cx+1, y, 3, "#333");

  // Legs
  px(ctx, cx-3, y-5, 2, 5, "#333"); px(ctx, cx+1, y-5, 2, 5, "#333");

  // Body + arms
  px(ctx, cx-4, y-13, 9, 8, top);
  hln(ctx, cx-4, y-13, 9, agent.color + "88"); // collar accent
  if (working) {
    const sw = Math.sin(t*4)>0?1:0;
    px(ctx, cx-6, y-12+sw, 3, 5, skin); px(ctx, cx+4, y-12-sw, 3, 5, skin);
  } else {
    px(ctx, cx-6, y-11, 3, 5, skin); px(ctx, cx+4, y-11, 3, 5, skin);
  }

  // Neck + head
  px(ctx, cx-1, y-15, 3, 2, skin);
  px(ctx, cx-4, y-23, 9, 8, skin);

  // Hair (different styles per agent based on hairC)
  px(ctx, cx-4, y-23, 9, 3, hair);
  if (agent.id === "franky") {
    // Pompadour
    px(ctx, cx-3, y-26, 7, 4, hair); px(ctx, cx-2, y-28, 5, 3, "#00aaff");
  } else if (agent.id === "chopper") {
    // Antlers + pink hat
    px(ctx, cx-2, y-30, 10, 5, "#ff99bb");
    ctx.fillStyle = "#8b4513";
    ctx.fillRect((cx-3)*S,(y-33)*S,S,5*S); ctx.fillRect((cx+3)*S,(y-33)*S,S,5*S);
    px(ctx, cx-1, y-31, 3, 2, "#8b4513"); px(ctx, cx+1, y-31, 3, 2, "#8b4513");
  } else if (agent.id === "jinbe") {
    px(ctx, cx-4, y-23, 9, 2, "#2255aa"); // blue fishman
  } else if (agent.id === "zoro" || agent.id === "ledger") {
    px(ctx, cx-3, y-27, 7, 5, "#1a7a1a"); // green mohawk
  }

  // Eyes
  dot(ctx, cx-2, y-19, "#111"); dot(ctx, cx+1, y-19, "#111");
  dot(ctx, cx-2, y-20, "#ffffff44"); dot(ctx, cx+1, y-20, "#ffffff44");

  // Mouth — smile if working
  if (working) { hln(ctx, cx-2, y-17, 5, "#884422"); dot(ctx, cx-2, y-18, "#884422"); dot(ctx, cx+2, y-18, "#884422"); }
  else { hln(ctx, cx-1, y-17, 4, "#884422"); }

  // Headphones (if working)
  if (working) {
    px(ctx, cx-5, y-22, 2, 4, "#333"); px(ctx, cx+4, y-22, 2, 4, "#333");
    ctx.fillStyle = "#444"; ctx.beginPath(); ctx.arc(cx*S,(y-23)*S,5*S,Math.PI,0); ctx.stroke();
  }

  // Agent color accent on shirt
  hln(ctx, cx-3, y-8, 7, agent.color + "cc");
}

// ── VS Code style monitor ────────────────────────────────────────────────
function drawMonitorScreen(ctx: CanvasRenderingContext2D, sx: number, sy: number, agent: Agent, t: number, working: boolean) {
  const sw = 22, sh = 14; // screen width/height in logical px
  // Screen bg
  px(ctx, sx, sy, sw, sh, "#0d1117");
  // Sidebar (VS Code)
  px(ctx, sx, sy, 4, sh, "#1e1e2e");
  // Sidebar icons
  for (let i=0;i<4;i++) {
    px(ctx, sx+1, sy+1+i*3, 2, 2, i===0?"#4a90d9":"#555566");
  }
  // Code lines
  if (working) {
    const scroll = Math.floor(t*2) % 8;
    const colors = [agent.color, "#4a90d9", "#88cc44", agent.color+"88", "#cc8844"];
    for (let i=0;i<5;i++) {
      const lx = sx+5, ly = sy+1+((i+scroll)%8);
      if (ly < sy+sh-1) {
        const lw = 4 + (i*3+scroll) % 12;
        px(ctx, lx, ly, Math.min(lw, sw-6), 1, colors[i%colors.length]);
        if (i%2===0 && lw+4 < sw-6) px(ctx, lx+lw+1, ly, 3, 1, "#555566");
      }
    }
    // Cursor blink
    if (Math.floor(t*2)%2===0) px(ctx, sx+5, sy+sh-3, 1, 2, "#ffffff");
    // Scrollbar
    px(ctx, sx+sw-1, sy+2, 1, 4, "#333344");
    // Tab bar
    px(ctx, sx+4, sy, sw-4, 1, "#181825");
    px(ctx, sx+4, sy, 8, 1, "#1e1e2e");
  } else {
    // Screensaver
    const a = 0.2+Math.sin(t*0.7)*0.15;
    const hex=agent.color.replace('#','');
    const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
    ctx.fillStyle=`rgba(${rr},${gg},${bb},${a})`;
    ctx.fillRect((sx+5)*S,(sy+4)*S,12*S,6*S);
  }
  // Screen glow
  if (working) {
    const hex=agent.color.replace('#','');
    const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
    ctx.fillStyle=`rgba(${rr},${gg},${bb},0.08)`;
    ctx.beginPath(); ctx.ellipse((sx+11)*S,(sy+sh+2)*S,12*S,4*S,0,0,Math.PI*2); ctx.fill();
  }
}

// ── Scene draw ────────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D, t: number,
  agents: Agent[],
  workingRef: React.MutableRefObject<Record<string,boolean>>,
  logIdxRef: React.MutableRefObject<Record<string,number>>,
  hovered: string|null,
  notifyIds: Set<string>
) {
  // ── Sky / background ─────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, (OY - WALL_H + 2) * S);
  bg.addColorStop(0, "#060318"); bg.addColorStop(1, "#0f0830");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CW*S, CH*S);

  // ── Back wall (RIGHT — col spans) ────────────────────────────────────
  for (let c = 0; c <= 9; c++) {
    wallR(ctx, c, c%2===0 ? "#1e1438" : "#1a1030");
    // Wall trim
    const p1=ts(c,0), p2=ts(c+1,0);
    poly(ctx,[[p1.x,p1.y-WALL_H],[p2.x,p2.y-WALL_H],[p2.x,p2.y-WALL_H+3],[p1.x,p1.y-WALL_H+3]],"#3a1a6a");
    // Skirting bottom
    poly(ctx,[[p1.x,p1.y-2],[p2.x,p2.y-2],[p2.x,p2.y],[p1.x,p1.y]],"#160c30");
  }

  // ── Back wall (LEFT — row spans) ─────────────────────────────────────
  for (let r = 0; r <= 9; r++) {
    wallL(ctx, r, r%2===0 ? "#1c1234" : "#18102c");
    const p1=ts(0,r), p2=ts(0,r+1);
    poly(ctx,[[p1.x,p1.y-WALL_H],[p2.x,p2.y-WALL_H],[p2.x,p2.y-WALL_H+3],[p1.x,p1.y-WALL_H+3]],"#2a1850");
    poly(ctx,[[p1.x,p1.y-2],[p2.x,p2.y-2],[p2.x,p2.y],[p1.x,p1.y]],"#14082a");
  }

  // ── Bookshelf on back-right wall (col 3–7, row=0) ───────────────────
  for (let c = 2; c <= 8; c++) {
    const p1=ts(c,0), p2=ts(c+1,0);
    const midX = (p1.x+p2.x)/2, midY = (p1.y+p2.y)/2;
    // Shelf frame
    poly(ctx,[[p1.x+1,p1.y-WALL_H+2],[p2.x-1,p2.y-WALL_H+2],[p2.x-1,p2.y-4],[p1.x+1,p1.y-4]], "#3a2410");
    // Shelf dividers
    for (let sh=0;sh<3;sh++) {
      const sy2 = p1.y - WALL_H + 4 + sh * 8;
      hln(ctx, Math.round(p1.x)+1, Math.round(sy2), Math.round(p2.x-p1.x)-2, "#4a3018");
    }
    // Books
    const bookColors = [["#cc2200","#2255aa","#22aa44","#aaaa22","#aa22aa"],["#ff6600","#22aaaa","#cc4488","#4488cc","#88cc22"],["#882200","#004488","#228844","#888800","#880088"]];
    for (let sh=0;sh<3;sh++) {
      const sy2 = p1.y - WALL_H + 5 + sh * 8;
      const bc = bookColors[sh];
      for (let bi=0;bi<5;bi++) {
        const bx = p1.x + 1.5 + bi * 1.8 + (p2.x-p1.x-10)/2;
        px(ctx, Math.round(bx), Math.round(sy2), 1, 5, bc[bi%bc.length]);
        hln(ctx, Math.round(bx), Math.round(sy2), 1, bc[bi%bc.length]+"cc");
      }
    }
  }

  // ── Windows on right wall ───────────────────────────────────────────
  for (const wc of [1, 9]) {
    const p1=ts(wc,0), p2=ts(wc+1,0);
    const wx=(p1.x+p2.x)/2, wy=(p1.y+p2.y)/2 - WALL_H + 6;
    // Frame
    poly(ctx,[[wx-5,wy],[wx+5,wy],[wx+5,wy+14],[wx-5,wy+14]], "#2a1848");
    // Sky gradient
    const wg=ctx.createLinearGradient(0,wy*S,0,(wy+14)*S);
    wg.addColorStop(0,"#0a2060"); wg.addColorStop(1,"#1a4a8a");
    ctx.fillStyle=wg; ctx.fillRect((wx-4)*S,(wy+1)*S,8*S,12*S);
    // Stars in window
    for (let si=0;si<4;si++) {
      const sx2=wx-3+si*2.2, sy2=wy+2+si*0.8;
      dot(ctx,Math.round(sx2),Math.round(sy2),"#ffffff");
    }
    // Cross divider
    ctx.fillStyle="#2a1848"; ctx.fillRect(wx*S-0.5,(wy+1)*S,S,12*S); ctx.fillRect((wx-4)*S,(wy+7)*S,8*S,S);
    // Window glow on floor
    ctx.fillStyle=`rgba(30,80,180,${0.04+Math.sin(t*0.4+wc)*0.015})`;
    ctx.fillRect((wx-4)*S,(wy+12)*S,8*S,80*S);
  }

  // ── "AI AGENTS" / "WIRO HQ" sign on back wall ──────────────────────
  {
    const sp = ts(4.5, 0);
    const sx = sp.x, sy = sp.y - WALL_H + 4;
    // Sign bg
    px(ctx, Math.round(sx-18), Math.round(sy), 36, 8, "#0a0820");
    ctx.strokeStyle="#f0c000"; ctx.lineWidth=1.5;
    ctx.strokeRect((sx-17)*S, sy*S, 34*S, 8*S);
    // Glowing title text
    ctx.fillStyle = "#f0c000";
    ctx.shadowColor = "#f0c000"; ctx.shadowBlur = S*2;
    ctx.font = `bold ${S*2.2}px 'Courier New', monospace`;
    ctx.fillText("ELI  HQ", (sx-14)*S, (sy+6)*S);
    ctx.shadowBlur = 0;
  }

  // ── JS / Python sticky signs ─────────────────────────────────────────
  {
    const sp = ts(1, 0);
    px(ctx,Math.round(sp.x-3),Math.round(sp.y-WALL_H+8),10,8,"#aaaa22");
    ctx.fillStyle="#111"; ctx.font=`bold ${S*2}px monospace`;
    ctx.fillText("JS",Math.round((sp.x-2)*S),Math.round((sp.y-WALL_H+15)*S));
    // sticky notes
    px(ctx,Math.round(sp.x+4),Math.round(sp.y-WALL_H+8),5,4,"#ff8888");
    px(ctx,Math.round(sp.x+4),Math.round(sp.y-WALL_H+13),5,3,"#88ffaa");
  }

  // ── Bug tracker board (on floor, right area) ─────────────────────────
  {
    const bp = ts(8.5, 5.5);
    const bx=bp.x, by=bp.y-4;
    px(ctx,Math.round(bx-8),Math.round(by-14),16,14,"#f0f0e0");
    px(ctx,Math.round(bx-7),Math.round(by-13),14,1,"#cc3300");
    ctx.fillStyle="#333"; ctx.font=`bold ${S}px monospace`;
    ctx.fillText("BUG TRACKER",(bx-7)*S,(by-11)*S);
    // Rows
    const statuses=[["#cc3300","#22aa44","#cc3300"],["#22aa44","#cc3300","#22aa44"],["#cc3300","#22aa44","#22aa44"]];
    statuses.forEach((row,ri) => row.forEach((c,ci) => {
      px(ctx,Math.round(bx-6+ci*4),Math.round(by-9+ri*3),3,2,c);
      ctx.fillStyle="#fff"; ctx.font=`${S*0.8}px monospace`;
      ctx.fillText(c==="#22aa44"?"✓":"✗",(bx-5.5+ci*4)*S,(by-7.8+ri*3)*S);
    }));
  }

  // ── Depth-sorted items ────────────────────────────────────────────────
  type RenderItem = { depth: number; fn: ()=>void };
  const items: RenderItem[] = [];

  // Floor tiles
  for (let c=0;c<9;c++) {
    for (let r=0;r<9;r++) {
      const dc=c, dr=r;
      // Warm wood floor
      const isRug = c>=2&&c<=7&&r>=2&&r<=7;
      const even = (c+r)%2===0;
      let fc = even ? "#c4783c" : "#b06830";
      let lc = "#9a5820";
      if (isRug) { fc = even ? "#c8783a" : "#b87030"; lc = "#a06020"; }
      // Rug border
      if (c===2&&r>=2&&r<=7||c===7&&r>=2&&r<=7||r===2&&c>=2&&c<=7||r===7&&c>=2&&c<=7)
        lc = "#8a4a2a";
      items.push({ depth:dc+dr, fn:()=>isoFloor(ctx,dc,dr,fc,lc) });
    }
  }

  // Bookshelf units (left wall area)
  items.push({ depth:0+2-0.5, fn:()=>{
    isoBox(ctx,0,2,0.8,0.5,18,"#4a3010","#2a1808","#3a2210","#1a0808");
    // Books on left bookshelf
    const bp2=ts(0.8,2.25);
    [["#cc2200","#2255aa","#228844"],["#ff6600","#22ccaa","#cc44aa"]].forEach((row,ri) => {
      row.forEach((bc,ci) => px(ctx,Math.round(bp2.x-2+ci*2),Math.round(bp2.y-8-ri*5),1,4,bc));
    });
  }});
  items.push({ depth:0+5-0.5, fn:()=>{
    isoBox(ctx,0,5,0.8,0.5,18,"#4a3010","#2a1808","#3a2210","#1a0808");
    const bp2=ts(0.8,5.25);
    [["#aa2200","#224499","#2a8844"],["#ff4400","#22aacc","#aa3399"]].forEach((row,ri) => {
      row.forEach((bc,ci) => px(ctx,Math.round(bp2.x-2+ci*2),Math.round(bp2.y-8-ri*5),1,4,bc));
    });
  }});

  // Filing cabinet
  items.push({ depth:0+7.5-0.3, fn:()=>{
    isoBox(ctx,0,7.5,0.8,0.6,12,"#4a4a5a","#2a2a3a","#383848","#1a1a28");
    const fp2=ts(0.8,8.1);
    hln(ctx,Math.round(fp2.x-6),Math.round(fp2.y-5),5,"#555566");
    hln(ctx,Math.round(fp2.x-6),Math.round(fp2.y-9),5,"#555566");
    dot(ctx,Math.round(fp2.x-4),Math.round(fp2.y-4),"#aaaaaa");
    dot(ctx,Math.round(fp2.x-4),Math.round(fp2.y-8),"#aaaaaa");
  }});

  // Plants
  const plantSpots = [{c:0.3,r:0.3},{c:8.7,r:0.3},{c:0.3,r:8.7},{c:8.7,r:8.7},{c:5.5,r:4},{c:2.5,r:6}];
  plantSpots.forEach(({c,r},pi) => {
    items.push({ depth:c+r-0.2, fn:()=>{
      const sp=ts(c,r);
      const sway=Math.sin(t*0.9+pi)*0.6;
      // Terracotta pot
      ctx.fillStyle="#c8603a"; ctx.beginPath(); ctx.ellipse(sp.x*S,(sp.y)*S,4*S,2*S,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#a04828"; ctx.fillRect((sp.x-3)*S,(sp.y-3)*S,6*S,3*S);
      ctx.fillStyle="#c8603a"; ctx.fillRect((sp.x-2)*S,(sp.y-5)*S,4*S,3*S);
      hln(ctx,Math.round(sp.x-3),Math.round(sp.y-3),6,"#d8784a");
      // Stem
      ctx.fillStyle="#2a6a18"; ctx.fillRect(sp.x*S-0.5,(sp.y-12)*S,S,8*S);
      // Leaves
      ctx.fillStyle="#2d8a20";
      ctx.beginPath(); ctx.ellipse((sp.x+sway)*S,(sp.y-16)*S,6*S,8*S,sway*0.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#3aaa28";
      ctx.beginPath(); ctx.ellipse((sp.x+4+sway)*S,(sp.y-14)*S,4*S,6*S,0.4+sway*0.1,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1a6010";
      ctx.beginPath(); ctx.ellipse((sp.x-4-sway)*S,(sp.y-13)*S,3*S,5*S,-0.4,0,Math.PI*2); ctx.fill();
      // Highlight
      ctx.fillStyle="rgba(255,255,200,0.15)";
      ctx.beginPath(); ctx.ellipse((sp.x-1+sway)*S,(sp.y-18)*S,2*S,3*S,-0.5,0,Math.PI*2); ctx.fill();
    }});
  });

  // Desks + monitors + chairs + characters
  AGENTS.forEach((agent, i) => {
    const {col, row} = DESK_POS[i];
    const working = workingRef.current[agent.id]??true;
    const isHov = hovered===agent.id;
    const isNotify = notifyIds.has(agent.id);
    const depth = col + row;

    // Chair
    items.push({ depth:depth-0.1, fn:()=>{
      const hex=agent.color.replace('#','');
      const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
      isoBox(ctx,col+0.1,row+0.5,0.8,0.4,4,`rgba(${rr},${gg},${bb},0.3)`,`rgba(${rr},${gg},${bb},0.2)`,`rgba(${rr},${gg},${bb},0.25)`);
      // Chair back
      isoBox(ctx,col+0.15,row+0.5,0.7,0.08,9,`rgba(${rr},${gg},${bb},0.35)`,`rgba(${rr},${gg},${bb},0.25)`,`rgba(${rr},${gg},${bb},0.3)`);
    }});

    // Desk
    items.push({ depth, fn:()=>{
      isoBox(ctx,col,row,1,1,8,"#8a6030","#4a2808","#6a4018","#2a1408");
      // Drawer detail on front face
      const dl=ts(col,row+1), dr=ts(col+1,row+1);
      hln(ctx,Math.round((dl.x+dr.x)/2-4),Math.round((dl.y+dr.y)/2-3),8,"#3a1a08");
      dot(ctx,Math.round((dl.x+dr.x)/2),Math.round((dl.y+dr.y)/2-3),"#aa8844"); // handle
      // Desk surface items
      const ds=ts(col+0.85,row+0.15);
      // Coffee mug
      px(ctx,Math.round(ds.x-1),Math.round(ds.y-8-1),3,3,"#8a8aaa");
      px(ctx,Math.round(ds.x-1),Math.round(ds.y-8-1),3,1,"#44aaff");
      hln(ctx,Math.round(ds.x-1),Math.round(ds.y-8),3,"#aaaaaabb");
      // Sticky note
      const sn=ts(col+0.2,row+0.2);
      px(ctx,Math.round(sn.x-1),Math.round(sn.y-8-1),4,3,i%2===0?"#ffff88":"#88ffaa");
    }});

    // Desk lamp
    items.push({ depth:depth+0.05, fn:()=>{
      const lp=ts(col+0.7,row+0.1);
      const lx=Math.round(lp.x), ly=Math.round(lp.y-8);
      // Pole
      ctx.fillStyle="#666"; ctx.fillRect(lx*S,ly*S,S,(8)*S);
      // Shade
      px(ctx,lx-2,ly-3,5,2,"#888822");
      hln(ctx,lx-2,ly-3,5,"#aaaa44");
      // Glow
      const lampPulse = 0.06+Math.sin(t*0.3+i)*0.02;
      ctx.fillStyle=`rgba(255,240,180,${lampPulse})`;
      ctx.beginPath(); ctx.ellipse(lx*S,(ly+3)*S,8*S,5*S,0,0,Math.PI*2); ctx.fill();
    }});

    // Monitor stand + screen
    items.push({ depth:depth+0.1, fn:()=>{
      isoBox(ctx,col+0.42,row+0.08,0.16,0.18,3,"#1a1a2a","#0e0e18","#141422");
      // Screen bezel
      isoBox(ctx,col+0.05,row+0.02,0.9,0.38,16,"#111122","#080810","#0e0e1c","#0a0a18");
      // Screen face (VS Code)
      const scPos = ts(col+0.05, row+0.38);
      const sx=Math.round(scPos.x-1), sy2=Math.round(scPos.y-16);
      drawMonitorScreen(ctx, sx, sy2, agent, t, working);
      // Monitor glow on desk
      if (working) {
        const hex=agent.color.replace('#','');
        const rr=parseInt(hex.slice(0,2),16),gg=parseInt(hex.slice(2,4),16),bb=parseInt(hex.slice(4,6),16);
        ctx.fillStyle=`rgba(${rr},${gg},${bb},0.07)`;
        ctx.beginPath(); ctx.ellipse((col+0.5)*HW*S/HW+OX*S,(row+0.5)*HH*S/HH+OY*S,15*S,6*S,0,0,Math.PI*2);
      }
    }});

    // Character
    items.push({ depth:depth+0.35, fn:()=>{
      const charIso = ts(col+0.45, row+0.55);
      const cx = Math.round(charIso.x);
      const cy = Math.round(charIso.y - 8);
      drawChar(ctx, agent, cx, cy, t, working);

      // Name label — readable pill
      ctx.font = `bold ${S*2.2}px 'Courier New', monospace`;
      const nw = ctx.measureText(agent.name).width;
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.beginPath();
      ctx.roundRect((cx-4)*S, (cy-44)*S, nw+S*3, S*4, S);
      ctx.fill();
      ctx.fillStyle = isHov ? "#ffffff" : agent.color;
      ctx.fillText(agent.name, (cx-3)*S, (cy-41)*S);

      // Status dot
      const dotC = isNotify ? (Math.sin(t*10)>0?"#ff4444":"#ff0000") : (working?"#44ff88":"#555566");
      ctx.fillStyle=dotC;
      ctx.beginPath(); ctx.arc((cx+7)*S,(cy-43)*S,2*S,0,Math.PI*2); ctx.fill();

      // Speech bubble (current log, rotating)
      if (isHov && working) {
        const agent2 = agents[i];
        const logLine = agent2.logs[logIdxRef.current[agent2.id]??0];
        const short = logLine.replace(/\[\d+:\d+\]\s*/,"").slice(0,22);
        ctx.font = `bold ${S*1.5}px 'Courier New', monospace`;
        const bw = ctx.measureText(short).width + S*4;
        const bh = S*5;
        const bx2=(cx-4)*S, by2=(cy-58)*S;
        ctx.fillStyle="#f0f0ff";
        ctx.beginPath(); ctx.roundRect(bx2,by2,bw,bh,S*1.5); ctx.fill();
        ctx.strokeStyle=agent.color; ctx.lineWidth=1; ctx.stroke();
        // Tail
        ctx.fillStyle="#f0f0ff"; ctx.beginPath();
        ctx.moveTo((cx-1)*S,by2+bh); ctx.lineTo((cx+1)*S,by2+bh); ctx.lineTo(cx*S,by2+bh+S*3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle="#111";
        ctx.fillText(short, bx2+S*2, by2+bh-S*1.5);
      }
    }});

    // Hover ring
    if (isHov) {
      items.push({ depth:depth+0.5, fn:()=>{
        const hp=ts(col+0.5,row+0.7);
        ctx.strokeStyle=agent.color; ctx.lineWidth=S;
        ctx.setLineDash([S*2,S]);
        ctx.beginPath(); ctx.ellipse(hp.x*S,(hp.y)*S,14*S,7*S,0,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
      }});
    }
  });

  // Sort by depth
  items.sort((a,b)=>a.depth-b.depth);
  items.forEach(it=>it.fn());

  // ── HUD ──────────────────────────────────────────────────────────────
  const hh=12;
  const hg=ctx.createLinearGradient(0,(CH-hh)*S,0,CH*S);
  hg.addColorStop(0,"#08031a"); hg.addColorStop(1,"#050118");
  ctx.fillStyle=hg; ctx.fillRect(0,(CH-hh)*S,CW*S,hh*S);
  ctx.fillStyle="#3a1a6a"; ctx.fillRect(0,(CH-hh)*S,CW*S,S);
  ctx.fillStyle="#f0c000"; ctx.shadowColor="#f0c000"; ctx.shadowBlur=S;
  ctx.font=`bold ${S*2.2}px 'Courier New',monospace`;
  ctx.fillText("⚓  ELI  HQ  —  GOING  MERRY", 4*S, (CH-3)*S);
  ctx.shadowBlur=0;
  const active=Object.values(workingRef.current).filter(Boolean).length;
  ctx.fillStyle=active>=7?"#44ff88":active>=5?"#ffaa44":"#ff4444";
  ctx.fillText(`${active}/9`, (CW-22)*S, (CH-3)*S);
}

// ── Main Component ────────────────────────────────────────────────────────
export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const [hovered,  setHovered]  = useState<string|null>(null);
  const [selected, setSelected] = useState<Agent|null>(null);
  const [notifyIds, setNotifyIds] = useState<Set<string>>(new Set());

  const workingRef = useRef<Record<string,boolean>>({
    eli:true,scout:true,pen:false,closer:true,buzz:false,
    ledger:true,franky:true,chopper:true,jinbe:true,
  });
  const logIdxRef = useRef<Record<string,number>>(
    Object.fromEntries(AGENTS.map((a,i)=>[a.id,i%a.logs.length]))
  );
  const [uiWorking, setUiWorking] = useState({...workingRef.current});
  const [uiLogIdx,  setUiLogIdx]  = useState({...logIdxRef.current});
  const [wiroData,  setWiroData]  = useState<{pending?:number;visitors?:number}>({});

  useEffect(() => {
    const KEY="a19cd93295b6f5d1d010c3364111d301fa5303b1fb7e8dce9322ddc2983854ae";
    const BASE="https://wiro4x4indochina.com/api/agent";
    async function fetchData() {
      try {
        const [bk,an]=await Promise.allSettled([
          fetch(`${BASE}/bookings/pending`,{headers:{"X-Agent-Key":KEY}}),
          fetch(`${BASE}/analytics/summary`,{headers:{"X-Agent-Key":KEY}}),
        ]);
        const out:{pending?:number;visitors?:number}={};
        if(bk.status==="fulfilled"&&bk.value.ok){const j=await bk.value.json();out.pending=Array.isArray(j?.data)?j.data.length:(j?.count??0);const ci=AGENTS.findIndex(a=>a.id==="closer");if(ci>=0)AGENTS[ci].logs[0]=`[LIVE] Pending: ${out.pending} ${(out.pending??0)>0?"🔔":"✅"}`;}
        if(an.status==="fulfilled"&&an.value.ok){const j=await an.value.json();out.visitors=j?.data?.overview?.totalVisitors;const si=AGENTS.findIndex(a=>a.id==="scout");if(si>=0&&out.visitors!=null)AGENTS[si].logs[0]=`[LIVE] Visitors: ${out.visitors.toLocaleString()}`;}
        setWiroData(out);
      } catch{/*silent*/}
    }
    fetchData(); const id=setInterval(fetchData,60000); return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const id=setInterval(()=>{setUiWorking({...workingRef.current});setUiLogIdx({...logIdxRef.current});},800);
    return()=>clearInterval(id);
  },[]);

  function toggleAgent(id:string){workingRef.current[id]=!workingRef.current[id];setUiWorking({...workingRef.current});}

  const draw = useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext("2d"); if(!ctx)return;
    ctx.imageSmoothingEnabled=false;
    tRef.current+=0.04; const t=tRef.current;
    if(Math.round(t*25)%100===0) AGENTS.forEach(a=>{logIdxRef.current[a.id]=(logIdxRef.current[a.id]+1)%a.logs.length;});
    ctx.clearRect(0,0,CW*S,CH*S);
    drawScene(ctx,t,AGENTS,workingRef,logIdxRef,hovered,notifyIds);
    animRef.current=requestAnimationFrame(draw);
  },[hovered,notifyIds]);

  useEffect(()=>{animRef.current=requestAnimationFrame(draw);return()=>cancelAnimationFrame(animRef.current);},[draw]);

  function getAgentAt(e: React.MouseEvent<HTMLCanvasElement>){
    const rect=e.currentTarget.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(CW*S/rect.width)/S;
    const my=(e.clientY-rect.top)*(CH*S/rect.height)/S;
    return AGENTS.find((_,i)=>{
      const{col,row}=DESK_POS[i];
      const cp=ts(col+0.45,row+0.55);
      const cx=cp.x, cy=cp.y-8;
      return Math.abs(mx-cx)<12&&my>cy-46&&my<cy+2;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-[#3a1a6a]/60 bg-[#050118] shadow-2xl shadow-purple-950/60">
        <div className="flex items-center justify-between px-4 py-2 bg-[#080320] border-b border-[#2a1050]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57]"/>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"/>
            <span className="w-3 h-3 rounded-full bg-[#28c840]"/>
          </div>
          <span className="text-[11px] font-bold text-[#f0c000] tracking-widest" style={{textShadow:"0 0 8px #f0c000"}}>⚓ ELI HQ — 9 CREW ON GOING MERRY</span>
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
          onClick={e=>{const ag=getAgentAt(e);if(ag)setSelected(ag);}}
        />
        <div className="px-4 py-1.5 bg-[#080320] border-t border-[#2a1050]">
          <span className="text-[10px] text-[#4a2a6a] font-mono">Hover = speech bubble · Click = task panel · Monitor = live agent log</span>
        </div>
      </div>

      {/* Agent Log Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-base">📋</span>
          <h3 className="text-sm font-bold text-foreground">Agent Logs</h3>
          {wiroData.pending!=null&&<span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-mono">● Live API</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AGENTS.map(agent=>{
            const isWorking=uiWorking[agent.id];
            const isHov=hovered===agent.id;
            const isNotify=notifyIds.has(agent.id);
            return (
              <button key={agent.id} onClick={()=>setSelected(agent)}
                onMouseEnter={()=>setHovered(agent.id)} onMouseLeave={()=>setHovered(null)}
                className="flex flex-col gap-2 px-4 py-3 rounded-xl border text-left transition-all duration-200"
                style={{background:isNotify?`${agent.color}20`:isHov?`${agent.color}12`:`${agent.color}07`,borderColor:isNotify?"#ff4444":isHov?`${agent.color}66`:`${agent.color}20`,boxShadow:isHov?`0 0 16px ${agent.color}18`:"none"}}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{agent.opEmoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{color:agent.color}}>{agent.name}</span>
                      <span className="text-[10px] text-muted-foreground">{agent.role}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isWorking?"bg-green-500/15 text-green-400":"bg-gray-500/15 text-gray-500"}`}>
                    {isWorking?"● ON":"○ IDLE"}
                  </span>
                </div>
                <div className="rounded-lg px-3 py-2 font-mono" style={{background:"#0a0a14",border:`1px solid ${agent.color}22`}}>
                  <div className="text-[9px] mb-1" style={{color:`${agent.color}44`}}>{agent.name.toUpperCase()} LOG</div>
                  {agent.logs.slice(-3).map((line,li,arr)=>(
                    <div key={li} className="text-xs leading-relaxed" style={{color:li===arr.length-1?agent.color:`${agent.color}44`}}>
                      {li===arr.length-1?"▶ ":"  "}{line}
                    </div>
                  ))}
                  {!isWorking&&<div className="text-xs text-gray-500 mt-1">💤 Offline</div>}
                </div>
                <div className="text-[9px] text-muted-foreground/30 font-mono">Click for task panel →</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {selected&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={()=>setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden" style={{background:"#0d0d1a",borderColor:`${selected.color}44`}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{borderColor:`${selected.color}22`,background:`${selected.color}0e`}}>
              <span className="text-4xl">{selected.opEmoji}</span>
              <div>
                <div className="text-lg font-bold" style={{color:selected.color}}>{selected.name}</div>
                <div className="text-sm text-muted-foreground">{selected.role}</div>
              </div>
              <button onClick={()=>setSelected(null)} className="ml-auto text-muted-foreground hover:text-foreground text-xl px-2">✕</button>
            </div>
            <div className="px-5 py-3">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 font-mono tracking-widest">ACTIVITY LOG</div>
              <div className="rounded-lg p-3 space-y-1.5 font-mono text-xs" style={{background:"#060610",border:`1px solid ${selected.color}20`}}>
                {selected.logs.map((line,i)=>(
                  <div key={i} className="flex gap-2"><span style={{color:selected.color}}>›</span><span className={i===selected.logs.length-1?"text-white":"text-gray-400"}>{line}</span></div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="text-[10px] font-bold text-muted-foreground mb-2 font-mono tracking-widest">QUICK TASKS</div>
              <div className="grid grid-cols-2 gap-2">
                {selected.taskPresets.map((task,i)=>(
                  <button key={i} className="text-xs px-3 py-2 rounded-lg border text-left font-medium transition-all hover:scale-[1.02]"
                    style={{borderColor:`${selected.color}44`,background:`${selected.color}10`,color:selected.color}}
                    onClick={()=>alert(`🚀 ${selected.name}: "${task}"\n\nAgent execution coming soon!`)}>
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
