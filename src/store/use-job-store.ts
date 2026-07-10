import { create } from 'zustand';

export interface Worker {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'offline';
  cpu: number;
  memory: number;
  jobsActive: number;
  jobsCompleted: number;
  lastSeen: string;
}

export interface Log {
  id: string;
  jobId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface JobHistory {
  id: string;
  jobId: string;
  status: string;
  changedAt: string;
  message: string;
}

export interface Job {
  id: string;
  ownerId: string;
  workerId: string | null;
  worker?: Worker | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'preparing' | 'worker_assigned' | 'running' | 'processing' | 'aggregating' | 'saving' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  type: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedDuration: number;
  failureReason: string | null;
  failureFix: string | null;
  failureCauses: string | null; // JSON string
  output: string | null; // JSON string
  logs?: Log[];
  history?: JobHistory[];
  owner?: { name: string | null; email: string };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_status' | 'worker_status' | 'system_alert';
  status: 'unread' | 'read' | 'archived';
  jobId: string | null;
  createdAt: string;
  groupKey: string | null;
}

interface JobStore {
  jobs: Job[];
  workers: Worker[];
  notifications: Notification[];
  unreadNotificationsCount: number;
  jobLogs: Record<string, Log[]>; // jobId -> Log[]
  activeJobId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  eventSource: EventSource | null;

