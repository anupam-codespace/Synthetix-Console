'use client';

import DashboardLayout from '@/components/dashboard-layout';
import Navbar from '@/components/navbar';
import NotificationList from '@/components/notification-list';

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <Navbar title="Notification Hub" />

      {/* Main Body */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar text-foreground">
        <NotificationList />
      </main>
    </DashboardLayout>
  );
}
