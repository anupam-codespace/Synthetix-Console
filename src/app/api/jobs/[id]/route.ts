import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
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
      where: { id },
      include: {
        worker: true,
        owner: {
          select: { name: true, email: true }
        },
        logs: {
          orderBy: { timestamp: 'asc' }
        },
        history: {
          orderBy: { changedAt: 'asc' }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Fetch job details error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Free the worker if it was busy with this job
    if (job.workerId && ['queued', 'preparing', 'worker_assigned', 'running', 'processing', 'aggregating', 'saving'].includes(job.status)) {
      try {
        await prisma.worker.update({
          where: { id: job.workerId },
          data: { status: 'idle', jobsActive: { decrement: 1 } }
        });
      } catch (workerErr) {
        console.error('Failed to free worker on delete:', workerErr);
      }
    }

    await prisma.job.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
