"use client";

import { agentTimeline } from "@/data/mockData";

const typeColors: Record<string, string> = {
  completed: "text-emerald-400",
  started: "text-blue-400",
  error: "text-red-400",
};

const typeDot: Record<string, string> = {
  completed: "bg-emerald-500",
  started: "bg-blue-500",
  error: "bg-red-500",
};

export default function AgentTimeline() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Activity Timeline</h3>
      <div className="relative pl-4 border-l border-border space-y-3">
        {agentTimeline.map((entry) => (
          <div key={entry.id} className="relative">
            {/* dot on the timeline line */}
            <span
              className={`absolute -left-[1.35rem] top-[0.35rem] h-2 w-2 rounded-full ${typeDot[entry.type] ?? "bg-muted-foreground"}`}
            />
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xs">{entry.emoji}</span>
              <span className="text-xs font-medium text-foreground">{entry.agent}</span>
              <span className="text-[11px] text-muted-foreground">—</span>
              <span className={`text-[11px] ${typeColors[entry.type] ?? "text-muted-foreground"}`}>
                {entry.action}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">({entry.time})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
