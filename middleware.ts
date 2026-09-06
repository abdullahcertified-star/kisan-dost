import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kisan_auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico';

  // Strict route protection: If logged out, user must login to get access, otherwise no access
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    return redirectRes;
  }

  const res = NextResponse.next();
  if (!isPublicRoute) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }
  return res;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
