"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const logo_1 = require("@/components/logo");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
function LoginForm() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const supabase = (0, client_1.createClient)();
    const isConfigured = (0, env_1.hasSupabasePublicConfig)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setLoading(true);
        if (!isConfigured) {
            // Offline fallback: navigate directly to dashboard
            setTimeout(() => {
                setLoading(false);
                router.push(redirect);
            }, 500);
            return;
        }
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
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
                return;
            }
            if (data.session) {
                router.push(redirect);
                router.refresh();
            }
        }
        catch (err) {
            setError(err?.message || 'An unexpected error occurred during sign in.');
        }
        finally {
            setLoading(false);
        }
    }
    const urlError = searchParams.get('error');
    const isVerified = searchParams.get('verified') === 'true';
    let bannerMessage = '';
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
            <logo_1.Logo size="lg"/>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">Log in to your DELT workspace.</p>

            {isVerified && (<div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <lucide_react_1.CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5"/>
                <span>Email verified successfully! You can now sign in to your workspace.</span>
              </div>)}

            {bannerMessage && (<div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <lucide_react_1.AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                <span>{bannerMessage}</span>
              </div>)}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="email">Email</label_1.Label>
                <div className="relative">
                  <lucide_react_1.Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <input_1.Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label_1.Label htmlFor="password">Password</label_1.Label>
                  <link_1.default href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </link_1.default>
                </div>
                <div className="relative">
                  <lucide_react_1.Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <input_1.Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <lucide_react_1.EyeOff className="h-4 w-4"/> : <lucide_react_1.Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>

              {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <lucide_react_1.AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <span>{error}</span>
                </div>)}

              <button_1.Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <lucide_react_1.ArrowRight className="h-4 w-4"/>}
              </button_1.Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Do not have an account?{' '}
            <link_1.default href="/signup" className="font-medium text-foreground hover:underline">
              Sign up
            </link_1.default>
          </p>
        </div>
      </div>
    </div>);
}
function LoginPage() {
    return (<react_1.Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading login...</div>}>
      <LoginForm />
    </react_1.Suspense>);
}
exports.default = LoginPage;
