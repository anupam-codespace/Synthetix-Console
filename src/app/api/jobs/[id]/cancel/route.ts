import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job is active
    const activeStates = ['queued', 'preparing', 'worker_assigned', 'running', 'processing', 'aggregating', 'saving'];
    if (!activeStates.includes(job.status)) {
      return NextResponse.json({ error: 'Job is not active and cannot be cancelled' }, { status: 400 });
    }

    // Cancel job
    await prisma.job.update({
      where: { id },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });

    await prisma.log.create({
      data: {
        jobId: id,
        level: 'warn',
        message: 'Job cancelled by operator.'
      }
    });

    await prisma.jobHistory.create({
      data: {
        jobId: id,
        status: 'cancelled',
        message: 'Job cancelled by operator.'
      }
    });

    // Free worker
    if (job.workerId) {
      try {
        await prisma.worker.update({
          where: { id: job.workerId },
          data: { status: 'idle', jobsActive: { decrement: 1 } }
        });
      } catch (workerErr) {
        console.error('Failed to free worker on cancellation:', workerErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
