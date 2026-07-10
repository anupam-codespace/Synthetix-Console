'use client';

import { useState, useEffect } from 'react';
import { useJobStore, Notification } from '@/store/use-job-store';
import { useUiStore } from '@/store/use-ui-store';
import {
  Bell,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Search,
  Inbox,
  Filter,
} from 'lucide-react';

export function NotificationList() {
  const notifications = useJobStore((state) => state.notifications);
  const fetchNotifications = useJobStore((state) => state.fetchNotifications);
  
  const markNotifications = useJobStore((state) => state.markNotifications);
  const markAllRead = useJobStore((state) => state.markAllNotificationsRead);
  const setReplayJobId = useUiStore((state) => state.setActiveNotificationReplayJobId);

  const [activeFilter, setActiveFilter] = useState<'unread' | 'all' | 'archived'>('unread');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Reload notifications when filter/search changes
  useEffect(() => {
    fetchNotifications(activeFilter, searchQuery);
  }, [activeFilter, searchQuery, fetchNotifications]);

  const handleMarkRead = (id: string) => {
    markNotifications([id], 'read');
  };

  const handleArchive = (id: string) => {
    markNotifications([id], 'archived');
  };

  const handleToggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Grouping logic for Smart Notification Grouping
  const getGroupedNotifications = () => {
    const groups: Record<string, Notification[]> = {};
    const ungrouped: Notification[] = [];

    notifications.forEach((item) => {
      if (item.groupKey) {
        if (!groups[item.groupKey]) {
          groups[item.groupKey] = [];
        }
        groups[item.groupKey].push(item);
      } else {
        ungrouped.push(item);
      }
    });

    const items: Array<{
      type: 'single' | 'group';
      groupKey?: string;
      title?: string;
      list?: Notification[];
      singleItem?: Notification;
    }> = [];

    // Process groups
    Object.keys(groups).forEach((key) => {
      const list = groups[key];
      if (list.length > 1) {
        // Group them
        const unreadCount = list.filter((n) => n.status === 'unread').length;
        const statusText = list[0].title.includes('Failed') ? 'Failed' : 'Completed';
        const title = `${list.length} Jobs ${statusText} Successfully`;
        
        items.push({
          type: 'group',
          groupKey: key,
          title,
          list,
        });
      } else if (list.length === 1) {
        items.push({
          type: 'single',
          singleItem: list[0],
        });
      }
    });

    // Add ungrouped items
    ungrouped.forEach((singleItem) => {
      items.push({
        type: 'single',
        singleItem,
      });
    });

    return items;
  };

  const groupedItems = getGroupedNotifications();

  return (
    <div className="space-y-4">
      {/* Filtering Header Panel */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-muted/65 p-1 rounded-md text-xs border border-border">
          {(['unread', 'all', 'archived'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded px-3 py-1 font-semibold uppercase tracking-wider transition-colors ${
                activeFilter === filter
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search & Mark Read */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search alerts..."
              className="h-8 w-[180px] rounded border border-border bg-card pl-8 pr-2.5 text-xxs outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {activeFilter === 'unread' && notifications.length > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {groupedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-border bg-card">
          <Inbox className="h-10 w-10 text-muted-foreground/45 mb-2.5" />
          <p className="text-sm font-semibold text-muted-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">No notifications in this folder.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groupedItems.map((item, index) => {
            if (item.type === 'group') {
              const list = item.list || [];
              const groupKey = item.groupKey || '';
              const isExpanded = expandedGroups[groupKey] || false;
              const unreadCount = list.filter((n) => n.status === 'unread').length;

              return (
                <div key={groupKey} className="rounded-lg border border-border bg-card overflow-hidden">
                  {/* Group Header Row */}
                  <div className="flex items-center justify-between bg-muted/20 px-4 py-3 text-xs select-none">
                    <div className="flex items-center gap-2">
                      <Bell className={`h-4.5 w-4.5 ${unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold">{item.title}</span>
                      {unreadCount > 0 && (
                        <span className="rounded bg-primary px-1.5 py-0.5 text-xxs font-bold text-primary-foreground">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => markNotifications(list.map((n) => n.id), 'read')}
                        className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Mark group read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => markNotifications(list.map((n) => n.id), 'archived')}
                        className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Archive group"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleGroup(groupKey)}
                        className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Group Items */}
                  {isExpanded && (
                    <div className="divide-y divide-border border-t border-border bg-card/40">
                      {list.map((n) => (
                        <div key={n.id} className="flex items-center justify-between px-6 py-2.5 text-xs transition-colors hover:bg-muted/10">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-medium text-foreground">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {n.jobId && (
                              <button
                                onClick={() => setReplayJobId(n.jobId)}
                                className="flex items-center gap-1 rounded bg-secondary px-2.5 py-1 text-xxs font-semibold hover:bg-muted text-foreground"
                              >
                                <Play className="h-3 w-3" />
                                <span>Replay</span>
                              </button>
                            )}
                            {n.status === 'unread' && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                                title="Mark read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleArchive(n.id)}
                              className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              // Single Item Row
              const n = item.singleItem!;
              return (
                <div
                  key={n.id}
                  className={`flex items-center justify-between rounded-lg border border-border bg-card p-4 text-xs transition-all ${
                    n.status === 'unread' ? 'ring-1 ring-inset ring-primary/25 bg-muted/5' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${n.status === 'unread' ? 'bg-primary' : 'bg-transparent'}`} />
                      <p className="font-semibold text-foreground">{n.title}</p>
                    </div>
                    <p className="text-muted-foreground pl-3.5">{n.message}</p>
                    <span className="text-[10px] text-muted-foreground/60 mt-1 block pl-3.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {n.jobId && (
                      <button
                        onClick={() => setReplayJobId(n.jobId)}
                        className="flex items-center gap-1 rounded bg-secondary px-2.5 py-1 text-xxs font-semibold hover:bg-muted text-foreground"
                      >
                        <Play className="h-3 w-3" />
                        <span>Replay</span>
                      </button>
                    )}
                    {n.status === 'unread' && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Mark read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleArchive(n.id)}
                      className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Archive"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
export default NotificationList;
