import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { runSimulation } from '@/lib/simulator';

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

    // Reset job state and wipe old execution history/logs
    await prisma.$transaction([
      prisma.log.deleteMany({ where: { jobId: id } }),
      prisma.jobHistory.deleteMany({ where: { jobId: id } }),
      prisma.job.update({
        where: { id },
        data: {
          status: 'queued',
          progress: 0.0,
          startedAt: null,
          completedAt: null,
          failureReason: null,
          failureFix: null,
          failureCauses: null,
          output: null,
        }
      })
    ]);

    // Rerun simulation
    await runSimulation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Retry job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
