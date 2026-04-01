"use client";

import { useState } from "react";
import { Agent } from "@/data/mockData";

interface AgentCardProps {
  agent: Agent;
}

function StatusBadge({ status }: { status: Agent["status"] }) {
  if (status === "active") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Active
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Error
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
        Offline
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-zinc-500" />
      Idle
    </span>
  );
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const cpuColor = agent.resources.cpu > 80 ? "bg-red-500" : agent.resources.cpu > 50 ? "bg-yellow-500" : "bg-emerald-500";
  const memMax = 512;
  const memPct = Math.min((agent.resources.memory / memMax) * 100, 100);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <div className="font-semibold text-foreground text-sm leading-tight">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.role}</div>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Current task */}
      {agent.currentTask ? (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground truncate max-w-[70%]">{agent.currentTask.title}</span>
            <span className="text-xs font-mono text-primary">{agent.currentTask.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${agent.currentTask.progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">No active task</div>
      )}

      {/* Resources */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">CPU</span>
            <span className="text-[10px] font-mono">{agent.resources.cpu}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${cpuColor} rounded-full transition-all`}
              style={{ width: `${Math.min(agent.resources.cpu, 100)}%` }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">Memory</span>
            <span className="text-[10px] font-mono">{agent.resources.memory}MB</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${memPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-0.5">
        {agent.recentLogs.map((log, i) => (
          <div key={i} className="text-[10px] text-muted-foreground font-mono truncate">
            › {log}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-[10px] text-muted-foreground">Updated {agent.lastUpdated}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
          >
            {showDetails ? "Hide" : "Details"}
          </button>
          <button className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            Send Task
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
          <div>Uptime: <span className="text-foreground font-mono">{agent.resources.uptime}h</span></div>
          <div>Agent ID: <span className="text-foreground font-mono">{agent.id}</span></div>
        </div>
      )}
    </div>
  );
}
