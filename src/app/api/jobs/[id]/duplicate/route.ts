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

    const sourceJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!sourceJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Duplicate the job under the current user's ownership
    const duplicatedJob = await prisma.job.create({
      data: {
        type: sourceJob.type,
        priority: sourceJob.priority,
        estimatedDuration: sourceJob.estimatedDuration,
        status: 'queued',
        progress: 0.0,
        ownerId: user.id,
      }
    });

    // Start simulation for the duplicate
    await runSimulation(duplicatedJob.id);

    return NextResponse.json({ job: duplicatedJob }, { status: 201 });
  } catch (error) {
    console.error('Duplicate job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
