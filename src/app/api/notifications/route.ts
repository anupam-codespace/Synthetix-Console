import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined; 
    const search = searchParams.get('search') || '';

    const whereClause: any = {
      userId: user.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    } else {
      // By default, exclude archived unless requested
      whereClause.status = { in: ['read', 'unread'] };
    }

    if (status === 'archived') {
      whereClause.status = 'archived';
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
      ];
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
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
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ error: 'Invalid payload: ids and status are required' }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId: user.id
      },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Invalid payload: ids array is required' }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
