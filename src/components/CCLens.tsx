"use client";
import { useEffect, useState } from "react";
import { Terminal, FolderOpen, Clock, CheckSquare, Activity, Zap } from "lucide-react";

interface DailyActivity { date: string; messageCount: number; sessionCount: number; toolCallCount: number; }
interface Project { name: string; sessions: number; sizeKb: number; }
interface HistoryEntry { command?: string; timestamp?: string; cwd?: string; }
interface TodoGroup { project: string; pending: number; done: number; }

interface CCData {
  projects: Project[];
  dailyActivity: DailyActivity[];
  history: HistoryEntry[];
  todos: TodoGroup[];
  totalSessions: number;
  totalHistoryLines: number;
  lastComputedDate: string;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

function ActivityHeatmap({ days }: { days: DailyActivity[] }) {
  const max = Math.max(...days.map(d => d.messageCount), 1);
  return (
    <div className="flex gap-1 flex-wrap">
      {days.map(day => {
        const intensity = day.messageCount / max;
        const bg = intensity > 0.7 ? "#6c63ff" : intensity > 0.4 ? "#4a44cc" : intensity > 0.1 ? "#2a2a7a" : "#1a1a3a";
        return (
          <div key={day.date} className="group relative">
            <div className="w-6 h-6 rounded-sm cursor-default transition-transform hover:scale-110" style={{ background: bg }} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 bg-popover border border-border text-[10px] text-foreground px-2 py-1 rounded whitespace-nowrap shadow-lg">
              {day.date}<br/>{day.messageCount} msgs · {day.sessionCount} sessions
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CCLens() {
  const [data, setData] = useState<CCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cc-lens");
        if (!res.ok) throw new Error("API error");
        setData(await res.json());
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /><span className="text-sm">Reading ~/.claude/...</span></div>
    </div>
  );
  if (error || !data) return (
    <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to read ~/.claude/ data</div>
  );

  const totalMsgs = data.dailyActivity.reduce((s, d) => s + d.messageCount, 0);
  const totalTools = data.dailyActivity.reduce((s, d) => s + d.toolCallCount, 0);
  const maxProject = data.projects[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#6c63ff]/15 flex items-center justify-center">
          <Terminal size={20} className="text-[#6c63ff]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">CC Lens — Claude Code Analytics</h2>
          <p className="text-xs text-muted-foreground">Reading from <code className="text-[#6c63ff]">~/.claude/</code> · Last updated {data.lastComputedDate ?? "today"}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />LOCAL DATA
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Messages", value: totalMsgs.toLocaleString(), icon: "💬", color: "#6c63ff" },
          { label: "Tool Calls", value: totalTools.toLocaleString(), icon: "🔧", color: "#f0c000" },
          { label: "Sessions", value: data.totalSessions.toLocaleString(), icon: "🗂️", color: "#2ecc71" },
          { label: "History Lines", value: data.totalHistoryLines.toLocaleString(), icon: "📜", color: "#3498db" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{stat.icon}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Activity heatmap */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-[#6c63ff]" />
          <h3 className="text-sm font-bold text-foreground">Activity (last 14 days)</h3>
        </div>
        <ActivityHeatmap days={data.dailyActivity} />
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["#1a1a3a","#2a2a7a","#4a44cc","#6c63ff"].map(c => (
            <span key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projects */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={14} className="text-[#f0c000]" />
            <h3 className="text-sm font-bold text-foreground">Projects by Activity</h3>
          </div>
          <div className="space-y-3">
            {data.projects.slice(0, 6).map(proj => (
              <div key={proj.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground font-mono truncate max-w-[180px]">{proj.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{proj.sessions}s · {proj.sizeKb}KB</span>
                </div>
                <Bar pct={maxProject ? (proj.sizeKb / maxProject.sizeKb) * 100 : 0} color="#f0c000" />
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#3498db]" />
            <h3 className="text-sm font-bold text-foreground">Recent Commands</h3>
          </div>
          <div className="space-y-1.5">
            {data.history.slice(0, 8).map((h, i) => (
              <div key={i} className="flex items-start gap-2 py-1 border-b border-border/30 last:border-0">
                <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">›</span>
                <div className="min-w-0">
                  <div className="text-xs text-foreground font-mono truncate">{h.command ?? "(no command)"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{h.cwd ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-[#2ecc71]" />
          <h3 className="text-sm font-bold text-foreground">Daily Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground text-left border-b border-border">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium text-right">Messages</th>
                <th className="pb-2 font-medium text-right">Sessions</th>
                <th className="pb-2 font-medium text-right">Tools</th>
              </tr>
            </thead>
            <tbody>
              {[...data.dailyActivity].reverse().slice(0, 7).map(day => (
                <tr key={day.date} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                  <td className="py-1.5 font-mono text-muted-foreground">{day.date}</td>
                  <td className="py-1.5 text-right font-semibold text-[#6c63ff]">{day.messageCount.toLocaleString()}</td>
                  <td className="py-1.5 text-right text-[#2ecc71]">{day.sessionCount}</td>
                  <td className="py-1.5 text-right text-[#f0c000]">{day.toolCallCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Todos */}
      {data.todos.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare size={14} className="text-[#ff6b9d]" />
            <h3 className="text-sm font-bold text-foreground">Active Todos</h3>
          </div>
          <div className="space-y-2">
            {data.todos.map(todo => (
              <div key={todo.project} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-mono truncate flex-1">{todo.project}</span>
                <span className="text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">{todo.pending} pending</span>
                <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">{todo.done} done</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
