"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Pixel size (each "pixel" = N real pixels) ────────────────────────────
const P = 3;

// ─── Canvas logical size ───────────────────────────────────────────────────
const W = 200;
const H = 140;

// ─── Palette ──────────────────────────────────────────────────────────────
const PAL = {
  bg:        "#0d0d1a",
  wall:      "#12122a",
  wallLine:  "#1a1a3a",
  floor:     "#1e1e3a",
  floorAlt:  "#1a1a32",
  skirting:  "#2a2a5a",
  desk:      "#5c3d2e",
  deskFace:  "#3d2820",
  deskTop:   "#7a5040",
  monitor:   "#111122",
  monBorder: "#2a2a4a",
  monGlow:   "#001833",
  chair:     "#1a3a4a",
  chairSeat: "#22475a",
  plant1:    "#1a4a20",
  plant2:    "#2d7a30",
  pot:       "#8b4513",
  potRim:    "#a05515",
  winFrame:  "#2a2a5a",
  winSky:    "#0a2a4a",
  winCloud:  "#1a3a6a",
  winGlow:   "#0066aa",
  lamp:      "#aaaa22",
  lampGlow:  "#ffff44",
  carpet:    "#2a1a3a",
  white:     "#e8e8ff",
  dimWhite:  "#9090b0",
  black:     "#000010",
};

// ─── Agent defs ────────────────────────────────────────────────────────────
const AGENTS = [
  { id: "eli",    name: "Eli",    role: "Orchestrator", body: "#6c63ff", hair: "#3d2b1f", shirt: "#4a40cc" },
  { id: "scout",  name: "Scout",  role: "Analytics",    body: "#00b4d8", hair: "#1a3a10", shirt: "#008aaa" },
  { id: "pen",    name: "Pen",    role: "Content",      body: "#f72585", hair: "#2a1a3a", shirt: "#c01060" },
  { id: "closer", name: "Closer", role: "Bookings",     body: "#2ec4b6", hair: "#2a1f10", shirt: "#229090" },
  { id: "buzz",   name: "Buzz",   role: "Social",       body: "#ff9f1c", hair: "#1a0a0a", shirt: "#cc7a00" },
  { id: "ledger", name: "Ledger", role: "Finance",      body: "#4caf50", hair: "#0a200a", shirt: "#388e3c" },
];

// Desk layout — 3 top, 3 bottom row (logical px)
const DESKS = [
  { x: 6,   y: 30  },
  { x: 74,  y: 30  },
  { x: 142, y: 30  },
  { x: 6,   y: 88  },
  { x: 74,  y: 88  },
  { x: 142, y: 88  },
];

// ─── Low-level draw ────────────────────────────────────────────────────────
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x * P, y * P, P, P);
}
function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x * P, y * P, w * P, h * P);
}
function hline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, c: string) {
  rect(ctx, x, y, w, 1, c);
}
function vline(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, c: string) {
  rect(ctx, x, y, 1, h, c);
}

