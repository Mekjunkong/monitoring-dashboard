"use client";

import { useState, useMemo } from "react";
import { Search, RefreshCw } from "lucide-react";
import { agents, Agent } from "@/data/mockData";
import AgentCard from "@/components/AgentCard";
import AgentTimeline from "@/components/AgentTimeline";

type FilterTab = "all" | "active" | "idle" | "error";

export default function AgentStatusPanel() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => ({
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    idle: agents.filter((a) => a.status === "idle").length,
    error: agents.filter((a) => a.status === "error").length,
  }), []);

  const filtered = useMemo(() => {
    return agents.filter((a: Agent) => {
      const matchesFilter = filter === "all" || a.status === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        (a.currentTask?.title ?? "").toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.total },
    { id: "active", label: "Active", count: counts.active },
    { id: "idle", label: "Idle", count: counts.idle },
    { id: "error", label: "Error", count: counts.error },
  ];

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{counts.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-card border border-emerald-500/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{counts.active}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-zinc-400">{counts.idle}</div>
          <div className="text-xs text-muted-foreground">Idle</div>
        </div>
        <div className="bg-card border border-red-500/20 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{counts.error}</div>
          <div className="text-xs text-muted-foreground">Error</div>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  filter === tab.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents or tasks..."
            className="pl-6 pr-3 py-1.5 bg-muted rounded-lg text-xs text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:border-primary/50 w-52"
          />
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <RefreshCw size={10} className="animate-spin" />
          Auto-refresh
        </div>
      </div>

      {/* Agent grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No agents match your filter.
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card border border-border rounded-xl p-4">
        <AgentTimeline />
      </div>
    </div>
  );
}
