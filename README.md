# Eli Monitoring Dashboard

Real-time monitoring dashboard for OpenClaw agents, gateway health, and project management.

## Features

- **🗂️ Kanban Board** — Drag & drop task management for 5 projects (WIRO 4x4, Wiro Tour, Thailand Hayom, Agri Business, Mike Web Studio). Filter by project and assignee.
- **🌐 Gateway Status** — Real-time OpenClaw gateway health with uptime charts, response time, message queue, error log.
- **🤖 Model Usage** — Claude token usage, cost tracking, 7-day trends, estimated monthly cost.
- **⏰ Cron Jobs** — Scheduled job monitoring with last/next run times, status badges, expandable logs.
- **📋 Skill Logs** — Activity feed of last 20 skill executions — searchable and filterable.
- **💚 System Health** — Gauge chart (0-100), key metric bars, active alerts summary.
- **⟳ Auto-Refresh** — 30-second polling with countdown timer, pause/resume, manual refresh.

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TailwindCSS** (dark theme)
- **@dnd-kit** (drag & drop)
- **Recharts** (charts)
- **Lucide React** (icons)

## Setup

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
# Option 1: Vercel CLI
npx vercel

# Option 2: GitHub → Vercel (auto-deploy)
# Push to GitHub, import project on vercel.com
```

### Vercel env vars
No env vars required — all data is mocked.

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, dark mode, fonts
│   └── page.tsx            # Main dashboard page (tabs)
├── components/
│   ├── Kanban.tsx          # Drag & drop Kanban board
│   ├── GatewayStatus.tsx   # Gateway health panel
│   ├── ModelUsage.tsx      # Token/cost tracking
│   ├── CronJobs.tsx        # Scheduled jobs table
│   ├── SkillLogs.tsx       # Activity feed
│   ├── SystemHealth.tsx    # Health gauge + alerts
│   └── RefreshTimer.tsx    # Auto-refresh UI
├── hooks/
│   └── useAutoRefresh.ts   # 30s polling hook
├── data/
│   └── mockData.ts         # All mock data
└── styles/
    └── globals.css         # Tailwind + custom styles
```

## Connecting Real Data

Replace mock data in `src/data/mockData.ts` with API calls to:

```typescript
// Gateway
GET https://wiro4x4indochina.com/api/agent/analytics/summary
X-Agent-Key: <WIRO_AGENT_KEY>

// Bookings
GET /api/agent/bookings/pending

// Finance
GET /api/agent/finance/summary
```

## Contributing

Built for the Eli agent system — Mek's personal AI assistant.