// ─── Scene elements ────────────────────────────────────────────────────────
function drawBackground(ctx: CanvasRenderingContext2D) {
  // Wall
  rect(ctx, 0, 0, W, 60, PAL.wall);
  // Wall stripes
  for (let y = 5; y < 60; y += 8) hline(ctx, 0, y, W, PAL.wallLine);
  // Skirting board
  rect(ctx, 0, 57, W, 2, PAL.skirting);
  // Floor
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < W; col++) {
      const shade = (row + col) % 2 === 0 ? PAL.floor : PAL.floorAlt;
      dot(ctx, col, 59 + row * 8, shade);
      rect(ctx, col * 1, 59 + row * 8, 1, 8, shade);
    }
  }
  // Carpet strip (center)
  rect(ctx, 55, 62, 90, 70, PAL.carpet);
  // Carpet border
  hline(ctx, 55, 62, 90, "#3a2a4a");
  hline(ctx, 55, 131, 90, "#3a2a4a");
  vline(ctx, 55, 62, 70, "#3a2a4a");
  vline(ctx, 144, 62, 70, "#3a2a4a");
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, t: number) {
  const y = 6;
  // Frame
  rect(ctx, x, y, 24, 20, PAL.winFrame);
  // Glass panes
  rect(ctx, x+1, y+1, 10, 8, PAL.winSky);
  rect(ctx, x+13, y+1, 10, 8, PAL.winSky);
  rect(ctx, x+1, y+11, 10, 8, PAL.winSky);
  rect(ctx, x+13, y+11, 10, 8, PAL.winSky);
  // Cloud (animated scroll)
  const cx = ((Math.floor(t * 8) + x * 3) % 12);
  rect(ctx, x+1+cx, y+2, 3, 1, PAL.winCloud);
  rect(ctx, x+cx, y+3, 5, 1, PAL.winCloud);
  rect(ctx, x+1+cx, y+4, 3, 1, PAL.winCloud);
  // Window glow on floor
  ctx.fillStyle = `rgba(0,100,180,${0.06 + Math.sin(t*0.5)*0.02})`;
  ctx.fillRect((x+2)*P, 59*P, 20*P, 60*P);
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, t: number) {
  // Pole
  vline(ctx, x, 10, 45, "#3a3a5a");
  // Shade
  rect(ctx, x-3, 8, 7, 3, "#4a4a1a");
  // Bulb
  dot(ctx, x, 10, PAL.lampGlow);
  // Glow
  ctx.fillStyle = `rgba(255,255,100,${0.06 + Math.sin(t*0.7)*0.02})`;
  ctx.fillRect((x-8)*P, 10*P, 17*P, 50*P);
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Pot
  rect(ctx, x+1, y+6, 6, 5, PAL.pot);
  hline(ctx, x, y+6, 8, PAL.potRim);
  // Stem
  vline(ctx, x+3, y+1, 6, "#2d5a20");
  // Leaves sway
  const s = Math.sin(t * 0.6) > 0 ? 1 : 0;
  rect(ctx, x-1+s, y, 4, 3, PAL.plant2);
  rect(ctx, x+3-s, y-1, 4, 3, PAL.plant1);
  rect(ctx, x+1, y+2, 5, 2, PAL.plant2);
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Legs
  vline(ctx, x+1,  y+14, 8, PAL.deskFace);
  vline(ctx, x+22, y+14, 8, PAL.deskFace);
  // Desk body (side)
  rect(ctx, x, y+10, 24, 5, PAL.deskFace);
  // Desktop surface
  rect(ctx, x-1, y+8, 26, 3, PAL.deskTop);
  // Desktop shine
  hline(ctx, x, y+8, 24, "#a06858");
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Back
  rect(ctx, x+6, y+18, 12, 10, PAL.chair);
  hline(ctx, x+6, y+18, 12, PAL.chairSeat);
  // Seat
  rect(ctx, x+5, y+26, 14, 4, PAL.chairSeat);
  // Legs
  vline(ctx, x+6,  y+29, 5, "#0a1a22");
  vline(ctx, x+17, y+29, 5, "#0a1a22");
}

