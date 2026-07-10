'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/store/use-ui-store';
import { useJobStore } from '@/store/use-job-store';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { Search, Terminal, Navigation, Bell, Sun } from 'lucide-react';

interface PaletteItem {
  id: string;
  category: 'Commands' | 'Jobs' | 'Notifications';
  title: string;
  subtitle?: string;
  action: () => void;
  icon: any;
}

export function CommandPalette() {
  const router = useRouter();
  const isOpen = useUiStore((state) => state.isCommandPaletteOpen);
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  
  const jobs = useJobStore((state) => state.jobs);
  const notifications = useJobStore((state) => state.notifications);
  const createJob = useJobStore((state) => state.createJob);
  const markAllRead = useJobStore((state) => state.markAllNotificationsRead);
  const setActiveJobDetailsId = useUiStore((state) => state.setActiveJobDetailsId);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Bind command palette hotkeys
  useShortcuts({
    'mod+k': () => {
      setOpen(!isOpen);
      setQuery('');
      setSelectedIndex(0);
    },
    Escape: () => {
      if (isOpen) {
        setOpen(false);
        setQuery('');
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Static macros
  const commands: PaletteItem[] = [
    {
      id: 'cmd-dash',
      category: 'Commands',
      title: 'Navigate to Dashboard',
      subtitle: 'View overall system metrics and graphs',
      icon: Navigation,
      action: () => { router.push('/dashboard'); setOpen(false); }
    },
    {
      id: 'cmd-jobs',
      category: 'Commands',
      title: 'Navigate to Jobs',
      subtitle: 'View complete execution details and filters',
      icon: Navigation,
      action: () => { router.push('/jobs'); setOpen(false); }
    },
    {
      id: 'cmd-notif',
      category: 'Commands',
      title: 'Navigate to Notifications',
      subtitle: 'Manage unread alert logs and replays',
      icon: Navigation,
      action: () => { router.push('/notifications'); setOpen(false); }
    },
    {
      id: 'cmd-work',
      category: 'Commands',
      title: 'Navigate to Workers',
      subtitle: 'Inspect server node GPU/CPU loads',
      icon: Navigation,
      action: () => { router.push('/workers'); setOpen(false); }
    },
    {
      id: 'cmd-theme',
      category: 'Commands',
      title: 'Toggle Color Theme',
      subtitle: 'Switch between light and dark modes',
      icon: Sun,
      action: () => { toggleTheme(); setOpen(false); }
    },
    {
      id: 'cmd-create-tr',
      category: 'Commands',
      title: 'Trigger: Model Training',
      subtitle: 'Start a high priority deep learning training simulator',
      icon: Terminal,
      action: () => { createJob('model_training', 'high', 45); setOpen(false); }
    },
    {
      id: 'cmd-create-ing',
      category: 'Commands',
      title: 'Trigger: Data Ingestion',
      subtitle: 'Start a medium priority ETL record streamer',
      icon: Terminal,
      action: () => { createJob('data_ingestion', 'medium', 25); setOpen(false); }
    },
    {
      id: 'cmd-create-sent',
      category: 'Commands',
      title: 'Trigger: Sentiment Analysis',
      subtitle: 'Start a low priority NLP text parser',
      icon: Terminal,
      action: () => { createJob('sentiment_analysis', 'low', 15); setOpen(false); }
    },
    {
      id: 'cmd-read-all',
      category: 'Commands',
      title: 'Action: Mark All Notifications Read',
      subtitle: 'Flush all unread alerts in database',
      icon: Bell,
      action: () => { markAllRead(); setOpen(false); }
    }
  ];

  // Map active jobs to palette items
  const jobItems: PaletteItem[] = jobs.map(job => ({
    id: `job-${job.id}`,
    category: 'Jobs',
    title: `Job: ${job.type} (${job.id.substring(0, 8)})`,
    subtitle: `Status: ${job.status.toUpperCase()} | Priority: ${job.priority}`,
    icon: Terminal,
    action: () => {
      setActiveJobDetailsId(job.id);
      router.push('/jobs');
      setOpen(false);
    }
  }));

  // Map notifications to palette items
  const notificationItems: PaletteItem[] = notifications.map(n => ({
    id: `notif-${n.id}`,
    category: 'Notifications',
    title: n.title,
    subtitle: n.message,
    icon: Bell,
    action: () => {
      router.push('/notifications');
      setOpen(false);
    }
  }));

  const allItems = [...commands, ...jobItems, ...notificationItems];

  const filteredItems = allItems.filter(item => {
    const searchString = `${item.title} ${item.subtitle || ''} ${item.category}`.toLowerCase();
    return searchString.includes(query.toLowerCase());
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  // Group items
  const groups: Record<string, PaletteItem[]> = {};
  filteredItems.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  let absoluteCounter = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={containerRef}
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl text-foreground"
        onKeyDown={handleKeyDown}
      >
        {/* Search */}
        <div className="flex items-center border-b border-border px-3.5">
          <Search className="h-4.5 w-4.5 text-muted-foreground mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            className="h-11 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none border-none"
            placeholder="Search commands, jobs, logs, notifications... (Ctrl+K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>

        {/* Results */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No results found.
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
            {Object.keys(groups).map((groupName) => (
              <div key={groupName}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {groupName}
                </div>
                <div className="space-y-0.5">
                  {groups[groupName].map((item) => {
                    const currentFlatIndex = absoluteCounter;
                    absoluteCounter++;
                    const isSelected = currentFlatIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentFlatIndex)}
                        className={`flex items-center gap-3 rounded px-3 py-2 text-left cursor-pointer transition-colors ${
                          isSelected ? 'bg-secondary text-secondary-foreground font-medium' : 'text-foreground'
                        }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded shadow-sm text-muted-foreground">
                            Enter
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
          <span>Use ↑↓ arrows to navigate, <kbd className="px-1 rounded bg-card border border-border">Enter</kbd> to execute</span>
          <span>Press <kbd className="px-1 rounded bg-card border border-border">Esc</kbd> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
export default CommandPalette;
