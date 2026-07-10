'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useJobStore } from '@/store/use-job-store';
import { useUiStore } from '@/store/use-ui-store';
import {
  LayoutDashboard,
  PlaySquare,
  Bell,
  Cpu,
  LogOut,
  X,
  Layers,
  User as UserIcon,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const connectSSE = useJobStore((state) => state.connectSSE);
  const disconnectSSE = useJobStore((state) => state.disconnectSSE);
  const workers = useJobStore((state) => state.workers);
  const unreadCount = useJobStore((state) => state.unreadNotificationsCount);
  
  const isMobileOpen = useUiStore((state) => state.isMobileSidebarOpen);
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen);

  const [user, setUser] = useState<{ name: string | null; email: string } | null>(null);

  // Sync user info from session API
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch((err) => console.error('Failed to load session:', err));
  }, []);

  // Initialize SSE connection globally via Sidebar
  useEffect(() => {
    connectSSE();
    return () => {
      disconnectSSE();
    };
  }, [connectSSE, disconnectSSE]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        disconnectSSE();
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/jobs', icon: PlaySquare },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: 'Workers', href: '/workers', icon: Cpu },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card text-foreground transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            <Layers className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider">Synthetix</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </Link>
          <button
            className="rounded p-1 hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Workers Monitor widget */}
        <div className="border-t border-border px-4 py-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Worker Node Pool</span>
            <span className="text-[10px] text-emerald-500 font-normal">Active</span>
          </div>
          <div className="space-y-2">
            {workers.slice(0, 4).map((worker) => (
              <div key={worker.id} className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground truncate max-w-[120px]">{worker.name}</span>
                <div className="flex items-center gap-2">
                  {worker.status !== 'offline' && (
                    <span className="text-[10px] text-muted-foreground font-mono">{worker.cpu}% CPU</span>
                  )}
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      worker.status === 'idle'
                        ? 'bg-emerald-500'
                        : worker.status === 'busy'
                        ? 'bg-sky-500'
                        : 'bg-zinc-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User profile dropdown & signout */}
        <div className="border-t border-border p-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border">
              <UserIcon className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-foreground">
                {user?.name || 'Loading User...'}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email || '...'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
