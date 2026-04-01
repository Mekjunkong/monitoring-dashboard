"use client";

import { RefreshCw, Pause, Play } from "lucide-react";
import { format } from "date-fns";

interface RefreshTimerProps {
  countdown: number;
  isPaused: boolean;
  isRefreshing: boolean;
  lastRefreshed: Date;
  onTogglePause: () => void;
  onManualRefresh: () => void;
}

export default function RefreshTimer({
  countdown,
  isPaused,
  isRefreshing,
  lastRefreshed,
  onTogglePause,
  onManualRefresh,
}: RefreshTimerProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isRefreshing
              ? "bg-blue-400 pulse-dot"
              : isPaused
              ? "bg-yellow-400"
              : "bg-green-400 pulse-dot"
          }`}
        />
        <span className="text-muted-foreground text-xs">
          {isRefreshing ? "Refreshing..." : isPaused ? "Paused" : "Live"}
        </span>
      </div>

      {/* Last refreshed */}
      <span className="text-muted-foreground text-xs hidden sm:inline">
        Updated {format(lastRefreshed, "HH:mm:ss")}
      </span>

      {/* Countdown */}
      {!isPaused && !isRefreshing && (
        <span className="text-muted-foreground text-xs tabular-nums">
          Next in {countdown}s
        </span>
      )}

      {/* Controls */}
      <button
        onClick={onTogglePause}
        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
      >
        {isPaused ? <Play size={14} /> : <Pause size={14} />}
      </button>

      <button
        onClick={onManualRefresh}
        className={`p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ${
          isRefreshing ? "animate-spin" : ""
        }`}
        title="Refresh now"
        disabled={isRefreshing}
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
}
