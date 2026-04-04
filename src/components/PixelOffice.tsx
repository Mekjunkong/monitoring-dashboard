"use client";

import { useEffect, useRef, useState } from "react";

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  // Floor / walls
  floor: "#2a2a3e",
  floorTile: "#252538",
  wall: "#1a1a2e",
  wallAccent: "#16213e",
  // Furniture
  desk: "#4a3728",
  deskTop: "#5c4636",
  monitor: "#1a1a2e",
  monitorScreen: "#00d4ff",
  monitorGlow: "#003344",
  chair: "#2d2d44",
  plant: "#2d5a27",
  plantPot: "#8b4513",
  window: "#1a3a5c",
  windowLight: "#87ceeb",
  // Agents
  eli: "#6c63ff",      // purple — orchestrator
  scout: "#00b4d8",    // cyan — analytics
  pen: "#f72585",      // pink — content
  closer: "#2ec4b6",   // teal — bookings
  buzz: "#ff9f1c",     // orange — social
  ledger: "#4caf50",   // green — finance
  skin: "#ffdbac",
  hair: "#3d2b1f",
  // UI
  text: "#e0e0ff",
  accent: "#6c63ff",
  glow: "#00d4ff",
};

// ── Pixel renderer helpers ─────────────────────────────────────────────────
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ── Agent definitions ──────────────────────────────────────────────────────
const AGENTS = [
  { id: "eli",    name: "Eli",    role: "Orchestrator", color: C.eli,    deskX: 20,  deskY: 60 },
  { id: "scout",  name: "Scout",  role: "Analytics",    color: C.scout,  deskX: 100, deskY: 60 },
  { id: "pen",    name: "Pen",    role: "Content",      color: C.pen,    deskX: 180, deskY: 60 },
  { id: "closer", name: "Closer", role: "Bookings",     color: C.closer, deskX: 260, deskY: 60 },
  { id: "buzz",   name: "Buzz",   role: "Social",       color: C.buzz,   deskX: 20,  deskY: 160 },
  { id: "ledger", name: "Ledger", role: "Finance",      color: C.ledger, deskX: 100, deskY: 160 },
];

// ── Draw functions ─────────────────────────────────────────────────────────
function drawFloor(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Wall
  px(ctx, 0, 0, w, h * 0.35, C.wall);
  // Baseboard
  px(ctx, 0, h * 0.35, w, 3, C.wallAccent);
  // Floor tiles
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 14; col++) {
      const tx = col * (w / 14);
      const ty = h * 0.35 + row * ((h * 0.65) / 8);
      const shade = (row + col) % 2 === 0 ? C.floor : C.floorTile;
      ctx.fillStyle = shade;
      ctx.fillRect(Math.round(tx), Math.round(ty), Math.round(w / 14) - 1, Math.round((h * 0.65) / 8) - 1);
    }
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Frame
  px(ctx, x, y, 50, 40, C.wallAccent);
  // Glass
  px(ctx, x + 3, y + 3, 44, 34, C.window);
  // Sky gradient effect
  const pulse = Math.sin(t * 0.5) * 10;
  ctx.fillStyle = `rgba(135,206,235,${0.3 + pulse * 0.01})`;
  ctx.fillRect(x + 3, y + 3, 44, 16);
  // Dividers
  px(ctx, x + 25, y + 3, 2, 34, C.wallAccent);
  px(ctx, x + 3, y + 21, 44, 2, C.wallAccent);
  // Light ray
  ctx.fillStyle = `rgba(255,255,200,${0.08 + Math.sin(t * 0.3) * 0.03})`;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + 47, y + 3);
  ctx.lineTo(x + 80, y + 80);
  ctx.lineTo(x - 30, y + 80);
  ctx.closePath();
  ctx.fill();
}

function drawDesk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Legs
  px(ctx, x + 2,  y + 20, 4, 12, C.desk);
  px(ctx, x + 54, y + 20, 4, 12, C.desk);
  // Surface
  px(ctx, x, y + 16, 60, 6, C.deskTop);
  // Desk body
  px(ctx, x + 2, y + 18, 56, 4, C.desk);
}

