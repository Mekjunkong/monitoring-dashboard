// ============================================================
// MOCK DATA — monitoring-dashboard
// ============================================================

export const projects = [
  { id: 1, name: "WIRO 4x4", color: "blue", colorHex: "#3b82f6" },
  { id: 2, name: "Wiro Tour", color: "green", colorHex: "#22c55e" },
  { id: 3, name: "Thailand Hayom", color: "purple", colorHex: "#a855f7" },
  { id: 4, name: "Agri Business", color: "orange", colorHex: "#f97316" },
  { id: 5, name: "Mike Web Studio", color: "red", colorHex: "#ef4444" },
];

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "inprogress" | "done";

export interface Task {
  id: string;
  projectId: number;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string;
  dueDate: string;
  progress: number;
  description?: string;
}

export const tasks: Task[] = [
  // WIRO 4x4
  { id: "t1", projectId: 1, title: "Marketing strategy Q2", status: "todo", priority: "high", assignee: "Eli", dueDate: "2026-04-05", progress: 0, description: "Plan full Q2 marketing strategy" },
  { id: "t2", projectId: 1, title: "GMB optimization", status: "inprogress", priority: "high", assignee: "Scout", dueDate: "2026-04-03", progress: 65, description: "Optimize Google My Business profile" },
  { id: "t3", projectId: 1, title: "Blog: Doi Inthanon guide", status: "inprogress", priority: "medium", assignee: "Pen", dueDate: "2026-04-07", progress: 40, description: "Write SEO blog post about Doi Inthanon 4x4 trail" },
  { id: "t4", projectId: 1, title: "Update pricing page", status: "done", priority: "medium", assignee: "Eli", dueDate: "2026-03-30", progress: 100 },
  { id: "t5", projectId: 1, title: "Follow up March leads", status: "done", priority: "high", assignee: "Closer", dueDate: "2026-03-31", progress: 100 },
  { id: "t6", projectId: 1, title: "Instagram content calendar", status: "todo", priority: "medium", assignee: "Buzz", dueDate: "2026-04-10", progress: 0 },
  // Wiro Tour
  { id: "t7", projectId: 2, title: "Chiang Rai tour page", status: "inprogress", priority: "high", assignee: "Eli", dueDate: "2026-04-08", progress: 30 },
  { id: "t8", projectId: 2, title: "Partner hotel list", status: "todo", priority: "medium", assignee: "Closer", dueDate: "2026-04-15", progress: 0 },
  { id: "t9", projectId: 2, title: "Booking system integration", status: "todo", priority: "high", assignee: "Eli", dueDate: "2026-04-20", progress: 10 },
  { id: "t10", projectId: 2, title: "Thai/EN landing page", status: "done", priority: "high", assignee: "Pen", dueDate: "2026-03-28", progress: 100 },
  // Thailand Hayom
  { id: "t11", projectId: 3, title: "News aggregator setup", status: "inprogress", priority: "high", assignee: "Scout", dueDate: "2026-04-06", progress: 55 },
  { id: "t12", projectId: 3, title: "Social sharing automation", status: "todo", priority: "medium", assignee: "Buzz", dueDate: "2026-04-12", progress: 0 },
  { id: "t13", projectId: 3, title: "Reader analytics", status: "todo", priority: "low", assignee: "Scout", dueDate: "2026-04-18", progress: 0 },
  { id: "t14", projectId: 3, title: "Content moderation rules", status: "done", priority: "medium", assignee: "Eli", dueDate: "2026-03-25", progress: 100 },
  // Agri Business
  { id: "t15", projectId: 4, title: "Market research report", status: "inprogress", priority: "high", assignee: "Scout", dueDate: "2026-04-04", progress: 70 },
  { id: "t16", projectId: 4, title: "Farmer network outreach", status: "todo", priority: "medium", assignee: "Closer", dueDate: "2026-04-14", progress: 0 },
  { id: "t17", projectId: 4, title: "Financial model v1", status: "todo", priority: "high", assignee: "Ledger", dueDate: "2026-04-09", progress: 20 },
  { id: "t18", projectId: 4, title: "Brand identity draft", status: "done", priority: "low", assignee: "Pen", dueDate: "2026-03-20", progress: 100 },
  // Mike Web Studio
  { id: "t19", projectId: 5, title: "Portfolio site redesign", status: "inprogress", priority: "high", assignee: "Eli", dueDate: "2026-04-11", progress: 45 },
  { id: "t20", projectId: 5, title: "Client onboarding flow", status: "todo", priority: "medium", assignee: "Closer", dueDate: "2026-04-16", progress: 0 },
  { id: "t21", projectId: 5, title: "Service pricing page", status: "inprogress", priority: "medium", assignee: "Pen", dueDate: "2026-04-08", progress: 80 },
  { id: "t22", projectId: 5, title: "SEO audit", status: "done", priority: "high", assignee: "Scout", dueDate: "2026-03-29", progress: 100 },
];

