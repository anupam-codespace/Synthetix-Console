import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { runSimulation } from '@/lib/simulator';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }
    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search } },
        { type: { contains: search } },
        { failureReason: { contains: search } },
        { logs: { some: { message: { contains: search } } } }
      ];
    }

    const [jobs, totalCount] = await prisma.$transaction([
      prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          worker: true,
          owner: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.job.count({ where: whereClause })
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Fetch jobs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, priority, estimatedDuration } = body;

    if (!type || !priority) {
      return NextResponse.json({ error: 'Type and priority are required' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        type,
        priority,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration, 10) : 30,
        status: 'queued',
        progress: 0.0,
        ownerId: user.id,
      },
      include: {
        worker: true,
        owner: {
          select: { name: true, email: true }
        }
      }
    });

    // Launch async simulation in the background
    await runSimulation(job.id);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
