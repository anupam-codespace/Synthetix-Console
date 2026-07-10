'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import Navbar from '@/components/navbar';
import JobList from '@/components/job-list';
import { useJobStore } from '@/store/use-job-store';
import { Plus, Search, Filter, Play } from 'lucide-react';

export default function JobsPage() {
  const fetchJobs = useJobStore((state) => state.fetchJobs);
  const createJob = useJobStore((state) => state.createJob);
  const jobs = useJobStore((state) => state.jobs);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Spawn Job Modal States
  const [isSpawnOpen, setIsSpawnOpen] = useState(false);
  const [spawnType, setSpawnType] = useState('model_training');
  const [spawnPriority, setSpawnPriority] = useState('medium');
  const [spawnDuration, setSpawnDuration] = useState('30');
  const [spawnLoading, setSpawnLoading] = useState(false);

  // Sync jobs list on filter change
  useEffect(() => {
    fetchJobs({
      status: statusFilter,
      priority: priorityFilter,
      type: typeFilter,
      search: searchQuery,
    });
  }, [statusFilter, priorityFilter, typeFilter, searchQuery, fetchJobs]);

  const handleSpawnJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpawnLoading(true);
    try {
      const success = await createJob(spawnType, spawnPriority, parseInt(spawnDuration, 10));
      if (success) {
        setIsSpawnOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSpawnLoading(false);
    }
  };

  // Compile unique job types from existing jobs in store for filters
  const jobTypes = Array.from(new Set(jobs.map((j) => j.type)));

  return (
    <DashboardLayout>
      <Navbar title="Jobs Queue Management" />

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-foreground">
        
        {/* Top bar: Spawn trigger & filters */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          
          {/* Advanced Filter Widgets Grid */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search jobs..."
                className="h-8 w-[160px] rounded border border-border bg-card pl-8 pr-2 text-xxs outline-none focus:border-primary transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="h-8 rounded border border-border bg-card px-2 text-xxs outline-none cursor-pointer focus:border-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Priority Filter */}
            <select
              className="h-8 rounded border border-border bg-card px-2 text-xxs outline-none cursor-pointer focus:border-primary"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Job Type Filter */}
            <select
              className="h-8 rounded border border-border bg-card px-2 text-xxs outline-none cursor-pointer focus:border-primary"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {jobTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger button */}
          <button
            onClick={() => setIsSpawnOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Spawn Job</span>
          </button>
        </div>

        {/* Complete Jobs Grid */}
        <JobList />

      </main>

      {/* Spawn Job Modal Dialog */}
      {isSpawnOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-xl text-foreground">
            
            {/* Header */}
            <h2 className="text-sm font-bold tracking-tight mb-4 flex items-center gap-2">
              <Play className="h-4.5 w-4.5 text-emerald-500" />
              <span>Configure & Run New Job</span>
            </h2>

            <form onSubmit={handleSpawnJob} className="space-y-4 text-xs">
              {/* Job Type */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold uppercase tracking-wider text-muted-foreground">Job Type</label>
                <select
                  className="h-9 w-full rounded border border-border bg-card px-3 outline-none"
                  value={spawnType}
                  onChange={(e) => setSpawnType(e.target.value)}
                >
                  <option value="model_training">Model Training Simulation</option>
                  <option value="data_ingestion">Data Ingestion ETL Stream</option>
                  <option value="sentiment_analysis">Sentiment NLP Analyzer</option>
                  <option value="image_processing">Image Compression Pipeline</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                <select
                  className="h-9 w-full rounded border border-border bg-card px-3 outline-none"
                  value={spawnPriority}
                  onChange={(e) => setSpawnPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>
              </div>

              {/* Estimated Duration */}
              <div className="space-y-1.5">
                <label className="text-xxs font-bold uppercase tracking-wider text-muted-foreground">Est. Duration (seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  className="h-9 w-full rounded border border-border bg-card px-3 outline-none"
                  value={spawnDuration}
                  onChange={(e) => setSpawnDuration(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSpawnOpen(false)}
                  className="flex-1 rounded border border-border bg-card py-2 font-semibold hover:bg-muted transition-colors text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={spawnLoading}
                  className="flex-1 rounded bg-primary py-2 font-semibold text-primary-foreground hover:bg-primary/95 transition-colors disabled:opacity-50"
                >
                  {spawnLoading ? 'Starting...' : 'Spawn & Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
