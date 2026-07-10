# Folder Structure Guide

This document maps the project directory structure of **Synthetix Console**.

---

## 1. Global Project Layout

```
.
├── docs/                      # Architectural & API Guides
├── prisma/                    # Relational DB Engine
│   ├── schema.prisma          # Database models (SQLite config)
│   ├── seed.ts                # Database seed script
│   └── template.db            # Bundled seed template database
├── public/                    # Static image and branding assets
├── src/                       # Application code base
│   ├── app/                   # App Router Page Views & APIs
│   ├── components/            # Layout blocks and overlay systems
│   ├── hooks/                 # Centralized key shortcuts handlers
│   ├── lib/                   # Session, JWT, and Simulation utilities
│   ├── store/                 # Zustand global stores
│   ├── proxy.ts               # Next.js 16 request proxy middleware
│   └── tsconfig.json          # TypeScript configurations
├── README.md                  # Main overview readme
└── package.json               # Package manifests and build scripts
```

---

## 2. Source App Folder Layout

The `src/app/` folder leverages Next.js dynamic routing conventions:

* **`src/app/api/`**
  * `auth/login/`, `auth/signup/`, `auth/logout/`, `auth/session/` (Auth APIs)
  * `jobs/` (Jobs index & Spawners)
  * `jobs/[id]/` (Fetch & Delete detail)
  * `jobs/[id]/cancel/`, `jobs/[id]/retry/`, `jobs/[id]/duplicate/` (Job action triggers)
  * `notifications/`, `notifications/read-all/` (Alert handlers)
  * `events/` (Server-Sent Event streamer)
  * `workers/` (Server node metrics)
  * `stats/` (Dashboard counters & graph ticks)
* **`src/app/dashboard/`**
  * `page.tsx` (Dashboard UI view, polling statistics, and rendering active queues)
* **`src/app/jobs/`**
  * `page.tsx` (Advanced filters, job queue manager table, and job spawning dialog)
* **`src/app/notifications/`**
  * `page.tsx` (Notification hub lists, expand triggers, and playback buttons)
* **`src/app/workers/`**
  * `page.tsx` (Node cluster monitors, CPU load progress lines)
* **`src/app/login/` & `src/app/signup/`**
  * `page.tsx` (Credentials custom login forms and banners)