function drawMonitor(ctx: CanvasRenderingContext2D, x: number, y: number, agentColor: string, t: number) {
  // Stand
  px(ctx, x + 22, y + 10, 4, 6, C.chair);
  px(ctx, x + 18, y + 14, 12, 2, C.chair);
  // Frame
  px(ctx, x + 8,  y - 2,  32, 14, C.monitor);
  // Screen
  px(ctx, x + 10, y,      28, 10, C.monitorGlow);
  // Screen content — scrolling lines
  const scroll = Math.floor(t * 2) % 10;
  ctx.fillStyle = agentColor;
  for (let i = 0; i < 3; i++) {
    const lineY = y + 1 + ((i * 3 + scroll) % 9);
    if (lineY < y + 9) {
      ctx.fillRect(x + 12, lineY, 10 + (i * 4), 1);
    }
  }
  // Screen glow
  ctx.fillStyle = `rgba(0,212,255,${0.15 + Math.sin(t + x) * 0.05})`;
  ctx.fillRect(x + 10, y, 28, 10);
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  // Pot
  px(ctx, x + 4, y + 12, 12, 8, C.plantPot);
  px(ctx, x + 2, y + 10, 16, 4, "#a0522d");
  // Stem
  px(ctx, x + 9, y + 6, 2, 6, "#4a7c3f");
  // Leaves — sway
  const sway = Math.sin(t * 0.7) * 1.5;
  ctx.fillStyle = C.plant;
  ctx.fillRect(Math.round(x + 2 + sway), y + 2, 8, 6);
  ctx.fillRect(Math.round(x + 10 - sway), y, 8, 7);
  ctx.fillRect(Math.round(x + 5), y + 4, 10, 4);
}

function drawChair(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Seat
  px(ctx, x + 8, y + 28, 24, 4, C.chair);
  // Back
  px(ctx, x + 8, y + 16, 24, 14, C.chair);
  // Legs
  px(ctx, x + 8,  y + 30, 3, 6, "#1a1a2e");
  px(ctx, x + 29, y + 30, 3, 6, "#1a1a2e");
  px(ctx, x + 16, y + 30, 3, 6, "#1a1a2e");
}

function drawAgent(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number, working: boolean) {
  // bobbing animation when working
  const bob = working ? Math.sin(t * 3) * 1.5 : 0;
  const ay = y + bob;

  // Body
  px(ctx, x + 10, ay + 8, 12, 14, color);
  // Head
  px(ctx, x + 11, ay + 1, 10, 9, C.skin);
  // Hair
  px(ctx, x + 11, ay + 1, 10, 3, C.hair);
  // Eyes
  px(ctx, x + 13, ay + 5, 2, 2, "#1a1a2e");
  px(ctx, x + 18, ay + 5, 2, 2, "#1a1a2e");
  // Mouth — smile when working
  if (working) {
    px(ctx, x + 14, ay + 8, 4, 1, "#8b4513");
    px(ctx, x + 13, ay + 7, 1, 1, "#8b4513");
    px(ctx, x + 18, ay + 7, 1, 1, "#8b4513");
  }
  // Arms typing
  if (working) {
    const armSwing = Math.sin(t * 4) * 2;
    px(ctx, x + 7,  Math.round(ay + 12 + armSwing), 4, 3, C.skin);
    px(ctx, x + 21, Math.round(ay + 12 - armSwing), 4, 3, C.skin);
  } else {
    px(ctx, x + 7,  ay + 12, 4, 3, C.skin);
    px(ctx, x + 21, ay + 12, 4, 3, C.skin);
  }
  // Legs
  px(ctx, x + 12, ay + 20, 4, 6, "#2d2d44");
  px(ctx, x + 17, ay + 20, 4, 6, "#2d2d44");
}

