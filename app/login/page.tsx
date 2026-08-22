'use client';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const supabase = createClient();
  const isConfigured = hasSupabasePublicConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
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
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  }

  const urlError = searchParams.get('error');
  const isVerified = searchParams.get('verified') === 'true';

  let bannerMessage = '';
  if (urlError === 'verification_link_expired') {
    bannerMessage = 'This verification link has expired or has already been used. Please log in or request a new link.';
  } else if (urlError === 'auth_callback_failed') {
    bannerMessage = 'Authentication callback could not be completed. Please try signing in below.';
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">Log in to your DELT workspace.</p>

            {isVerified && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Email verified successfully! You can now sign in to your workspace.</span>
              </div>
            )}

            {bannerMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{bannerMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
