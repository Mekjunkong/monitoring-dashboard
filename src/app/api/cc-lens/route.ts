import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");

function safeRead(filePath: string) {
  try { return fs.readFileSync(filePath, "utf-8"); } catch { return null; }
}
function safeReadJson(filePath: string) {
  const raw = safeRead(filePath);
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function safeReadDir(dir: string): string[] {
  try { return fs.readdirSync(dir); } catch { return []; }
}

export async function GET() {
  // ── Stats cache ────────────────────────────────────────────────────────
  const statsCache = safeReadJson(path.join(CLAUDE_DIR, "stats-cache.json"));

  // ── History (last 20 commands) ─────────────────────────────────────────
  const historyRaw = safeRead(path.join(CLAUDE_DIR, "history.jsonl")) ?? "";
  const historyLines = historyRaw.trim().split("\n").filter(Boolean);
  const history = historyLines.slice(-20).reverse().map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);

  // ── Projects list ──────────────────────────────────────────────────────
  const projectsDir = path.join(CLAUDE_DIR, "projects");
  const projectDirs = safeReadDir(projectsDir);
  const projects = projectDirs.map(proj => {
    const projPath = path.join(projectsDir, proj);
    const files = safeReadDir(projPath).filter(f => f.endsWith(".jsonl"));
    // count sessions and rough token estimate from file sizes
    let totalSize = 0;
    let sessionCount = files.length;
    files.forEach(f => {
      try { totalSize += fs.statSync(path.join(projPath, f)).size; } catch {}
    });
    return {
      name: proj.replace(/^-/, "").replace(/-/g, "/").replace(/^Users\/[^/]+\//, "~/"),
      sessions: sessionCount,
      sizeKb: Math.round(totalSize / 1024),
    };
  }).sort((a, b) => b.sizeKb - a.sizeKb).slice(0, 10);

  // ── Todos ─────────────────────────────────────────────────────────────
  const todosDir = path.join(CLAUDE_DIR, "todos");
  const todoFiles = safeReadDir(todosDir).filter(f => f.endsWith(".json"));
  const todos: { project: string; pending: number; done: number }[] = [];
  todoFiles.slice(0, 5).forEach(f => {
    const data = safeReadJson(path.join(todosDir, f));
    if (Array.isArray(data)) {
      todos.push({
        project: f.replace(".json", "").slice(-30),
        pending: data.filter((t: {status:string}) => t.status === "pending" || t.status === "in_progress").length,
        done: data.filter((t: {status:string}) => t.status === "completed").length,
      });
    }
  });

  // ── Daily activity (last 14 days) ──────────────────────────────────────
  const dailyActivity = (statsCache?.dailyActivity ?? []).slice(-14);

  // ── Session count per project ──────────────────────────────────────────
  const totalSessions = projects.reduce((s, p) => s + p.sessions, 0);
  const totalHistoryLines = historyLines.length;

  return NextResponse.json({
    projects,
    dailyActivity,
    history,
    todos,
    totalSessions,
    totalHistoryLines,
    lastComputedDate: statsCache?.lastComputedDate,
  });
}
