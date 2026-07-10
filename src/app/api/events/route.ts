import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Validate token from cookie
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      let lastChecked = new Date(Date.now() - 5000); // look back 5s initially

      // Send connection acknowledgement
      try {
        controller.enqueue(encoder.encode('event: connected\ndata: {"status":"ok"}\n\n'));
      } catch (err) {
        console.error('SSE initial enqueue failed:', err);
        return;
      }

      // Polling loop
      const poll = async () => {
        try {
          // Fetch recent jobs
          const jobs = await prisma.job.findMany({
            orderBy: { createdAt: 'desc' },
            take: 30,
            include: {
              worker: true,
              owner: { select: { name: true } }
            }
          });

          // Fetch workers
          const workers = await prisma.worker.findMany({
            orderBy: { name: 'asc' }
          });

          // Fetch unread notifications count
          const unreadNotificationsCount = await prisma.notification.count({
            where: { userId: payload.userId, status: 'unread' }
          });

          // Fetch new logs for active jobs
          const activeJobIds = jobs
            .filter(j => ['queued', 'preparing', 'worker_assigned', 'running', 'processing', 'aggregating', 'saving'].includes(j.status))
            .map(j => j.id);

          let newLogs: any[] = [];
          if (activeJobIds.length > 0) {
            newLogs = await prisma.log.findMany({
              where: {
                jobId: { in: activeJobIds },
                timestamp: { gte: lastChecked }
              },
              orderBy: { timestamp: 'asc' }
            });
          }

          // Update last checked to just before current time (avoiding small gaps)
          lastChecked = new Date(Date.now() - 200);

          const data = {
            jobs,
            workers,
            unreadNotificationsCount,
            logs: newLogs
          };

          controller.enqueue(encoder.encode(`event: sync\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.error('SSE polling database error:', err);
          // Silently proceed, connection will remain open
        }
      };

      await poll();
      intervalId = setInterval(poll, 850);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
      console.log('SSE connection closed by subscriber');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
