# Component Hierarchy Guide

This document describes the React components used to assemble the **Synthetix Console** layout.

---

## 1. Global Shell Layout

All authenticated pages share the **`DashboardLayout`** shell.

```
+-------------------------------------------------------------+
| Sidebar        | Navbar (live indicators, toggle keys, ? )  |
|                |--------------------------------------------|
| - Logo         | Page Content View                          |
| - Nav links    | (Dashboard, Queue List, Notifications, Node)|
| - Worker list  |                                            |
| - User profile |                                            |
+-------------------------------------------------------------+
| Global Overlays (Job Drawer, Palette, Timelines, Shortcuts) |
+-------------------------------------------------------------+
```

---

## 2. Core Custom Components

### `Sidebar` (`src/components/sidebar.tsx`)
* Navigation links with dynamic unread badge overlays.
* Live-mounts the Server-Sent Events (SSE) stream on mount.
* Displays a node list tracking online workers, showing active CPU states.

### `Navbar` (`src/components/navbar.tsx`)
* Connection health badge: `LIVE` (connected), `CONNECTING`, or `OFFLINE`.
* Action anchors: Toggle Theme (Light/Dark), Command Palette search cue, and Shortcut Modal directory.

### `JobDrawer` (`src/components/job-drawer.tsx`)
* Inspector sliding panel.
* Live log screen with keyword search filters, auto-scroll toggle locks, copy buttons, and log txt downloads.
* Stepper timelines charting statuses.
* Diagnostic panels displaying AI solutions.

### `NotificationReplay` (`src/components/notification-replay.tsx`)
* Lifecycle player overlay.
* Playback controls: Play, Pause, Speed adjustments (1x, 2.5x, 7.5x), and Restart.
* Simulates progression times and prints step logs.

### `CommandPalette` (`src/components/command-palette.tsx`)
* Triggered on `⌘K` or `Ctrl+K`.
* Searches macros, active jobs, and notifications.
* Fully keyboard-navigable (`ArrowUp` / `ArrowDown` / `Enter`).

### `StatsCharts` (`src/components/stats-charts.tsx`)
* Custom responsive SVG chart rendering.
* Handles area paths, horizontal grid marks, coordinates mapping, hover-point coordinates, and tooltips.
