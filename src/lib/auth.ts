import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';
import prisma from './prisma';

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        preferences: {
          select: {
            theme: true,
            emailNotifications: true,
            savedFilters: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error('getSessionUser error:', error);
    return null;
  }
}
