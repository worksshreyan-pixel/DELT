import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env, hasSupabasePublicConfig } from '@/lib/env';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!hasSupabasePublicConfig()) {
    return response;
  }

  const supabase = createServerClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh auth session
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/storage') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/transactions');

  // If trying to access protected route without active session
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If already logged in and visiting login or signup
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/deals/:path*',
    '/storage/:path*',
    '/settings/:path*',
    '/notifications/:path*',
    '/clients/:path*',
    '/transactions/:path*',
    '/login',
    '/signup',
  ],
};
