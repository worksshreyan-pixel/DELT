var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { env, hasSupabasePublicConfig } from '@/lib/env';
export function middleware(request) {
    return __awaiter(this, void 0, void 0, function () {
        var response, supabase, user, pathname, isProtectedPath, redirectUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    if (!hasSupabasePublicConfig()) {
                        return [2 /*return*/, response];
                    }
                    supabase = createServerClient(env.supabase.url, env.supabase.anonKey, {
                        cookies: {
                            get: function (name) {
                                var _a;
                                return (_a = request.cookies.get(name)) === null || _a === void 0 ? void 0 : _a.value;
                            },
                            set: function (name, value, options) {
                                request.cookies.set(__assign({ name: name, value: value }, options));
                                response = NextResponse.next({
                                    request: {
                                        headers: request.headers,
                                    },
                                });
                                response.cookies.set(__assign({ name: name, value: value }, options));
                            },
                            remove: function (name, options) {
                                request.cookies.set(__assign({ name: name, value: '' }, options));
                                response = NextResponse.next({
                                    request: {
                                        headers: request.headers,
                                    },
                                });
                                response.cookies.set(__assign({ name: name, value: '' }, options));
                            },
                        },
                    });
                    return [4 /*yield*/, supabase.auth.getUser()];
                case 1:
                    user = (_a.sent()).data.user;
                    pathname = request.nextUrl.pathname;
                    isProtectedPath = pathname.startsWith('/dashboard') ||
                        pathname.startsWith('/deals') ||
                        pathname.startsWith('/storage') ||
                        pathname.startsWith('/settings') ||
                        pathname.startsWith('/notifications') ||
                        pathname.startsWith('/clients') ||
                        pathname.startsWith('/transactions');
                    // If trying to access protected route without active session
                    if (isProtectedPath && !user) {
                        redirectUrl = new URL('/login', request.url);
                        redirectUrl.searchParams.set('redirect', pathname);
                        return [2 /*return*/, NextResponse.redirect(redirectUrl)];
                    }
                    // If already logged in and visiting login or signup
                    if (user && (pathname === '/login' || pathname === '/signup')) {
                        return [2 /*return*/, NextResponse.redirect(new URL('/dashboard', request.url))];
                    }
                    return [2 /*return*/, response];
            }
        });
    });
}
export var config = {
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