export const gatewayStatus = {
  status: "online" as "online" | "offline" | "degraded",
  uptime7d: 99.8,
  uptime30d: 99.5,
  responseTime: 45,
  messageQueue: { pending: 3, processed: 2541 },
  errorRate: 0.2,
  lastCheck: new Date().toISOString(),
  errors: [
    { time: "2026-04-01 08:12", message: "Connection timeout on channel telegram", severity: "warning" },
    { time: "2026-03-31 22:45", message: "Rate limit hit: 429 from Anthropic", severity: "warning" },
    { time: "2026-03-30 14:30", message: "Skill skill-update failed: exit code 1", severity: "error" },
    { time: "2026-03-29 09:15", message: "Memory pressure: 87% RAM", severity: "warning" },
    { time: "2026-03-28 19:02", message: "WebSocket reconnect after 30s", severity: "info" },
  ],
  uptimeHistory: [
    { day: "Mon", uptime: 100 },
    { day: "Tue", uptime: 99.9 },
    { day: "Wed", uptime: 98.5 },
    { day: "Thu", uptime: 100 },
    { day: "Fri", uptime: 99.8 },
    { day: "Sat", uptime: 100 },
    { day: "Sun", uptime: 99.8 },
  ],
};

export const modelUsage = {
  model: "claude-haiku-4-5",
  tokensUsed: 45230,
  tokensLimit: 200000,
  cost: 2.45,
  requestsToday: 87,
  estimatedMonthlyCost: 73.50,
  usageHistory: [
    { day: "Mon", tokens: 5200, cost: 0.31 },
    { day: "Tue", tokens: 8100, cost: 0.49 },
    { day: "Wed", tokens: 6300, cost: 0.38 },
    { day: "Thu", tokens: 9500, cost: 0.57 },
    { day: "Fri", tokens: 7200, cost: 0.43 },
    { day: "Sat", tokens: 4100, cost: 0.25 },
    { day: "Sun", tokens: 4830, cost: 0.29 },
  ],
};

export type CronStatus = "success" | "failed" | "running" | "pending";

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  status: CronStatus;
  duration: number;
  recentLogs: { time: string; status: CronStatus; duration: number; message: string }[];
}

export const cronJobs: CronJob[] = [
  {
    id: "cj1",
    name: "heartbeat",
    schedule: "Every 6 hours",
    lastRun: "2 hrs ago",
    nextRun: "in 4 hrs",
    status: "success",
    duration: 2.3,
    recentLogs: [
      { time: "10:00 AM", status: "success", duration: 2.3, message: "Gateway healthy. 3 agents active." },
      { time: "04:00 AM", status: "success", duration: 2.1, message: "Gateway healthy. 2 agents active." },
      { time: "10:00 PM", status: "success", duration: 2.4, message: "Gateway healthy. 1 agent active." },
    ],
  },
  {
    id: "cj2",
    name: "daily-report",
    schedule: "Daily 8:00 AM",
    lastRun: "Today 8:00 AM",
    nextRun: "Tomorrow 8:00 AM",
    status: "success",
    duration: 15.6,
    recentLogs: [
      { time: "Today 8:00 AM", status: "success", duration: 15.6, message: "Report generated: 87 tokens, 5 tasks, 2 inquiries." },
      { time: "Yesterday 8:00 AM", status: "success", duration: 14.2, message: "Report generated: 63 tokens, 3 tasks, 1 inquiry." },
      { time: "2 days ago 8:00 AM", status: "failed", duration: 8.1, message: "Error: Gmail API timeout after 8s." },
    ],
  },
  {
    id: "cj3",
    name: "backup",
    schedule: "Sunday midnight",
    lastRun: "3 days ago",
    nextRun: "in 4 days",
    status: "success",
    duration: 120.4,
    recentLogs: [
      { time: "Sun Mar 29 00:00", status: "success", duration: 120.4, message: "Backup complete: 2.3GB → S3 bucket." },
      { time: "Sun Mar 22 00:00", status: "success", duration: 118.2, message: "Backup complete: 2.1GB → S3 bucket." },
      { time: "Sun Mar 15 00:00", status: "success", duration: 115.7, message: "Backup complete: 1.9GB → S3 bucket." },
    ],
  },
  {
    id: "cj4",
    name: "skill-update",
    schedule: "Weekly Monday",
    lastRun: "2 days ago",
    nextRun: "in 5 days",
    status: "failed",
    duration: 45.2,
    recentLogs: [
      { time: "Mon Mar 30", status: "failed", duration: 45.2, message: "Error: npm install failed — network timeout." },
      { time: "Mon Mar 23", status: "success", duration: 62.1, message: "Updated 3 skills: security-audit, coding-agent, weather." },
      { time: "Mon Mar 16", status: "success", duration: 58.3, message: "Updated 5 skills. All checks passed." },
    ],
  },
  {
    id: "cj5",
    name: "memory-cleanup",
    schedule: "Every 2 days",
    lastRun: "1 day ago",
    nextRun: "Tomorrow",
    status: "running",
    duration: 0,
    recentLogs: [
      { time: "Running now", status: "running", duration: 0, message: "Scanning 847 memory entries..." },
      { time: "2 days ago", status: "success", duration: 18.4, message: "Cleaned 124 stale entries. 2.1MB freed." },
      { time: "4 days ago", status: "success", duration: 21.2, message: "Cleaned 89 stale entries. 1.7MB freed." },
    ],
  },
];