  // Actions
  setJobs: (jobs: Job[]) => void;
  setWorkers: (workers: Worker[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setActiveJobId: (id: string | null) => void;
  
  // APIs
  fetchJobs: (filters?: { status?: string; priority?: string; type?: string; search?: string }) => Promise<void>;
  fetchJobDetails: (jobId: string) => Promise<Job | null>;
  fetchNotifications: (status?: string, search?: string) => Promise<void>;
  
  createJob: (type: string, priority: string, estimatedDuration: number) => Promise<boolean>;
  retryJob: (jobId: string) => Promise<boolean>;
  cancelJob: (jobId: string) => Promise<boolean>;
  duplicateJob: (jobId: string) => Promise<boolean>;
  deleteJob: (jobId: string) => Promise<boolean>;
  
  markNotifications: (ids: string[], status: 'unread' | 'read' | 'archived') => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  
  // Realtime
  connectSSE: () => void;
  disconnectSSE: () => void;
}

export const useJobStore = create<JobStore>((set, get) => {
  return {
    jobs: [],
    workers: [],
    notifications: [],
    unreadNotificationsCount: 0,
    jobLogs: {},
    activeJobId: null,
    isConnecting: false,
    isConnected: false,
    eventSource: null,

    setJobs: (jobs) => set({ jobs }),
    setWorkers: (workers) => set({ workers }),
    setNotifications: (notifications) => set({ notifications }),
    setActiveJobId: (activeJobId) => set({ activeJobId }),

    fetchJobs: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.set('status', filters.status);
        if (filters.priority) queryParams.set('priority', filters.priority);
        if (filters.type) queryParams.set('type', filters.type);
        if (filters.search) queryParams.set('search', filters.search);

        const res = await fetch(`/api/jobs?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          set({ jobs: data.jobs });
        }
      } catch (err) {
        console.error('fetchJobs error:', err);
      }
    },

    fetchJobDetails: async (jobId) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.job?.logs) {
            set((state) => ({
              jobLogs: { ...state.jobLogs, [jobId]: data.job.logs }
            }));
          }
          return data.job;
        }
      } catch (err) {
        console.error('fetchJobDetails error:', err);
      }
      return null;
    },

    fetchNotifications: async (status = 'unread', search = '') => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('status', status);
        if (search) queryParams.set('search', search);

        const res = await fetch(`/api/notifications?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          set({ notifications: data.notifications });
        }
      } catch (err) {
        console.error('fetchNotifications error:', err);
      }
    },

    createJob: async (type, priority, estimatedDuration) => {
      try {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, priority, estimatedDuration })
        });
        if (res.ok) {
          get().fetchJobs();
          return true;
        }
      } catch (err) {
        console.error('createJob error:', err);
      }
      return false;
    },

    retryJob: async (jobId) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
        if (res.ok) {
          set((state) => {
            const nextLogs = { ...state.jobLogs };
            delete nextLogs[jobId];
            return { jobLogs: nextLogs };
          });
          get().fetchJobs();
          return true;
        }
      } catch (err) {
        console.error('retryJob error:', err);
      }
      return false;
    },

    cancelJob: async (jobId) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
        if (res.ok) {
          get().fetchJobs();
          return true;
        }
      } catch (err) {
        console.error('cancelJob error:', err);
      }
      return false;
    },

    duplicateJob: async (jobId) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/duplicate`, { method: 'POST' });
        if (res.ok) {
          get().fetchJobs();
          return true;
        }
      } catch (err) {
        console.error('duplicateJob error:', err);
      }
      return false;
    },

    deleteJob: async (jobId) => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
        if (res.ok) {
          set((state) => ({
            jobs: state.jobs.filter((j) => j.id !== jobId),
            activeJobId: state.activeJobId === jobId ? null : state.activeJobId
          }));
          return true;
        }
      } catch (err) {
        console.error('deleteJob error:', err);
      }
      return false;
    },

    markNotifications: async (ids, status) => {
      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, status })
        });
        if (res.ok) {
          set((state) => {
            const nextNotifications = state.notifications.map((n) =>
              ids.includes(n.id) ? { ...n, status } : n
            );
            const deltaUnread = ids.reduce((acc, id) => {
              const item = state.notifications.find((n) => n.id === id);
              if (item && item.status === 'unread' && status !== 'unread') return acc + 1;
              if (item && item.status !== 'unread' && status === 'unread') return acc - 1;
              return acc;
            }, 0);
            return {
              notifications: nextNotifications.filter(n => n.status !== 'archived'),
              unreadNotificationsCount: Math.max(0, state.unreadNotificationsCount - deltaUnread)
            };
          });
        }
      } catch (err) {
        console.error('markNotifications error:', err);
      }
    },

    markAllNotificationsRead: async () => {
      try {
        const res = await fetch('/api/notifications/read-all', { method: 'POST' });
        if (res.ok) {
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, status: 'read' })),
            unreadNotificationsCount: 0
          }));
        }
      } catch (err) {
        console.error('markAllNotificationsRead error:', err);
      }
    },

    connectSSE: () => {
      const state = get();
      if (state.eventSource || state.isConnecting) return;

      set({ isConnecting: true });

      const es = new EventSource('/api/events');

      es.onopen = () => {
        set({ isConnected: true, isConnecting: false, eventSource: es });
      };

      es.addEventListener('sync', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          set((state) => {
            const sseJobs = data.jobs as Job[];
            const currentJobsMap = new Map(state.jobs.map(j => [j.id, j]));
            sseJobs.forEach(j => currentJobsMap.set(j.id, j));
            const mergedJobs = Array.from(currentJobsMap.values())
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const sseLogs = data.logs as Log[];
            const nextJobLogs = { ...state.jobLogs };
            sseLogs.forEach((log) => {
              const list = nextJobLogs[log.jobId] || [];
              if (!list.some((l) => l.id === log.id)) {
                nextJobLogs[log.jobId] = [...list, log].sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
              }
            });

            return {
              jobs: mergedJobs,
              workers: data.workers,
              unreadNotificationsCount: data.unreadNotificationsCount,
              jobLogs: nextJobLogs
            };
          });
        } catch (err) {
          console.error('SSE sync message parse error:', err);
        }
      });

      es.onerror = () => {
        set({ isConnected: false, isConnecting: false });
        es.close();
        
        setTimeout(() => {
          if (!get().isConnected) {
            get().connectSSE();
          }
        }, 3000);
      };
    },

    disconnectSSE: () => {
      const { eventSource } = get();
      if (eventSource) {
        eventSource.close();
        set({ eventSource: null, isConnected: false, isConnecting: false });
      }
    }
  };
});