function drawWorkstation(ctx: CanvasRenderingContext2D, agent: typeof AGENTS[0], t: number, working: boolean) {
  const { deskX: x, deskY: y, color } = agent;
  drawChair(ctx, x, y);
  drawDesk(ctx, x, y + 16);
  drawMonitor(ctx, x + 6, y + 4, color, t);
  drawAgent(ctx, x + 10, y - 12, color, t, working);
  // Name tag
  ctx.fillStyle = `rgba(0,0,0,0.5)`;
  ctx.fillRect(x + 4, y - 16, 50, 10);
  ctx.fillStyle = color;
  ctx.font = "bold 7px monospace";
  ctx.fillText(agent.name, x + 7, y - 8);
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PixelOffice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  // Which agents are "working" (cycling)
  const workingRef = useRef<Record<string, boolean>>({
    eli: true, scout: true, pen: false, closer: true, buzz: false, ledger: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      tRef.current += 0.035;
      const t = tRef.current;

      // cycle working states randomly
      if (Math.floor(t * 10) % 80 === 0) {
        const id = AGENTS[Math.floor(Math.random() * AGENTS.length)].id;
        workingRef.current[id] = !workingRef.current[id];
      }

      // Background
      ctx.clearRect(0, 0, W, H);
      drawFloor(ctx, W, H);

      // Windows on wall
      drawWindow(ctx, 60,  10, t);
      drawWindow(ctx, 200, 10, t);
      drawWindow(ctx, 330, 10, t);

      // Corner plant
      drawPlant(ctx, W - 30, 100, t);
      drawPlant(ctx, 2, 100, t);

      // All workstations
      AGENTS.forEach(agent => {
        drawWorkstation(ctx, agent, t, workingRef.current[agent.id] ?? true);
      });

      // Highlight hovered agent
      if (activeAgent) {
        const agent = AGENTS.find(a => a.id === activeAgent);
        if (agent) {
          ctx.strokeStyle = agent.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(agent.deskX - 2, agent.deskY - 18, 64, 58);
          // Tooltip
          ctx.fillStyle = "rgba(0,0,0,0.85)";
          ctx.fillRect(agent.deskX, agent.deskY - 34, 62, 14);
          ctx.fillStyle = agent.color;
          ctx.font = "bold 7px monospace";
          ctx.fillText(`${agent.name} · ${agent.role}`, agent.deskX + 3, agent.deskY - 23);
        }
      }

      // Status bar bottom
      ctx.fillStyle = "rgba(10,10,20,0.7)";
      ctx.fillRect(0, H - 18, W, 18);
      ctx.fillStyle = C.glow;
      ctx.font = "7px monospace";
      ctx.fillText("WIRO 4x4 — Eli HQ", 8, H - 6);
      const working = Object.values(workingRef.current).filter(Boolean).length;
      ctx.fillStyle = C.accent;
      ctx.fillText(`${working}/${AGENTS.length} agents active`, W - 110, H - 6);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [activeAgent]);

  // Mouse hover → highlight agent
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hit = AGENTS.find(a =>
      mx >= a.deskX - 2 && mx <= a.deskX + 62 &&
      my >= a.deskY - 18 && my <= a.deskY + 40
    );
    setActiveAgent(hit?.id ?? null);
  }

  // Click → toggle working
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hit = AGENTS.find(a =>
      mx >= a.deskX - 2 && mx <= a.deskX + 62 &&
      my >= a.deskY - 18 && my <= a.deskY + 40
    );
    if (hit) {
      workingRef.current[hit.id] = !workingRef.current[hit.id];
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">🏢 Eli HQ — Pixel Office</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Hover over a desk to inspect · Click to toggle working state</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {AGENTS.map(a => (
              <span key={a.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: a.color }} />
                {a.name}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 flex justify-center bg-[#0a0a14]">
          <canvas
            ref={canvasRef}
            width={380}
            height={260}
            className="w-full max-w-[760px] rounded-lg cursor-crosshair"
            style={{ imageRendering: "pixelated" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActiveAgent(null)}
            onClick={handleClick}
          />
        </div>
      </div>

      {/* Agent legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AGENTS.map(agent => (
          <div
            key={agent.id}
            className="bg-card border border-border rounded-lg px-3 py-2 flex items-center gap-3"
            style={{ borderLeftColor: agent.color, borderLeftWidth: 3 }}
          >
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: agent.color }} />
            <div>
              <div className="text-xs font-bold text-foreground">{agent.name}</div>
              <div className="text-[10px] text-muted-foreground">{agent.role}</div>
            </div>
            <div className="ml-auto">
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${agent.color}22`,
                  color: agent.color,
                }}
              >
                {workingRef?.current?.[agent.id] ? "active" : "idle"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
