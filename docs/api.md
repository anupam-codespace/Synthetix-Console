# API Reference Guide

This document describes the API Route Handlers available in **Synthetix Console**.

All routes are prefixed with `/api`. Protected routes require a valid `auth_token` JWT cookie.

---

## 1. Authentication Endpoints

### `POST /api/auth/signup`
Creates a new operator account and establishes a session.
* **Payload**: `{ "name": "...", "email": "...", "password": "..." }`
* **Response**: `{ "user": { "id": "...", "email": "...", "preferences": { ... } } }`
* **Status**: `201 Created` / `409 Conflict` (email taken)

### `POST /api/auth/login`
Verifies credentials and sets `auth_token` HTTP-only cookie.
* **Payload**: `{ "email": "...", "password": "..." }`
* **Response**: `{ "user": { ... } }`
* **Status**: `200 OK` / `401 Unauthorized` (bad password/email)

### `POST /api/auth/logout`
Clears session cookie.
* **Status**: `200 OK`

### `GET /api/auth/session`
Fetches authenticated user identity details.
* **Response**: `{ "user": { "id": "...", "email": "...", "name": "..." } }` / `{ "user": null }`

---

## 2. Jobs Endpoints

### `GET /api/jobs`
Queries jobs. Supports query params: `status`, `priority`, `type`, `search`, `page`, `limit`.
* **Response**: `{ "jobs": [ ... ], "pagination": { "page": 1, "limit": 50, "totalCount": 5 } }`

### `POST /api/jobs`
Creates a new job and runs background simulator.
* **Payload**: `{ "type": "model_training", "priority": "high", "estimatedDuration": 45 }`
* **Response**: `{ "job": { ... } }`
* **Status**: `201 Created`

### `GET /api/jobs/[id]`
Gets detailed logs and history for a job.
* **Response**: `{ "job": { ..., "logs": [ ... ], "history": [ ... ] } }`

### `POST /api/jobs/[id]/retry`
Resets execution metrics and restarts simulation.
* **Response**: `{ "success": true }`

### `POST /api/jobs/[id]/cancel`
Cancels active job and frees worker locks.
* **Response**: `{ "success": true }`

### `POST /api/jobs/[id]/duplicate`
Clones job settings and triggers new run.
* **Response**: `{ "job": { ... } }`
* **Status**: `201 Created`

### `DELETE /api/jobs/[id]`
Purges job and cascades delete logs.
* **Response**: `{ "success": true }`

---

## 3. Realtime Stream Endpoint

### `GET /api/events`
Event stream endpoint (`text/event-stream`).
* **Headers**: `Connection: keep-alive`, `Cache-Control: no-cache`
* **Event type**: `sync`
* **Payload**: `{ "jobs": [ ... ], "workers": [ ... ], "unreadNotificationsCount": 3, "logs": [ ... ] }`

---

## 4. Notifications Endpoints

### `GET /api/notifications`
* **Params**: `status` ("unread" | "read" | "archived" | "all"), `search`.
* **Response**: `{ "notifications": [ ... ] }`

### `POST /api/notifications`
Updates statuses.
* **Payload**: `{ "ids": ["uuid-1", "uuid-2"], "status": "read" }`
* **Response**: `{ "success": true }`

### `POST /api/notifications/read-all`
Marks all notifications read.
* **Response**: `{ "success": true }`

### `DELETE /api/notifications`
Bulk deletes alerts.
* **Payload**: `{ "ids": ["uuid-1"] }`

---

## 5. Metrics & Statuses Endpoints

### `GET /api/workers`
Returns workers and adds active CPU/RAM fluctuation offsets.
* **Response**: `{ "workers": [ ... ] }`

### `GET /api/stats`
Computes dashboard rates, average durations, and chart ticks.
* **Response**: `{ "metrics": { ... }, "workers": { ... }, "charts": [ ... ] }`
