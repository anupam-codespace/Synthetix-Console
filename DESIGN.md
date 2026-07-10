---
name: Synthetix Design System
colors:
  background: '#09090b'
  foreground: '#fafafa'
  card: '#09090b'
  card-foreground: '#fafafa'
  border: '#27272a'
  input: '#27272a'
  primary: '#fafafa'
  primary-foreground: '#18181b'
  secondary: '#27272a'
  secondary-foreground: '#fafafa'
  muted: '#27272a'
  muted-foreground: '#a1a1aa'
  accent: '#27272a'
  accent-foreground: '#fafafa'
  destructive: '#ef4444'
  destructive-foreground: '#fafafa'
  success: '#10b981'
  success-foreground: '#ffffff'
  warning: '#f57c00'
  warning-foreground: '#ffffff'
typography:
  font-sans: Inter
  font-mono: Roboto Mono
rounded:
  sm: 4px
  DEFAULT: 8px
  md: 12px
  lg: 16px
---

# Synthetix Design System

The Synthetix Design System is engineered for high-performance developer tools, job monitoring pipelines, and infrastructure dashboards. It balances high-density information layout with absolute visual minimalism, drawing inspiration from Linear, Vercel, and Raycast.

---

## 🎨 Color Palette

The color strategy relies on neutral values to reduce cognitive load and direct attention specifically to active items and job statuses.

* **Background canvas**: Deep dark charcoal (`#09090b` / Slate-950) or pure white (`#ffffff` / Slate-50)
* **Surfaces**: Tonal slate values with thin borders (`#27272a`) replacing heavy shadows.
* **Success Indicator**: Clean Emerald Green (`#10b981`) for completed jobs and idle/online worker states.
* **Failure Indicator**: Red Rose (`#ef4444`) for failed jobs.
* **Processing Indicator**: Amber Orange (`#f57c00`) for busy workers and active processing steps.

---

## ✍️ Typography

* **Body & Headlines**: **Inter** is used for universal readability and spatial economy.
* **Terminal & Code**: **Roboto Mono** or system monospace is mandatory for execution logs, timestamps, and parameters.

---

## 📐 Layout & Depth

* **12-Column Grid**: Dynamic container boundaries with left-anchored persistent navigation sidebars.
* **Elevation Levels**:
  * **Canvas (Level 0)**: Flat base background.
  * **Module Surface (Level 1)**: Solid card surface with 1px border. No drop shadows.
  * **Overlay Panel (Level 2)**: Slide-out panels with a 20px blur backdrop-filter.
