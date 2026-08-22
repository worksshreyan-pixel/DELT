"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.middleware = void 0;
const ssr_1 = require("@supabase/ssr");
const server_1 = require("next/server");
const env_1 = require("@/lib/env");
async function middleware(request) {
    let response = server_1.NextResponse.next({
        request: {
            headers: request.headers,
        },
    });
    if (!(0, env_1.hasSupabasePublicConfig)()) {
        return response;
    }
    const supabase = (0, ssr_1.createServerClient)(env_1.env.supabase.url, env_1.env.supabase.anonKey, {
        cookies: {
            get(name) {
                return request.cookies.get(name)?.value;
            },
            set(name, value, options) {
                request.cookies.set({
                    name,
                    value,
                    ...options,
                });
                response = server_1.NextResponse.next({
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
            remove(name, options) {
                request.cookies.set({
                    name,
                    value: '',
                    ...options,
                });
                response = server_1.NextResponse.next({
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
    const isProtectedPath = pathname.startsWith('/dashboard') ||
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
        return server_1.NextResponse.redirect(redirectUrl);
    }
    // If already logged in and visiting login or signup
    if (user && (pathname === '/login' || pathname === '/signup')) {
        return server_1.NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return response;
}
exports.middleware = middleware;
exports.config = {
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
