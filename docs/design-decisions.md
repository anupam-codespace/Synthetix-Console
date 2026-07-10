# Design Decisions

This document details the engineering and UX choices made during the construction of **Synthetix Console**.

---

## 1. Visual Language: Developer-First

Unlike traditional marketing SaaS products that rely on colorful gradients and flashy animations, Synthetix Console targets engineers and system operators.
* **Minimalist UI**: Inspired by Linear, Vercel, and Raycast. It uses flat backgrounds, clean borders (`border-border`), and monospace elements for values.
* **Informational Density**: Priority is given to displaying actual statistics (CPU, memory, timestamps, logs) rather than large empty cards.
* **Color Accents**: Alert levels and node statuses use tailored color schemes (emerald for success/idle, rose for failed, amber for processing/busy) rather than decorative gradients.

---

## 2. Real-Time SSE over WebSockets

Vercel Serverless Lambdas are ephemeral and terminate persistent socket connections. Using a WebSocket server like Socket.IO would fail or require external state brokers (like Redis/Pusher).
* **Choice**: We implemented Server-Sent Events (SSE).
* **Outcome**: This allows us to keep the connection stateless on the server side, streams database query polling responses, and reconnects automatically if the lambda cold-starts.

---

## 3. SQLite on Vercel: Pre-Seeded Templates

SQLite is a local file-based database. Vercel functions cannot write files outside the `/tmp` folder.
* **Choice**: We compile and seed the SQLite database during the Next.js build step into `prisma/template.db`.
* **Outcome**: At runtime, during initialization, the server copies this pre-populated database to `/tmp/synthetix.db` if it is not already present, ensuring immediate access to user and worker data.

---

## 4. Custom SVG Dataviz

Instead of importing bulky visualization libraries like Recharts or Chart.js:
* **Choice**: We built responsive SVG graphs from scratch in React.
* **Outcome**: This eliminates dependency conflicts with React 19 / Next.js 16, loads instantly, adapts perfectly to dark/light CSS variables, and enables precise hover tooltips.

---

## 5. Zustand over React Context

* **Choice**: Zustand is used for global state management.
* **Outcome**: It keeps components decoupled, allows us to trigger state updates directly inside the SSE event stream listeners, and prevents redundant renders when updating logs or timeline scrubbing.
