"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, AlertTriangle, Clock, Zap, MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { gatewayStatus as mockGatewayStatus } from "@/data/mockData";

type GatewayStatusType = "online" | "offline" | "degraded";

interface LiveGatewayData {
  status: GatewayStatusType;
  latency: number | null;
  checkedAt: string;
}

const statusConfig = {
  online: { icon: Wifi, label: "Online", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", dot: "bg-green-400" },
  offline: { icon: WifiOff, label: "Offline", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", dot: "bg-red-400" },
  degraded: { icon: AlertTriangle, label: "Degraded", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", dot: "bg-yellow-400" },
};

const severityColors: Record<string, string> = {
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

export default function GatewayStatus() {
  const [liveData, setLiveData] = useState<LiveGatewayData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGateway = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gateway");
      const data: LiveGatewayData = await res.json();
      setLiveData(data);
    } catch {
      setLiveData({ status: "offline", latency: null, checkedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateway();
    const interval = setInterval(fetchGateway, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Use live status if available, fall back to mock for other metrics
  const gatewayStatus = mockGatewayStatus;
  const liveStatus: GatewayStatusType = liveData?.status ?? gatewayStatus.status;
  const responseTime = liveData?.latency ?? gatewayStatus.responseTime;

  const cfg = statusConfig[liveStatus];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Status hero */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg} border ${cfg.border}`}>
        <div className="relative">
          <StatusIcon size={28} className={cfg.color} />
          <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${cfg.dot} pulse-dot`} />
        </div>
        <div className="flex-1">
          <div className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</div>
          <div className="text-xs text-muted-foreground">
            {loading ? (
              <span className="flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Checking gateway...
              </span>
            ) : (
              <>Last checked: {liveData ? new Date(liveData.checkedAt).toLocaleTimeString() : new Date(gatewayStatus.lastCheck).toLocaleTimeString()}</>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {responseTime !== null ? `${responseTime}ms` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Response time</div>
        </div>
        <button
          onClick={fetchGateway}
          className="p-2 rounded-lg hover:bg-black/10 transition-colors"
          title="Refresh gateway status"
        >
          <RefreshCw size={14} className={`${cfg.color} ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-blue-400" />
            <span className="text-xs text-muted-foreground">Uptime 7d</span>
          </div>
          <div className="text-xl font-bold text-foreground">{gatewayStatus.uptime7d}%</div>
          <div className="h-1 bg-muted rounded-full mt-2">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${gatewayStatus.uptime7d}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-purple-400" />
            <span className="text-xs text-muted-foreground">Uptime 30d</span>
          </div>
          <div className="text-xl font-bold text-foreground">{gatewayStatus.uptime30d}%</div>
          <div className="h-1 bg-muted rounded-full mt-2">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${gatewayStatus.uptime30d}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className="text-green-400" />
            <span className="text-xs text-muted-foreground">Queue</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">{gatewayStatus.messageQueue.pending}</span>
            <span className="text-xs text-muted-foreground">pending</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {gatewayStatus.messageQueue.processed.toLocaleString()} processed
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-xs text-muted-foreground">Error Rate</span>
          </div>
          <div className="text-xl font-bold text-foreground">{gatewayStatus.errorRate}%</div>
          <div className="h-1 bg-muted rounded-full mt-2">
            <div
              className={`h-full rounded-full ${gatewayStatus.errorRate > 5 ? "bg-red-500" : gatewayStatus.errorRate > 1 ? "bg-yellow-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(gatewayStatus.errorRate * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7-day uptime chart */}
      <div className="bg-card border border-border rounded-lg p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">7-Day Uptime</h4>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={gatewayStatus.uptimeHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis domain={[95, 100]} tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#22c55e" }}
            />
            <Area type="monotone" dataKey="uptime" stroke="#22c55e" fill="url(#uptimeGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Error log */}
      <div className="bg-card border border-border rounded-lg p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Errors</h4>
        <div className="space-y-2">
          {gatewayStatus.errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground shrink-0 mt-0.5 tabular-nums">{err.time}</span>
              <span className={`shrink-0 uppercase font-medium ${severityColors[err.severity]}`}>
                [{err.severity}]
              </span>
              <span className="text-foreground/80">{err.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
