'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/store/use-ui-store';
import { useJobStore, Job, Log } from '@/store/use-job-store';
import {
  X,
  Play,
  RotateCcw,
  Ban,
  Copy,
  Download,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  Trash2,
} from 'lucide-react';

const STEPS = [
  { status: 'queued', label: 'Queued' },
  { status: 'preparing', label: 'Preparing Workspace' },
  { status: 'worker_assigned', label: 'Worker Assigned' },
  { status: 'running', label: 'Running Environment' },
  { status: 'processing', label: 'Processing Logic' },
  { status: 'aggregating', label: 'Aggregating Results' },
  { status: 'saving', label: 'Saving Artifacts' },
];

export function JobDrawer() {
  const activeJobId = useUiStore((state) => state.activeJobDetailsId);
  const setActiveJobId = useUiStore((state) => state.setActiveJobDetailsId);
  
  const jobs = useJobStore((state) => state.jobs);
  const jobLogs = useJobStore((state) => state.jobLogs);
  const fetchJobDetails = useJobStore((state) => state.fetchJobDetails);
  
  const retryJob = useJobStore((state) => state.retryJob);
  const cancelJob = useJobStore((state) => state.cancelJob);
  const duplicateJob = useJobStore((state) => state.duplicateJob);
  const deleteJob = useJobStore((state) => state.deleteJob);

  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'output'>('overview');
  const [logSearch, setLogSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Get current active job details from store
  const job = jobs.find((j) => j.id === activeJobId) || null;
  const logs = activeJobId ? jobLogs[activeJobId] || [] : [];

  // Fetch full details (logs, history) on mount or job change
  useEffect(() => {
    if (activeJobId) {
      fetchJobDetails(activeJobId);
      // Reset tab when changing jobs
      setActiveTab('overview');
    }
  }, [activeJobId, fetchJobDetails]);

  // Terminal Auto-scroll logic
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, activeTab]);

  if (!activeJobId) return null;

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-job-${activeJobId.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Determine current step index
  const getStepIndex = (status: string) => {
    if (status === 'completed') return 7;
    if (status === 'failed' || status === 'cancelled') return -1;
    return STEPS.findIndex((s) => s.status === status);
  };

  const currentStepIdx = job ? getStepIndex(job.status) : 0;

  // Filter logs locally in terminal
  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.level.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black"
          onClick={() => setActiveJobId(null)}
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ translateX: '100%' }}
          animate={{ translateX: 0 }}
          exit={{ translateX: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl text-foreground sm:max-w-xl"
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded border border-border">
                JOB-{activeJobId.substring(0, 8)}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  job?.status === 'completed'
                    ? 'bg-emerald-500'
                    : job?.status === 'failed'
                    ? 'bg-rose-500'
                    : job?.status === 'cancelled'
                    ? 'bg-zinc-500'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {job?.status || 'loading'}
              </span>
            </div>
            <button
              onClick={() => setActiveJobId(null)}
              className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Action Control Panel */}
          {job && (
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2 text-xs">
              <button
                onClick={() => retryJob(job.id)}
                className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1 font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>

              {['queued', 'preparing', 'worker_assigned', 'running', 'processing', 'aggregating', 'saving'].includes(job.status) && (
                <button
                  onClick={() => cancelJob(job.id)}
                  className="flex items-center gap-1.5 rounded border border-rose-950/20 bg-card px-2.5 py-1 font-medium hover:bg-rose-950/25 transition-colors text-rose-500"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                onClick={() => duplicateJob(job.id)}
                className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1 font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Delete this job?')) {
                    deleteJob(job.id);
                  }
                }}
                className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1 font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors text-muted-foreground ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-border bg-card px-2">
            {(['overview', 'logs', 'output'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {!job ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Job not found or deleted.
              </div>
            ) : (
              <>
                {/* 1. Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Metadata Card */}
                    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Job Type</span>
                          <span className="font-semibold">{job.type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Priority</span>
                          <span className="font-semibold uppercase font-mono">{job.priority}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Worker Assigned</span>
                          <span className="font-semibold font-mono">{job.worker?.name || 'Unassigned'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Progress</span>
                          <span className="font-semibold">{job.progress.toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Created At</span>
                          <span>{new Date(job.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-0.5">Completed At</span>
                          <span>{job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-2">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
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
                    </div>

                    {/* AI Failure Summary Card */}
                    {job.status === 'failed' && (
                      <div className="rounded-lg border border-rose-950/20 bg-rose-500/5 p-4 space-y-3 text-xs">
                        <div className="flex items-start gap-2 text-rose-500 font-bold">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>AI Failure Diagnostics</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Execution Failure:</span>
                          <code className="block rounded bg-rose-500/10 border border-rose-500/10 p-2 font-mono text-[11px] text-rose-600 dark:text-rose-400 break-words">
                            {job.failureReason}
                          </code>
                        </div>
                        {job.failureCauses && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Possible Causes:</span>
                            <ul className="list-disc pl-4 space-y-1">
                              {JSON.parse(job.failureCauses).map((cause: string, i: number) => (
                                <li key={i} className="text-muted-foreground">{cause}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {job.failureFix && (
                          <div className="pt-1">
                            <span className="text-muted-foreground block mb-1">Suggested Developer Fix:</span>
                            <div className="rounded border border-emerald-950/20 bg-emerald-500/5 p-2.5 text-emerald-600 dark:text-emerald-400">
                              {job.failureFix}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => retryJob(job.id)}
                          className="flex w-full items-center justify-center gap-1.5 rounded bg-rose-500 px-3 py-1.5 font-semibold text-white hover:bg-rose-600 transition-colors mt-2"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Quick Re-run with Suggestion</span>
                        </button>
                      </div>
                    )}

                    {/* Stepper Timeline */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution Stepper</h3>
                      <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                        {/* Custom steps based on terminal state */}
                        {job.status === 'cancelled' && (
                          <div className="relative flex items-start gap-3 text-xs">
                            <div className="absolute -left-5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-zinc-500 text-white">
                              <Ban className="h-3 w-3" />
                            </div>
                            <div className="font-semibold text-zinc-500">Job Cancelled by Operator</div>
                          </div>
                        )}

                        {job.status === 'failed' && (
                          <div className="relative flex items-start gap-3 text-xs">
                            <div className="absolute -left-5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-white">
                              <AlertTriangle className="h-3 w-3" />
                            </div>
                            <div className="font-semibold text-rose-500">Job Terminated with Errors</div>
                          </div>
                        )}

                        {job.status === 'completed' && (
                          <div className="relative flex items-start gap-3 text-xs">
                            <div className="absolute -left-5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <CheckCircle className="h-3 w-3" />
                            </div>
                            <div className="font-semibold text-emerald-500">Execution Completed Successfully</div>
                          </div>
                        )}

                        {STEPS.map((step, idx) => {
                          const isDone = currentStepIdx > idx || job.status === 'completed';
                          const isCurrent = currentStepIdx === idx;
                          
                          return (
                            <div key={step.status} className="relative flex items-start gap-3 text-xs">
                              <div
                                className={`absolute -left-5 flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                                  isDone
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : isCurrent
                                    ? 'border-primary bg-card text-primary'
                                    : 'border-border bg-card text-muted-foreground'
                                }`}
                              >
                                {isDone ? (
                                  <span className="text-[8px] font-bold">✓</span>
                                ) : (
                                  <span className="text-[8px]">{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`font-medium ${
                                  isCurrent
                                    ? 'text-foreground font-semibold'
                                    : isDone
                                    ? 'text-muted-foreground'
                                    : 'text-muted-foreground/60'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Logs Tab (Terminal Console) */}
                {activeTab === 'logs' && (
                  <div className="flex h-full flex-col space-y-2">
                    {/* Log Terminal Control Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-muted/40 p-2 rounded-t-lg">
                      <div className="relative max-w-[200px]">
                        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search logs..."
                          className="h-7 w-full rounded border border-border bg-card pl-7 pr-2 text-xxs outline-none"
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAutoScroll(!autoScroll)}
                          className={`rounded border px-2 py-0.5 text-xxs font-semibold transition-colors ${
                            autoScroll
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border text-muted-foreground'
                          }`}
                        >
                          {autoScroll ? 'Lock Scroll' : 'Scroll Free'}
                        </button>
                        <button
                          onClick={handleCopyLogs}
                          className="rounded border border-border bg-card p-1 text-muted-foreground hover:text-foreground"
                          title="Copy Logs"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={handleDownloadLogs}
                          className="rounded border border-border bg-card p-1 text-muted-foreground hover:text-foreground"
                          title="Download Logs"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Console Screen */}
                    <div
                      ref={terminalContainerRef}
                      className="terminal-scrollbar h-[350px] overflow-y-auto rounded-b-lg border-x border-b border-border bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300"
                    >
                      {filteredLogs.length === 0 ? (
                        <div className="text-zinc-500 text-center py-12">
                          {logSearch ? 'No matching logs.' : 'Streaming console initialization...'}
                        </div>
                      ) : (
                        filteredLogs.map((log) => {
                          const levelColors =
                            log.level === 'error'
                              ? 'text-rose-400'
                              : log.level === 'warn'
                              ? 'text-amber-400'
                              : log.level === 'debug'
                              ? 'text-purple-400'
                              : 'text-emerald-400';

                          return (
                            <div key={log.id} className="leading-5 hover:bg-zinc-900/60 px-1 py-0.5 rounded transition-colors">
                              <span className="text-zinc-600 select-none mr-2">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <span className={`font-bold uppercase tracking-wider mr-2 text-[9px] ${levelColors}`}>
                                [{log.level}]
                              </span>
                              <span className="text-zinc-200">{log.message}</span>
                            </div>
                          );
                        })
                      )}
                      <div ref={terminalEndRef} />
                    </div>
                    {isCopied && (
                      <span className="text-xxs text-emerald-500 text-right block pr-1">Logs Copied!</span>
                    )}
                  </div>
                )}

                {/* 3. Output Tab */}
                {activeTab === 'output' && (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-4 w-4" />
                        <span>Execution Results Payload</span>
                      </span>
                    </div>
                    
                    {job.output ? (
                      <pre className="overflow-x-auto rounded bg-muted/60 border border-border p-3 font-mono text-xxs leading-relaxed custom-scrollbar">
                        {JSON.stringify(JSON.parse(job.output), null, 2)}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        {job.status === 'failed'
                          ? 'No output. Job aborted due to runtime errors.'
                          : 'Execution pending output completion.'}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export default JobDrawer;
