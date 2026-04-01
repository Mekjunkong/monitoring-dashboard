"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, Filter } from "lucide-react";
import { skillLogs, SkillAction } from "@/data/mockData";

const actionConfig: Record<SkillAction, { color: string; bg: string }> = {
  executed: { color: "text-blue-400", bg: "bg-blue-500/15" },
  created: { color: "text-green-400", bg: "bg-green-500/15" },
  deployed: { color: "text-purple-400", bg: "bg-purple-500/15" },
  updated: { color: "text-yellow-400", bg: "bg-yellow-500/15" },
  failed: { color: "text-red-400", bg: "bg-red-500/15" },
};

const actionFilters: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Executed", value: "executed" },
  { label: "Created", value: "created" },
  { label: "Deployed", value: "deployed" },
  { label: "Updated", value: "updated" },
  { label: "Failed", value: "failed" },
];

export default function SkillLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = skillLogs.filter((log) => {
    const matchSearch =
      !search ||
      log.skill.toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchAction && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills or messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          <Filter size={12} className="text-muted-foreground" />
          {["all", "success", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? s === "all"
                    ? "bg-primary text-primary-foreground"
                    : s === "success"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Action type filters */}
      <div className="flex flex-wrap gap-1.5">
        {actionFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActionFilter(f.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              actionFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {skillLogs.length} entries
      </div>

      {/* Timeline */}
      <div className="space-y-1.5">
        {filtered.map((log) => {
          const actionCfg = actionConfig[log.action] || actionConfig.executed;
          return (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:border-border/60 transition-colors"
            >
              {/* Status icon */}
              {log.status === "success" ? (
                <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              )}

              {/* Skill name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground font-mono">{log.skill}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${actionCfg.bg} ${actionCfg.color}`}>
                    {log.action}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">{log.message}</p>
              </div>

              {/* Meta */}
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground">{log.time}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{log.duration}s</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No entries match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