export type SkillAction = "executed" | "created" | "deployed" | "updated" | "failed";

export interface SkillLog {
  id: number;
  skill: string;
  action: SkillAction;
  status: "success" | "failed";
  time: string;
  duration: number;
  message: string;
}

export const skillLogs: SkillLog[] = [
  { id: 1, skill: "security-audit", action: "executed", status: "success", time: "10 min ago", duration: 3.4, message: "Scanned 12 routes. 0 critical, 2 warnings found." },
  { id: 2, skill: "coding-agent", action: "created", status: "success", time: "25 min ago", duration: 0.1, message: "Agent spawned for monitoring-dashboard build." },
  { id: 3, skill: "weather", action: "executed", status: "success", time: "35 min ago", duration: 1.2, message: "Fetched Chiang Mai forecast. 34°C, partly cloudy." },
  { id: 4, skill: "google-calendar", action: "executed", status: "success", time: "1 hr ago", duration: 2.1, message: "Synced 3 new events for April." },
  { id: 5, skill: "skill-update", action: "updated", status: "failed", time: "2 hrs ago", duration: 45.2, message: "npm install failed — network timeout on skillRegistry." },
  { id: 6, skill: "deep-research-pro", action: "executed", status: "success", time: "3 hrs ago", duration: 28.7, message: "Research complete: 5 sources, 2400 words report." },
  { id: 7, skill: "gmail", action: "executed", status: "success", time: "4 hrs ago", duration: 1.8, message: "Fetched 5 unread emails. 1 inquiry from David." },
  { id: 8, skill: "notion", action: "executed", status: "success", time: "5 hrs ago", duration: 3.2, message: "Updated WIRO 4x4 wiki page." },
  { id: 9, skill: "stock-analysis", action: "executed", status: "failed", time: "6 hrs ago", duration: 5.1, message: "Error: Yahoo Finance rate limit exceeded." },
  { id: 10, skill: "news-summary", action: "executed", status: "success", time: "8 hrs ago", duration: 4.5, message: "Summarized 8 top stories. Audio generated." },
  { id: 11, skill: "todoist", action: "executed", status: "success", time: "10 hrs ago", duration: 1.1, message: "Synced 4 tasks from Todoist." },
  { id: 12, skill: "brainstorming", action: "executed", status: "success", time: "12 hrs ago", duration: 7.8, message: "Generated 10 ideas for Agri Business MVP." },
  { id: 13, skill: "obsidian", action: "executed", status: "success", time: "14 hrs ago", duration: 0.8, message: "Saved draft: WIRO 4x4/Content/doi-inthanon-blog.md" },
  { id: 14, skill: "youtube-transcript", action: "executed", status: "success", time: "16 hrs ago", duration: 12.3, message: "Transcribed + summarized 22-min marketing video." },
  { id: 15, skill: "memory-hygiene", action: "executed", status: "success", time: "1 day ago", duration: 18.4, message: "Cleaned 124 stale memories, freed 2.1MB." },
  { id: 16, skill: "proactive-agent", action: "deployed", status: "success", time: "2 days ago", duration: 0.3, message: "Proactive agent activated with WAL protocol." },
  { id: 17, skill: "google-search", action: "executed", status: "success", time: "2 days ago", duration: 1.5, message: "Search: 'Thailand 4x4 offroad tourism 2026'" },
  { id: 18, skill: "tavily", action: "executed", status: "success", time: "3 days ago", duration: 2.2, message: "Research: Agri business opportunities Chiang Mai." },
  { id: 19, skill: "content-creator", action: "executed", status: "success", time: "3 days ago", duration: 9.1, message: "Generated 5 social posts for WIRO 4x4 Instagram." },
  { id: 20, skill: "openclaw-guardian", action: "deployed", status: "success", time: "4 days ago", duration: 1.4, message: "Guardian watchdog deployed. Monitoring started." },
];

export const systemHealth = {
  score: 87,
  gatewayUptime: 99.8,
  modelQuotaUsage: 22.6,
  skillHealth: 90,
  cronSuccessRate: 80,
  alerts: [
    { level: "warning", message: "skill-update cron job failed last run", time: "2 hrs ago" },
    { level: "warning", message: "stock-analysis skill rate limited by Yahoo Finance", time: "6 hrs ago" },
    { level: "info", message: "memory-cleanup is currently running", time: "Now" },
    { level: "info", message: "Backup scheduled for Sunday midnight", time: "in 4 days" },
  ],
};
