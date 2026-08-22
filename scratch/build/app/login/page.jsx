'use client';
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
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
function LoginForm() {
    var router = useRouter();
    var searchParams = useSearchParams();
    var redirect = searchParams.get('redirect') || '/dashboard';
    var supabase = createClient();
    var isConfigured = hasSupabasePublicConfig();
    var _a = useState(''), email = _a[0], setEmail = _a[1];
    var _b = useState(''), password = _b[0], setPassword = _b[1];
    var _c = useState(false), showPassword = _c[0], setShowPassword = _c[1];
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(''), error = _e[0], setError = _e[1];
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, authError, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        setError('');
                        if (!email || !password) {
                            setError('Please enter your email and password.');
                            return [2 /*return*/];
                        }
                        setLoading(true);
                        if (!isConfigured) {
                            // Offline fallback: navigate directly to dashboard
                            setTimeout(function () {
                                setLoading(false);
                                router.push(redirect);
                            }, 500);
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, supabase.auth.signInWithPassword({
                                email: email.trim(),
                                password: password,
                            })];
                    case 2:
                        _a = _b.sent(), data = _a.data, authError = _a.error;
                        if (authError) {
                            if (authError.message.includes('Email not confirmed')) {
                                setError('Your email address is not verified yet. Please check your inbox for the confirmation link.');
                            }
                            else if (authError.message.includes('Invalid login credentials')) {
                                setError('Invalid email or password. Please try again.');
                            }
                            else {
                                setError(authError.message);
                            }
                            setLoading(false);
                            return [2 /*return*/];
                        }
                        if (data.session) {
                            router.push(redirect);
                            router.refresh();
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _b.sent();
                        setError((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'An unexpected error occurred during sign in.');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    var urlError = searchParams.get('error');
    var isVerified = searchParams.get('verified') === 'true';
    var bannerMessage = '';
    if (urlError === 'verification_link_expired') {
        bannerMessage = 'This verification link has expired or has already been used. Please log in or request a new link.';
    }
    else if (urlError === 'auth_callback_failed') {
        bannerMessage = 'Authentication callback could not be completed. Please try signing in below.';
    }
    return (<div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo size="lg"/>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">Log in to your DELT workspace.</p>

            {isVerified && (<div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5"/>
                <span>Email verified successfully! You can now sign in to your workspace.</span>
              </div>)}

            {bannerMessage && (<div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                <span>{bannerMessage}</span>
              </div>)}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={function (e) { return setEmail(e.target.value); }} required/>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={function (e) { return setPassword(e.target.value); }} required/>
                  <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>

              {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <span>{error}</span>
                </div>)}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4"/>}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Do not have an account?{' '}
            <Link href="/signup" className="font-medium text-foreground hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>);
}
export default function LoginPage() {
    return (<Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading login...</div>}>
      <LoginForm />
    </Suspense>);
}
