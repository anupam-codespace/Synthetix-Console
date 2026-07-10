'use client';

import { CheckCircle2, XCircle, Clock, Activity, Cpu } from 'lucide-react';

interface Metrics {
  totalJobs: number;
  completedCount: number;
  failedCount: number;
  runningCount: number;
  averageDuration: number;
  successRate: number;
  failureRate: number;
}

interface WorkersCount {
  idle: number;
  busy: number;
  offline: number;
  total: number;
}

export function MetricsCards({ metrics, workers }: { metrics: Metrics; workers: WorkersCount }) {
  const cards = [
    {
      title: 'Success Rate',
      value: `${metrics.successRate}%`,
      description: `${metrics.completedCount} of ${metrics.completedCount + metrics.failedCount} jobs succeeded`,
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Failure Rate',
      value: `${metrics.failureRate}%`,
      description: `${metrics.failedCount} jobs terminated with errors`,
      icon: XCircle,
      color: 'text-rose-500',
    },
    {
      title: 'Average Duration',
      value: `${metrics.averageDuration}s`,
      description: 'Mean runtime across completed runs',
      icon: Clock,
      color: 'text-sky-500',
    },
    {
      title: 'Active Runs',
      value: `${metrics.runningCount}`,
      description: 'Active tasks in processing pipeline',
      icon: Activity,
      color: 'text-amber-500',
    },
    {
      title: 'Active Workers',
      value: `${workers.busy}/${workers.total}`,
      description: `${workers.idle} idle, ${workers.offline} offline nodes`,
      icon: Cpu,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.title} className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{card.title}</span>
              <Icon className={`h-4.5 w-4.5 ${card.color}`} />
            </div>
            <div className="text-xl font-bold tracking-tight mt-1">{card.value}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
export default MetricsCards;
