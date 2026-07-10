'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import Navbar from '@/components/navbar';
import MetricsCards from '@/components/metrics-cards';
import StatsCharts from '@/components/stats-charts';
import JobList from '@/components/job-list';
import { useJobStore } from '@/store/use-job-store';
import { useUiStore } from '@/store/use-ui-store';
import { Activity, Clock, Terminal, CheckCircle2, XCircle } from 'lucide-react';

interface StatsData {
  metrics: {
    totalJobs: number;
    completedCount: number;
    failedCount: number;
    runningCount: number;
    averageDuration: number;
    successRate: number;
    failureRate: number;
  };
  workers: {
    idle: number;
    busy: number;
    offline: number;
    total: number;
  };
  charts: Array<{
    time: string;
    succeeded: number;
    failed: number;
    running: number;
  }>;
}

export default function DashboardPage() {
  const jobs = useJobStore((state) => state.jobs);
  const workers = useJobStore((state) => state.workers);
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const setActiveJobDetailsId = useUiStore((state) => state.setActiveJobDetailsId);

  const [stats, setStats] = useState<StatsData | null>(null);

  // Poll metrics data
  useEffect(() => {
    fetchJobs();

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  // Compile a live feed of recent events from the jobs in store
  const getRecentActivity = () => {
    // Collect status changes
    const events: Array<{
      id: string;
      jobId: string;
      jobType: string;
      status: string;
      message: string;
      timestamp: string;
    }> = [];

    // Take recent jobs in store and compile their latest histories
    jobs.slice(0, 10).forEach((job) => {
      // Create a status change event
      let msg = '';
      if (job.status === 'completed') {
        msg = `Job ${job.type} completed successfully.`;
      } else if (job.status === 'failed') {
        msg = `Job ${job.type} failed: ${job.failureReason?.substring(0, 40)}...`;
      } else if (job.status === 'cancelled') {
        msg = `Job ${job.type} was cancelled.`;
      } else {
        msg = `Job ${job.type} is now in state: ${job.status}.`;
      }

      events.push({
        id: `${job.id}-${job.status}`,
        jobId: job.id,
        jobType: job.type,
        status: job.status,
        message: msg,
        timestamp: job.completedAt || job.startedAt || job.createdAt,
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  };

  const activityFeed = getRecentActivity();

  return (
    <DashboardLayout>
      <Navbar title="Dashboard Overview" />

      {/* Main Scrollable Body */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-foreground">
        
        {/* Performance Cards */}
        {stats ? (
          <MetricsCards metrics={stats.metrics} workers={stats.workers} />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg border border-border bg-card" />
            ))}
          </div>
        )}

        {/* Charts & Feed split */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Charts Grid */}
          <div className="lg:col-span-2">
            {stats ? (
              <StatsCharts data={stats.charts} />
            ) : (
              <div className="h-60 rounded-lg border border-border bg-card animate-pulse" />
            )}
          </div>

          {/* Real-time Event Feed */}
          <div className="rounded-lg border border-border bg-card p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-4">
                <Activity className="h-4.5 w-4.5 text-primary" />
                <span>Live Activity Timeline</span>
              </h3>

              <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {activityFeed.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    Waiting for worker activity...
                  </div>
                ) : (
                  activityFeed.map((event) => {
                    const isSuccess = event.status === 'completed';
                    const isFailed = event.status === 'failed';
                    const isCancelled = event.status === 'cancelled';

                    return (
                      <div
                        key={event.id}
                        onClick={() => setActiveJobDetailsId(event.jobId)}
                        className="relative flex flex-col gap-0.5 text-xs cursor-pointer group hover:bg-muted/10 p-1.5 rounded transition-colors"
                      >
                        {/* Event icon dot */}
                        <div
                          className={`absolute -left-5.5 top-2 h-2.5 w-2.5 rounded-full border border-card transition-transform group-hover:scale-125 ${
                            isSuccess
                              ? 'bg-emerald-500'
                              : isFailed
                              ? 'bg-rose-500'
                              : isCancelled
                              ? 'bg-zinc-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground group-hover:underline">
                            {event.jobType}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {event.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="text-[9px] text-muted-foreground pt-3 border-t border-border mt-3">
              Click activity rows to inspect job containers.
            </div>
          </div>
        </div>

        {/* Recent Jobs Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Terminal className="h-4.5 w-4.5" />
            <span>Recent Runs Queue</span>
          </h3>
          <JobList limit={5} />
        </div>

      </main>
    </DashboardLayout>
  );
}
