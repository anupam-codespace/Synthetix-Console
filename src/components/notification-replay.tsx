'use client';

import { useEffect, useState, useRef } from 'react';
import { useUiStore } from '@/store/use-ui-store';
import { useJobStore, Job, Log, JobHistory } from '@/store/use-job-store';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Terminal,
  Activity,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export function NotificationReplay() {
  const replayJobId = useUiStore((state) => state.activeNotificationReplayJobId);
  const setReplayJobId = useUiStore((state) => state.setActiveNotificationReplayJobId);

  const fetchJobDetails = useJobStore((state) => state.fetchJobDetails);

  const [job, setJob] = useState<Job | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch job full details on open
  useEffect(() => {
    if (replayJobId) {
      fetchJobDetails(replayJobId).then((data) => {
        if (data) {
          setJob(data);
          setCurrentStepIdx(0);
          setIsPlaying(true);
        }
      });
    } else {
      setJob(null);
      setIsPlaying(false);
    }
  }, [replayJobId, fetchJobDetails]);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying && job) {
      const stepsCount = (job.history?.length || 0);
      
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= stepsCount - 1) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, job, playbackSpeed]);

  if (!replayJobId || !job) return null;

  const history = job.history || [];
  const logs = job.logs || [];
  const currentHistoryItem = history[currentStepIdx] || null;

  // Filter logs that occurred BEFORE or AT the current history item timestamp
  const getVisibleLogs = () => {
    if (!currentHistoryItem) return [];
    const limitTime = new Date(currentHistoryItem.changedAt).getTime();
    return logs.filter((log) => new Date(log.timestamp).getTime() <= limitTime);
  };

  const visibleLogs = getVisibleLogs();

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
    setTimeout(() => setIsPlaying(true), 50);
  };

  const handleSpeedToggle = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1500) return 600; // 2.5x speed
      if (prev === 600) return 200; // 7.5x speed
      return 1500; // 1x speed
    });
  };

  const getSpeedLabel = () => {
    if (playbackSpeed === 1500) return '1.0x';
    if (playbackSpeed === 600) return '2.5x';
    return '7.5x';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-2xl text-foreground">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight">Notification Replay Player</h2>
            <span className="text-xxs font-mono bg-muted px-2 py-0.5 rounded border border-border">
              JOB-{job.id.substring(0, 8)}
            </span>
          </div>
          <button
            onClick={() => setReplayJobId(null)}
            className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Animation Scrubber & Stepper Area */}
        <div className="mb-6 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between text-xs mb-3 font-semibold text-muted-foreground">
            <span>Execution Lifecycle Timeline</span>
            <span className="font-mono">
              Step {currentStepIdx + 1} / {history.length}
            </span>
          </div>

          {/* Progress timeline line */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="absolute left-0 right-0 h-0.5 bg-border top-2.5 z-0" />
            <div
              className="absolute left-0 h-0.5 bg-primary top-2.5 z-0 transition-all duration-300"
              style={{
                width: `${(currentStepIdx / Math.max(1, history.length - 1)) * 100}%`,
              }}
            />

            {history.map((step, idx) => {
              const isPassed = currentStepIdx > idx;
              const isActive = currentStepIdx === idx;
              const isLast = idx === history.length - 1;
              const isFailed = step.status === 'failed';

              let nodeColor = 'bg-card border-border text-muted-foreground';
              if (isPassed) {
                nodeColor = 'bg-primary border-primary text-primary-foreground';
              } else if (isActive) {
                nodeColor = isFailed
                  ? 'bg-rose-500 border-rose-500 text-white'
                  : 'bg-card border-primary text-primary ring-2 ring-primary/20';
              }

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold transition-all ${nodeColor}`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-[9px] font-semibold tracking-tight absolute top-5 whitespace-nowrap ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Current Step Description Card */}
          <div className="mt-8 rounded border border-border bg-card p-3 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold uppercase tracking-wider text-xxs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                Current Status
              </span>
              <span className="font-mono text-muted-foreground">
                {currentHistoryItem ? new Date(currentHistoryItem.changedAt).toLocaleTimeString() : ''}
              </span>
            </div>
            <p className="font-medium text-foreground">
              {currentHistoryItem ? currentHistoryItem.message : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Live Replay Console Screen */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
            <Terminal className="h-4 w-4" />
            <span>Replay Terminal Logs Feed</span>
          </div>
          
          <div className="h-[180px] overflow-y-auto rounded-lg border border-border bg-zinc-950 p-3 font-mono text-[10px] text-zinc-300 terminal-scrollbar">
            {visibleLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-12">
                No logs recorded yet at this lifecycle stage.
              </div>
            ) : (
              visibleLogs.map((log) => {
                const levelColors =
                  log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'warn'
                    ? 'text-amber-400'
                    : log.level === 'debug'
                    ? 'text-purple-400'
                    : 'text-emerald-400';

                return (
                  <div key={log.id} className="leading-4.5">
                    <span className="text-zinc-600 mr-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`font-bold mr-1.5 uppercase ${levelColors}`}>
                      [{log.level}]
                    </span>
                    <span>{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart</span>
          </button>

          <button
            onClick={handleSpeedToggle}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>Speed: {getSpeedLabel()}</span>
          </button>

          {/* Playback Outcome badge */}
          {!isPlaying && currentStepIdx === history.length - 1 && (
            <div className="ml-auto flex items-center gap-1 text-xs font-bold font-mono">
              {job.status === 'completed' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500 uppercase">Success Outcome</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <span className="text-rose-500 uppercase">Failure Outcome</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default NotificationReplay;
