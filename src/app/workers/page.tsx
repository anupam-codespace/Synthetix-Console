'use client';

import DashboardLayout from '@/components/dashboard-layout';
import Navbar from '@/components/navbar';
import { useJobStore } from '@/store/use-job-store';
import { Cpu, Server, Activity, CheckCircle, Database } from 'lucide-react';

export default function WorkersPage() {
  const workers = useJobStore((state) => state.workers);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'busy':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-emerald-500';
      case 'busy':
        return 'bg-sky-500';
      default:
        return 'bg-zinc-500';
    }
  };

  return (
    <DashboardLayout>
      <Navbar title="Worker Node Clusters" />

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-foreground">
        
        {/* Header Summary */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Server className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Active Node Clusters</h2>
              <p className="text-xs text-muted-foreground">
                Currently tracking {workers.length} nodes across available compute zones.
              </p>
            </div>
          </div>
        </div>

        {/* Workers Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="rounded-lg border border-border bg-card p-4 space-y-4 text-xs shadow-sm flex flex-col justify-between"
            >
              {/* Header: Name & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{worker.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {worker.id.substring(0, 8)}</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xxs font-semibold uppercase tracking-wider ${getStatusColor(worker.status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(worker.status)}`} />
                  <span>{worker.status}</span>
                </span>
              </div>

              {/* Metrics: CPU & Memory */}
              {worker.status !== 'offline' ? (
                <div className="space-y-2.5">
                  {/* CPU Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-muted-foreground">CPU Core Load</span>
                      <span className="font-bold">{worker.cpu.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          worker.cpu > 80
                            ? 'bg-rose-500'
                            : worker.cpu > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${worker.cpu}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-muted-foreground">VRAM / RAM Memory</span>
                      <span className="font-bold">{worker.memory.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          worker.memory > 80
                            ? 'bg-rose-500'
                            : worker.memory > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${worker.memory}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded bg-muted/40 py-6 text-center text-muted-foreground/60 border border-dashed border-border font-mono text-[11px]">
                  Server offline (No connection)
                </div>
              )}

              {/* Stats: Jobs active / completed */}
              <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-center text-[10px]">
                <div className="bg-muted/30 rounded p-1.5 border border-border">
                  <span className="text-muted-foreground block">Active Runs</span>
                  <span className="font-bold text-sm font-mono mt-0.5 block">{worker.jobsActive}</span>
                </div>
                <div className="bg-muted/30 rounded p-1.5 border border-border">
                  <span className="text-muted-foreground block">Completed</span>
                  <span className="font-bold text-sm font-mono mt-0.5 block">{worker.jobsCompleted}</span>
                </div>
              </div>

              {/* Footer: Last Seen */}
              <div className="text-[9px] text-muted-foreground font-mono text-center pt-2 border-t border-border/40">
                Last Heartbeat: {new Date(worker.lastSeen).toLocaleTimeString()}
              </div>

            </div>
          ))}
        </div>

      </main>
    </DashboardLayout>
  );
}