function drawMonitor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  agentColor: string,
  t: number,
  working: boolean
) {
  // Stand
  rect(ctx, x+8, y+6, 4, 4, "#2a2a3a");
  hline(ctx, x+5, y+9, 10, "#1a1a2a");
  // Bezel
  rect(ctx, x+1, y-4, 18, 12, PAL.monBorder);
  // Screen
  rect(ctx, x+2, y-3, 16, 10, PAL.monGlow);
  // Screen content
  if (working) {
    const scroll = Math.floor(t * 3) % 8;
    ctx.fillStyle = agentColor;
    // Animated "code" lines
    for (let i = 0; i < 3; i++) {
      const lineY = y - 2 + ((i * 3 + scroll) % 9);
      if (lineY >= y-3 && lineY < y+7) {
        const w2 = 4 + (i % 3) * 3;
        rect(ctx, x+3, lineY, w2, 1, agentColor);
        if (i % 2 === 0) rect(ctx, x+3+w2+1, lineY, 3, 1, "#334455");
      }
    }
    // Cursor blink
    if (Math.floor(t * 2) % 2 === 0) {
      dot(ctx, x+3, y+5, PAL.white);
    }
  } else {
    // Screensaver — slow pulse
    const alpha = 0.3 + Math.sin(t * 0.5) * 0.2;
    ctx.fillStyle = `rgba(${parseInt(agentColor.slice(1,3),16)},${parseInt(agentColor.slice(3,5),16)},${parseInt(agentColor.slice(5,7),16)},${alpha})`;
    ctx.fillRect((x+4)*P, (y)*P, 12*P, 5*P);
  }
  // Screen glow
  ctx.fillStyle = `rgba(${parseInt(agentColor.slice(1,3),16)},${parseInt(agentColor.slice(3,5),16)},${parseInt(agentColor.slice(5,7),16)},0.08)`;
  ctx.fillRect((x-2)*P, (y-6)*P, 24*P, 20*P);
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  agent: typeof AGENTS[0],
  t: number,
  working: boolean
) {
  const bob = working ? Math.round(Math.sin(t * 3.5) * 0.6) : 0;
  const ay = y + bob;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect((x+3)*P, (ay+18)*P, 10*P, 2*P);

  // Legs
  rect(ctx, x+3, ay+14, 3, 5, "#1a1a3a");
  rect(ctx, x+7, ay+14, 3, 5, "#1a1a3a");
  // Shoes
  rect(ctx, x+2, ay+18, 4, 2, "#111118");
  rect(ctx, x+6, ay+18, 4, 2, "#111118");

  // Body / shirt
  rect(ctx, x+2, ay+8, 9, 7, agent.shirt);
  // Collar
  hline(ctx, x+4, ay+8, 5, "#ffffff22");

  // Arms
  if (working) {
    const swing = Math.sin(t * 4) > 0 ? 1 : -1;
    rect(ctx, x,   ay+9+swing, 3, 4, "#ffdbac");
    rect(ctx, x+10,ay+9-swing, 3, 4, "#ffdbac");
  } else {
    rect(ctx, x,   ay+10, 3, 4, "#ffdbac");
    rect(ctx, x+10,ay+10, 3, 4, "#ffdbac");
  }

  // Neck
  rect(ctx, x+5, ay+6, 3, 3, "#ffdbac");
  // Head
  rect(ctx, x+3, ay, 7, 7, "#ffdbac");
  // Hair
  rect(ctx, x+3, ay, 7, 2, agent.hair);
  dot(ctx, x+3, ay+2, agent.hair);
  dot(ctx, x+9, ay+2, agent.hair);
  // Eyes
  dot(ctx, x+5, ay+3, PAL.black);
  dot(ctx, x+7, ay+3, PAL.black);
  // Mouth
  if (working) {
    dot(ctx, x+5, ay+5, "#8b4513");
    dot(ctx, x+7, ay+5, "#8b4513");
  } else {
    hline(ctx, x+5, ay+5, 2, "#8b4513");
  }
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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    tRef.current += 0.04;
    const t = tRef.current;

    // Background
    ctx.clearRect(0, 0, W * P, H * P);
    drawBackground(ctx);

    // Windows
    drawWindow(ctx, 10, t);
    drawWindow(ctx, 88, t);
    drawWindow(ctx, 166, t);

    // Floor lamps
    drawLamp(ctx, 50, t);
    drawLamp(ctx, 150, t);

    // Corner plants
    drawPlant(ctx, 0, 118, t);
    drawPlant(ctx, 191, 118, t);
    drawPlant(ctx, 0, 58, t);
    drawPlant(ctx, 191, 58, t);

    // Workstations
    AGENTS.forEach((agent, i) => {
      const d = DESKS[i];
      const working = workingRef.current[agent.id] ?? true;

      drawChair(ctx, d.x, d.y);
      drawDesk(ctx, d.x, d.y);
      drawMonitor(ctx, d.x + 3, d.y + 2, agent.body, t, working);
      drawAgent(ctx, d.x + 5, d.y - 20, agent, t, working);

      // Name tag above head
      const isHov = hovered === agent.id;
      if (isHov) {
        rect(ctx, d.x + 1, d.y - 26, 20, 6, "#000018");
        ctx.fillStyle = agent.body;
        ctx.font = `bold ${P * 2}px monospace`;
        ctx.fillText(agent.name, (d.x + 2) * P, (d.y - 21) * P);
      }

      // Status dot
      const dotColor = working ? "#44ff88" : "#888899";
      dot(ctx, d.x + 22, d.y - 20, dotColor);
    });

    // Highlight box for hovered agent
    if (hovered) {
      const idx = AGENTS.findIndex(a => a.id === hovered);
      if (idx >= 0) {
        const d = DESKS[idx];
        const ag = AGENTS[idx];
        ctx.strokeStyle = ag.body;
        ctx.lineWidth = P * 0.8;
        ctx.setLineDash([P * 2, P]);
        ctx.strokeRect((d.x - 2) * P, (d.y - 22) * P, 30 * P, 52 * P);
        ctx.setLineDash([]);
      }
    }

    // Bottom HUD
    rect(ctx, 0, H - 8, W, 8, "#08081a");
    hline(ctx, 0, H - 8, W, "#2a2a5a");
    ctx.fillStyle = "#6c63ff";
    ctx.font = `bold ${P * 1.5}px monospace`;
    ctx.fillText("WIRO 4x4  Eli HQ", 3 * P, (H - 2) * P);
    const active = Object.values(workingRef.current).filter(Boolean).length;
    ctx.fillStyle = active >= 4 ? "#44ff88" : "#ffaa44";
    ctx.fillText(`${active}/${AGENTS.length} online`, (W - 28) * P, (H - 2) * P);

    animRef.current = requestAnimationFrame(draw);
  }, [hovered]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  function getAgentAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect2 = e.currentTarget.getBoundingClientRect();
    const scaleX = (W * P) / rect2.width;
    const scaleY = (H * P) / rect2.height;
    const mx = (e.clientX - rect2.left) * scaleX / P;
    const my = (e.clientY - rect2.top)  * scaleY / P;
    return AGENTS.find((_, i) => {
      const d = DESKS[i];
      return mx >= d.x - 2 && mx <= d.x + 28 && my >= d.y - 22 && my <= d.y + 30;
    });
  }

  return (
    <div className="space-y-4">
      {/* Canvas card */}
      <div className="rounded-2xl overflow-hidden border border-[#2a2a5a] bg-[#08081a] shadow-2xl shadow-black/60">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a3a]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6c63ff] tracking-widest uppercase">🏢 Eli HQ</span>
            <span className="text-[10px] text-[#4a4a7a]">— Pixel Office v2</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={W * P}
          height={H * P}
          className="w-full cursor-crosshair block"
          style={{ imageRendering: "pixelated", maxHeight: "420px" }}
          onMouseMove={e => setHovered(getAgentAt(e)?.id ?? null)}
          onMouseLeave={() => setHovered(null)}
          onClick={e => {
            const ag = getAgentAt(e);
            if (ag) workingRef.current[ag.id] = !workingRef.current[ag.id];
          }}
        />

        {/* Hint bar */}
        <div className="px-4 py-1.5 border-t border-[#1a1a3a] flex items-center gap-4">
          <span className="text-[10px] text-[#4a4a7a]">🖱 Hover = inspect</span>
          <span className="text-[10px] text-[#4a4a7a]">🖱 Click = toggle working</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-[#44ff88]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#44ff88] animate-pulse" />
            LIVE
          </span>
        </div>
      </div>

      {/* Agent legend grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {AGENTS.map(agent => {
          const working = workingRef.current[agent.id];
          return (
            <button
              key={agent.id}
              onClick={() => { workingRef.current[agent.id] = !workingRef.current[agent.id]; }}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer text-left"
              style={{
                background: `${agent.body}12`,
                borderColor: hovered === agent.id ? agent.body : `${agent.body}33`,
              }}
            >
              {/* Avatar dot */}
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-sm"
                style={{ background: `${agent.body}30` }}>
                <span style={{ color: agent.body }}>●</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-none mb-0.5" style={{ color: agent.body }}>
                  {agent.name}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
              </div>
              <div className="ml-auto shrink-0">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                  working
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-500"
                }`}>
                  {working ? "ON" : "IDLE"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
