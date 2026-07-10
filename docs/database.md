# Database Design Guide

This document describes the schema design, field constraints, relationships, and seed data models of the **Synthetix Console** relational database.

---

## 1. Schema Modeling

```
  +--------------+               +------------------+
  |    User      | 1 --------- 1 |    Preference    |
  +--------------+               +------------------+
         | 1
         |
         | *
  +--------------+               +------------------+
  |     Job      | * --------- 0 |      Worker      |
  +--------------+               +------------------+
    1 |     | 1
      |     +------------+
      | *                | *
  +--------------+  +--------------+
  |     Log      |  |  JobHistory  |
  +--------------+  +--------------+
```

---

## 2. Table Schemas

### `User`
Stores registration credentials and operator identities.
* `id` (UUID string, Primary Key)
* `email` (string, unique Index)
* `name` (string, optional)
* `passwordHash` (string, hashed password)
* `createdAt` (DateTime)

### `Preference`
Stores dashboard layout preferences. Cascades delete on `User` deletion.
* `id` (UUID string, Primary Key)
* `userId` (string, unique Index, Foreign Key -> User)
* `theme` (string, defaults to "dark")
* `savedFilters` (JSON string serialized filter criteria array)

### `Worker`
Stores state of individual node clusters in the compute pool.
* `id` (UUID string, Primary Key)
* `name` (string, unique)
* `status` (string, "idle" | "busy" | "offline")
* `cpu` (float percentage)
* `memory` (float percentage)
* `jobsActive` (integer)
* `jobsCompleted` (integer)
* `lastSeen` (DateTime)

### `Job`
Details of AI training / ingestion executions.
* `id` (UUID string, Primary Key)
* `ownerId` (string, Foreign Key -> User)
* `workerId` (string, optional, Foreign Key -> Worker)
* `priority` (string, "low" | "medium" | "high" | "critical")
* `status` (string, "queued" | "preparing" | "worker_assigned" | "running" | "processing" | "aggregating" | "saving" | "completed" | "failed" | "cancelled")
* `progress` (float, 0.0 to 100.0)
* `type` (string, e.g. "model_training")
* `createdAt` (DateTime)
* `startedAt` (DateTime, optional)
* `completedAt` (DateTime, optional)
* `failureReason` (string, optional)
* `failureFix` (string, optional)
* `failureCauses` (JSON string array, optional)
* `output` (JSON string of results, optional)

### `Log`
Log outputs streamed by active jobs. Cascades on `Job` deletion.
* `id` (UUID string, Primary Key)
* `jobId` (string, Foreign Key -> Job)
* `timestamp` (DateTime)
* `level` (string, "info" | "warn" | "error" | "debug")
* `message` (string)

### `JobHistory`
Timeline logs of state transitions. Cascades on `Job` deletion.
* `id` (UUID string, Primary Key)
* `jobId` (string, Foreign Key -> Job)
* `status` (string, status transitioned to)
* `changedAt` (DateTime)
* `message` (string explanation)

### `Notification`
Operator alerts for state updates.
* `id` (UUID string, Primary Key)
* `userId` (string, Foreign Key -> User)
* `title` (string)
* `message` (string)
* `type` (string, "job_status" | "worker_status" | "system_alert")
* `status` (string, "unread" | "read" | "archived")
* `jobId` (string, optional)
* `groupKey` (string, optional, used for smart collapsing groupings)
