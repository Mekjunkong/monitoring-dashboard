"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cronJobs, CronStatus } from "@/data/mockData";

const statusConfig: Record<CronStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", label: "Success" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Failed" },
  running: { icon: Loader, color: "text-blue-400", bg: "bg-blue-500/10", label: "Running" },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Pending" },
};

function StatusBadge({ status }: { status: CronStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon size={10} className={status === "running" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

export default function CronJobs() {
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {cronJobs.map((job) => {
        const isExpanded = expandedJob === job.id;
        const cfg = statusConfig[job.status];
        const Icon = cfg.icon;

        return (
          <div key={job.id} className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Main row */}
            <button
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              onClick={() => setExpandedJob(isExpanded ? null : job.id)}
            >
              {/* Status icon */}
              <Icon
                size={18}
                className={`${cfg.color} shrink-0 ${job.status === "running" ? "animate-spin" : ""}`}
              />

              {/* Name + schedule */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground font-mono">{job.name}</span>
                  <StatusBadge status={job.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{job.schedule}</div>
              </div>

              {/* Times */}
              <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground shrink-0">
                <span>Last: {job.lastRun}</span>
                <span>Next: {job.nextRun}</span>
              </div>

              {/* Duration */}
              <div className="text-xs text-muted-foreground shrink-0 text-right hidden md:block">
                {job.status === "running" ? (
                  <span className="text-blue-400 animate-pulse">Running...</span>
                ) : (
                  <span>{job.duration}s</span>
                )}
              </div>

              {/* Expand */}
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Expanded logs */}
            {isExpanded && (
              <div className="border-t border-border px-4 py-3 bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Recent Runs
                </div>
                <div className="space-y-2">
                  {job.recentLogs.map((log, i) => {
                    const logCfg = statusConfig[log.status];
                    const LogIcon = logCfg.icon;
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <LogIcon
                          size={12}
                          className={`${logCfg.color} shrink-0 mt-0.5 ${log.status === "running" ? "animate-spin" : ""}`}
                        />
                        <span className="text-muted-foreground shrink-0">{log.time}</span>
                        <span className="text-muted-foreground shrink-0">
                          {log.status !== "running" && `(${log.duration}s)`}
                        </span>
                        <span className="text-foreground/80 min-w-0 break-words">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
