'use client';

import { useUiStore } from '@/store/use-ui-store';
import { useJobStore } from '@/store/use-job-store';
import { Menu, Sun, Moon, Keyboard, Wifi, WifiOff } from 'lucide-react';

export function Navbar({ title }: { title: string }) {
  const isConnected = useJobStore((state) => state.isConnected);
  const isConnecting = useJobStore((state) => state.isConnecting);
  
  const setMobileOpen = useUiStore((state) => state.setMobileSidebarOpen);
  const setShortcutModalOpen = useUiStore((state) => state.setShortcutModalOpen);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const theme = useUiStore((state) => state.theme);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 text-foreground">
      {/* Left section: Hamburger on mobile, page title */}
      <div className="flex items-center gap-3">
        <button
          className="rounded p-1.5 hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-bold tracking-tight md:text-base">{title}</h1>
      </div>

      {/* Right section: SSE Sync state, command palette triggers, theme, and help keys */}
      <div className="flex items-center gap-3">
        {/* Real-time SSE State */}
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium font-mono text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">LIVE</span>
            </>
          ) : isConnecting ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>CONNECTING</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-500" />
              <span>OFFLINE</span>
            </>
          )}
        </div>

        {/* Cmd+K Search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden items-center gap-1.5 rounded border border-border bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted md:flex"
        >
          <span>Search</span>
          <kbd className="pointer-events-none select-none rounded bg-card px-1 font-mono text-[10px] border border-border">
            ⌘K
          </kbd>
        </button>

        {/* Key cheat sheet */}
        <button
          onClick={() => setShortcutModalOpen(true)}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </button>

        {/* Light/Dark Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
export default Navbar;
