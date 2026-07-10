import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicApi = pathname.startsWith('/api/auth/');

  // Check if token exists and is valid
  let hasValidSession = false;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload) {
      hasValidSession = true;
    }
  }

  if (isAuthPage) {
    if (hasValidSession) {
      // Redirect logged-in users away from login/signup to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Define protected UI paths
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/workers') ||
    pathname === '/';

  if (isProtectedPath) {
    if (!hasValidSession) {
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isApiRoute && !isPublicApi && !hasValidSession) {
    // Return unauthorized for protected APIs
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
