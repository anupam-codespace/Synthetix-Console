# Realtime Architecture Guide

This document describes the design and implementation details of the real-time communications channel in **Synthetix Console**.

---

## 1. Protocol Choice: Server-Sent Events (SSE)

In traditional real-time dashboards, WebSockets are common. However, WebSockets require persistent stateful servers, making them incompatible with serverless environments (like Vercel).

We choose **Server-Sent Events (SSE)** via a custom Next.js Route Handler `/api/events/route.ts`:
* **HTTP Native**: SSE runs over standard HTTP, bypassing firewall and WebSocket blocking.
* **Serverless Friendly**: Next.js streaming endpoints allow serverless functions to stream chunks utilizing Node.js `ReadableStream`.
* **Automatic Reconnect**: The browser's native `EventSource` automatically handles reconnection.

---

## 2. Event Routing Loop

```
[Database Writes] (Simulated Worker updates DB)
       |
       v (Polling loop ticks every 850ms)
[api/events/route.ts] (Streams updates since last request)
       |
       v (SSE Stream: event type 'sync')
[useJobStore.ts] (Client Zustand store)
       |
       v (Zustand State Merge & De-duplication)
[UI Component Renderers] (React renders changes instantly)
```

---

## 3. Resilience & State Catchup

When network drops or cold starts trigger, Vercel severless functions terminate the stream after a timeout (normally 15-30s depending on plan limits).

We implement a catchup protocol to prevent data loss:
1. **Zustand Reconnect Listener**: If the `EventSource` errors out, the store schedules a reconnect attempt after 3 seconds.
2. **Snapshot Synchronization**: Every SSE tick returns complete snapshot arrays of recent jobs and workers, allowing the store to overwrite or merge states safely without losing records.
3. **Log De-duplication**: SSE returns logs created since the last checked timestamp. The Zustand store merges logs by job ID, sorting them chronologically and skipping duplicate IDs to prevent rendering logs twice.
