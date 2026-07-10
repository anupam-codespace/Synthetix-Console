'use client';

import Sidebar from '@/components/sidebar';
import CommandPalette from '@/components/command-palette';
import ShortcutModal from '@/components/shortcut-modal';
import NotificationReplay from '@/components/notification-replay';
import JobDrawer from '@/components/job-drawer';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Global Side Panel */}
      <Sidebar />

      {/* Main Page Content Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>

      {/* Floating overlays */}
      <JobDrawer />
      <CommandPalette />
      <ShortcutModal />
      <NotificationReplay />
    </div>
  );
}
export default DashboardLayout;
