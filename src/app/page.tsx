"use client";

import { useState, useEffect } from "react";
import { Activity, Wifi, Cpu, CalendarClock, BookOpen, Kanban as KanbanIcon, Menu, X, ChevronDown, ChevronUp, Bot, Sun, Moon, Building2 } from "lucide-react";
import RefreshTimer from "@/components/RefreshTimer";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import AgentStatusPanel from "@/components/AgentStatusPanel";
import Kanban from "@/components/Kanban";
import GatewayStatus from "@/components/GatewayStatus";
import ModelUsage from "@/components/ModelUsage";
import CronJobs from "@/components/CronJobs";
import SkillLogs from "@/components/SkillLogs";
import SystemHealth from "@/components/SystemHealth";
import dynamic from "next/dynamic";
const PixelOffice = dynamic(() => import("@/components/PixelOffice"), { ssr: false });
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/Toast";

type Tab = "kanban" | "gateway" | "model" | "cron" | "skills" | "health" | "office";

const tabs: { id: Tab; label: string; icon: React.ElementType; shortLabel: string }[] = [
  { id: "kanban", label: "Kanban Board", shortLabel: "Kanban", icon: KanbanIcon },
  { id: "gateway", label: "Gateway Status", shortLabel: "Gateway", icon: Wifi },
  { id: "model", label: "Model Usage", shortLabel: "Model", icon: Cpu },
  { id: "cron", label: "Cron Jobs", shortLabel: "Cron", icon: CalendarClock },
  { id: "skills", label: "Skill Logs", shortLabel: "Logs", icon: BookOpen },
  { id: "health", label: "System Health", shortLabel: "Health", icon: Activity },
  { id: "office", label: "Pixel Office", shortLabel: "Office", icon: Building2 },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("kanban");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const { countdown, isPaused, isRefreshing, lastRefreshed, togglePause, manualRefresh } = useAutoRefresh({
    interval: 30000,
    onRefresh: () => showToast("Dashboard refreshed", "info"),
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const tabConfig = tabs.find((t) => t.id === tab);
    if (tabConfig) {
      showToast(`Switched to ${tabConfig.label}`, "info");
    }
    setMobileMenuOpen(false);
  };

  const activeTabConfig = tabs.find((t) => t.id === activeTab)!;
  const ActiveIcon = activeTabConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-foreground leading-none">Eli</div>
                <div className="text-[10px] text-muted-foreground">Monitoring</div>
              </div>
            </div>

            {/* Desktop tabs — scrollable horizontal strip */}
            <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={14} />
                    {tab.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1 md:hidden" />

            {/* Refresh timer */}
            <RefreshTimer
              countdown={countdown}
              isPaused={isPaused}
              isRefreshing={isRefreshing}
              lastRefreshed={lastRefreshed}
              onTogglePause={togglePause}
              onManualRefresh={manualRefresh}
            />

            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile tab menu — scrolls horizontally, doesn't wrap */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 pb-2 flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.shortLabel}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Page header */}
      <div className="max-w-screen-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ActiveIcon size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{activeTabConfig.label}</h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === "kanban" && "Drag & drop task management across all projects"}
              {activeTab === "gateway" && "Real-time OpenClaw gateway health & metrics"}
              {activeTab === "model" && "Claude model token usage, cost, and trends"}
              {activeTab === "cron" && "Scheduled job status and execution history"}
              {activeTab === "skills" && "Agent skill activity log — last 20 entries"}
              {activeTab === "health" && "Overall system health score and active alerts"}
              {activeTab === "office" && "Live pixel art office — watch your agents work in real time"}
            </p>
          </div>
        </div>
      </div>

      {/* Agent Status Panel */}
      <section className="max-w-screen-2xl mx-auto px-4 pt-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setAgentPanelOpen(!agentPanelOpen)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Agent Status</span>
              <span className="text-xs text-muted-foreground">— 8 agents</span>
            </div>
            {agentPanelOpen ? (
              <ChevronUp size={16} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </button>
          {agentPanelOpen && (
            <div className="px-4 pb-4">
              <AgentStatusPanel />
            </div>
          )}
        </div>
      </section>

      {/* Main content — key prop forces re-mount on tab change (Bug 1 fix) */}
      <main className="max-w-screen-2xl mx-auto px-4 py-4" key={activeTab}>
        {activeTab === "kanban" && (
          <Kanban />
        )}

        {activeTab === "gateway" && (
          <div className="max-w-2xl">
            <GatewayStatus />
          </div>
        )}

        {activeTab === "model" && (
          <div className="max-w-xl">
            <ModelUsage />
          </div>
        )}

        {activeTab === "cron" && (
          <div className="max-w-3xl">
            <CronJobs />
          </div>
        )}

        {activeTab === "skills" && (
          <div className="max-w-3xl">
            <SkillLogs />
          </div>
        )}

        {activeTab === "health" && (
          <div className="max-w-md">
            <SystemHealth />
          </div>
        )}

        {activeTab === "office" && (
          <div className="max-w-2xl">
            <PixelOffice />
          </div>
        )}
      </main>
    </div>
  );
}
