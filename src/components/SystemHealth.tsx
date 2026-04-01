"use client";

import { AlertTriangle, Info, CheckCircle, Activity } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { systemHealth } from "@/data/mockData";

const alertLevelConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  critical: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
};

function MetricBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f97316" : "#ef4444";
  const data = [{ value: score }];

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={180} height={180}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={210}
          endAngle={-30}
          data={data}
          barSize={16}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill={color}
            background={{ fill: "hsl(217 33% 17%)" }}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">Health Score</span>
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const alerts = systemHealth.alerts;
  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;
  const infoCount = alerts.filter((a) => a.level === "info").length;

  const score = systemHealth.score;
  const healthLabel = score >= 80 ? "Healthy" : score >= 60 ? "Degraded" : "Critical";
  const healthColor = score >= 80 ? "text-green-400" : score >= 60 ? "text-orange-400" : "text-red-400";

  return (
    <div className="space-y-4">
      {/* Gauge + label */}
      <div className="flex flex-col items-center gap-1">
        <HealthGauge score={score} />
        <div className={`flex items-center gap-2 text-sm font-semibold ${healthColor}`}>
          <Activity size={16} />
          <span>{healthLabel}</span>
        </div>
      </div>

      {/* Alert counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {criticalCount > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <div className="text-lg font-bold text-red-400">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
        )}
        <div className={`${criticalCount === 0 ? "col-span-1" : ""} bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2`}>
          <div className="text-lg font-bold text-yellow-400">{warningCount}</div>
          <div className="text-xs text-muted-foreground">Warnings</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
          <div className="text-lg font-bold text-blue-400">{infoCount}</div>
          <div className="text-xs text-muted-foreground">Info</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
          <div className="text-lg font-bold text-green-400">
            {alerts.filter((a) => a.level !== "critical" && a.level !== "warning").length === 0 ? "✓" : "OK"}
          </div>
          <div className="text-xs text-muted-foreground">Healthy</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Metrics</h4>
        <MetricBar label="Gateway Uptime" value={systemHealth.gatewayUptime} color="#22c55e" />
        <MetricBar label="Model Quota Used" value={systemHealth.modelQuotaUsage} color="#3b82f6" />
        <MetricBar label="Skill Health" value={systemHealth.skillHealth} color="#a855f7" />
        <MetricBar label="Cron Success Rate" value={systemHealth.cronSuccessRate} color="#f97316" />
      </div>

      {/* Alerts list */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Alerts</h4>
        {alerts.map((alert, i) => {
          const cfg = alertLevelConfig[alert.level] || alertLevelConfig.info;
          const Icon = cfg.icon;
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded-lg ${cfg.bg} border ${cfg.border}`}
            >
              <Icon size={14} className={`${cfg.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/90">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle size={14} className="text-green-400" />
            <span className="text-xs text-green-400">All systems nominal</span>
          </div>
        )}
      </div>
    </div>
  );
}
