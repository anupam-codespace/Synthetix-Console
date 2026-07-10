'use client';

import { useState, useEffect } from 'react';
import { useJobStore, Job } from '@/store/use-job-store';
import { useUiStore } from '@/store/use-ui-store';
import { useShortcuts } from '@/hooks/use-shortcuts';
import {
  Play,
  RotateCcw,
  Ban,
  Copy,
  Trash2,
  Eye,
  User,
  Clock,
  Cpu,
} from 'lucide-react';

interface JobListProps {
  limit?: number;
}

export function JobList({ limit }: JobListProps) {
  const jobs = useJobStore((state) => state.jobs);
  const retryJob = useJobStore((state) => state.retryJob);
  const cancelJob = useJobStore((state) => state.cancelJob);
  const duplicateJob = useJobStore((state) => state.duplicateJob);
  const deleteJob = useJobStore((state) => state.deleteJob);
  
  const activeJobId = useUiStore((state) => state.activeJobDetailsId);
  const setActiveJobDetailsId = useUiStore((state) => state.setActiveJobDetailsId);

  const [focusedIdx, setFocusedIdx] = useState<number>(-1);

  const displayedJobs = limit ? jobs.slice(0, limit) : jobs;

  // Bind Vim key navigation controls
  useShortcuts({
    j: () => {
      if (displayedJobs.length === 0) return;
      setFocusedIdx((prev) => (prev < displayedJobs.length - 1 ? prev + 1 : prev));
    },
    k: () => {
      if (displayedJobs.length === 0) return;
      setFocusedIdx((prev) => (prev > 0 ? prev - 1 : 0));
    },
    Enter: () => {
      if (focusedIdx >= 0 && displayedJobs[focusedIdx]) {
        setActiveJobDetailsId(displayedJobs[focusedIdx].id);
      }
    },
    r: () => {
      if (focusedIdx >= 0 && displayedJobs[focusedIdx]) {
        const target = displayedJobs[focusedIdx];
        if (target.status === 'failed' || target.status === 'completed') {
          retryJob(target.id);
        }
      }
    },
  });

  // Reset focus when jobs list changes
  useEffect(() => {
    if (focusedIdx >= displayedJobs.length) {
      setFocusedIdx(displayedJobs.length - 1);
    }
  }, [displayedJobs, focusedIdx]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'cancelled':
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      case 'queued':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-rose-500 font-bold';
      case 'high':
        return 'text-orange-500 font-semibold';
      case 'medium':
        return 'text-blue-500';
      default:
        return 'text-zinc-500';
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-left text-xs text-foreground">
          <thead className="bg-muted/40 border-b border-border text-xxs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Job ID</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Priority</th>
              <th className="px-4 py-2.5">Progress</th>
              <th className="px-4 py-2.5">Worker</th>
              <th className="px-4 py-2.5">Duration</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedJobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  No jobs found matching criteria.
                </td>
              </tr>
            ) : (
              displayedJobs.map((job, idx) => {
                const isFocused = idx === focusedIdx;
                const isActive = activeJobId === job.id;
                const isRunning = ['queued', 'preparing', 'worker_assigned', 'running', 'processing', 'aggregating', 'saving'].includes(job.status);

                return (
                  <tr
                    key={job.id}
                    onClick={() => setFocusedIdx(idx)}
                    className={`transition-colors group ${
                      isActive
                        ? 'bg-muted/60'
                        : isFocused
                        ? 'bg-muted/30 outline-none ring-1 ring-inset ring-primary/30'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    {/* ID */}
                    <td className="px-4 py-2.5 font-mono text-muted-foreground select-all">
                      {job.id.substring(0, 8)}
                    </td>
                    
                    {/* Type */}
                    <td className="px-4 py-2.5 font-semibold">
                      {job.type}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xxs font-semibold uppercase tracking-wider ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-2.5 uppercase font-semibold font-mono tracking-tight">
                      <span className={getPriorityColor(job.priority)}>
                        {job.priority}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-2.5 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-mono">{job.progress.toFixed(0)}%</span>
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden flex-1 max-w-[80px]">
                          <div
                            className={`h-full transition-all duration-300 ${
                              job.status === 'completed'
                                ? 'bg-emerald-500'
                                : job.status === 'failed'
                                ? 'bg-rose-500'
                                : job.status === 'cancelled'
                                ? 'bg-zinc-500'
                                : 'bg-primary'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Worker */}
                    <td className="px-4 py-2.5 font-mono text-muted-foreground flex items-center gap-1.5 pt-3.5">
                      <Cpu className="h-3 w-3 shrink-0" />
                      <span>{job.worker?.name || 'Unassigned'}</span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {job.completedAt && job.startedAt ? (
                        <span>
                          {((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000).toFixed(1)}s
                        </span>
                      ) : (
                        <span>Est: {job.estimatedDuration}s</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setActiveJobDetailsId(job.id)}
                          className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        
                        {isRunning ? (
                          <button
                            onClick={() => cancelJob(job.id)}
                            className="rounded p-1 hover:bg-rose-950/20 text-rose-500 transition-colors"
                            title="Cancel Job"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => retryJob(job.id)}
                            className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="Retry Job"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => duplicateJob(job.id)}
                          className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Duplicate Job"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('Delete this job?')) {
                              deleteJob(job.id);
                            }
                          }}
                          className="rounded p-1 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {focusedIdx >= 0 && displayedJobs[focusedIdx] && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2 text-[10px] text-muted-foreground">
          <span>Row focus: J / K navigate, Enter inspects selected job, R retries selected.</span>
          <span>Job ID: {displayedJobs[focusedIdx].id}</span>
        </div>
      )}
    </div>
  );
}
export default JobList;
