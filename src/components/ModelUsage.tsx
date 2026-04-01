"use client";

import { Cpu, DollarSign, Zap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { modelUsage } from "@/data/mockData";

export default function ModelUsage() {
  const usagePct = (modelUsage.tokensUsed / modelUsage.tokensLimit) * 100;
  const usageColor = usagePct > 80 ? "#ef4444" : usagePct > 60 ? "#f97316" : "#3b82f6";

  return (
    <div className="space-y-4">
      {/* Model badge */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu size={20} className="text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{modelUsage.model}</div>
          <div className="text-xs text-muted-foreground">Active model</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-bold text-foreground">{modelUsage.requestsToday}</div>
          <div className="text-xs text-muted-foreground">requests today</div>
        </div>
      </div>

      {/* Token usage */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-semibold text-foreground">Token Usage</span>
          <span className="text-xs text-muted-foreground">
            {modelUsage.tokensUsed.toLocaleString()} / {modelUsage.tokensLimit.toLocaleString()}
          </span>
        </div>

        {/* Big progress bar */}
        <div className="h-4 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
            style={{ width: `${usagePct}%`, backgroundColor: usageColor }}
          >
            {usagePct > 15 && (
              <span className="text-[10px] text-white font-bold">{usagePct.toFixed(1)}%</span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{(modelUsage.tokensLimit / 1000).toFixed(0)}k limit</span>
        </div>
      </div>

      {/* Cost cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-xs text-muted-foreground">Today&apos;s Cost</span>
          </div>
          <div className="text-2xl font-bold text-foreground">${modelUsage.cost.toFixed(2)}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-orange-400" />
            <span className="text-xs text-muted-foreground">Est. Monthly</span>
          </div>
          <div className="text-2xl font-bold text-foreground">${modelUsage.estimatedMonthlyCost.toFixed(0)}</div>
        </div>
      </div>

      {/* 7-day usage chart */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-yellow-400" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">7-Day Token Usage</h4>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={modelUsage.usageHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ background: "hsl(222 47% 14%)", border: "1px solid hsl(217 33% 20%)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "#9ca3af" }}
              formatter={(v: number) => [`${v.toLocaleString()} tokens`, "Tokens"]}
            />
            <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
              {modelUsage.usageHistory.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === modelUsage.usageHistory.length - 1 ? "#3b82f6" : "#3b82f622"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost trend */}
      <div className="bg-card border border-border rounded-lg p-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Daily Cost ($)</h4>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={modelUsage.usageHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip
              contentStyle={{ background: "hsl(222 47% 14%)", border: "1px solid hsl(217 33% 20%)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "#9ca3af" }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost"]}
            />
            <Bar dataKey="cost" fill="#22c55e22" radius={[4, 4, 0, 0]}>
              {modelUsage.usageHistory.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === modelUsage.usageHistory.length - 1 ? "#22c55e" : "#22c55e33"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
