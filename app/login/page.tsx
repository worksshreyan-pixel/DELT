'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { PixelBlastBackground } from '@/components/marketing/pixel-blast-background';
import { GoogleIcon } from '@/components/auth/google-icon';

function getSafeRedirectUrl(rawRedirect: string | null): string {
  if (!rawRedirect) return '/dashboard';
  try {
    const decoded = decodeURIComponent(rawRedirect).trim();
    if (
      decoded.startsWith('/') &&
      !decoded.startsWith('//') &&
      !decoded.startsWith('/\\') &&
      !decoded.includes('://')
    ) {
      return decoded;
    }
  } catch (err) {
    // Fall back safely if invalid
  }
  return '/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirect = getSafeRedirectUrl(rawRedirect);
  const supabase = createClient();
  const isConfigured = hasSupabasePublicConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Google OAuth Flow
  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);

    if (!isConfigured) {
      setTimeout(() => {
        setGoogleLoading(false);
        router.push(redirect);
      }, 600);
      return;
    }

    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        setError('Could not complete Google sign-in. Please try again or use email sign-in.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError('An unexpected connection error occurred during Google sign-in.');
      setGoogleLoading(false);
    }
  }

  // 2. Email & Password Flow
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    if (!isConfigured) {
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
          setError('Your email address is not verified yet. Please check your inbox.');
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your details and try again.');
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
    bannerMessage = 'This verification link has expired or has already been used. Please sign in below.';
  } else if (urlError === 'auth_callback_failed') {
    bannerMessage = 'Authentication callback could not be completed. Please try signing in below.';
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans antialiased flex flex-col justify-between selection:bg-accent-brand/20 selection:text-accent-brand">
      {/* Subtle Atmospheric Background */}
      <PixelBlastBackground className="opacity-40" />

      {/* Minimal Navbar Header */}
      <header className="relative z-10 mx-auto max-w-7xl w-full px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to DELT</span>
        </Link>
      </header>

      {/* Main Centered Authentication Composition */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
            {/* Header */}
            <div className="mb-6 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Continue to your DELT workspace.
              </p>
            </div>

            {/* Status Banners */}
            {isVerified && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Email verified successfully! You can now sign in below.</span>
              </div>
            )}

            {bannerMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-400 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{bannerMessage}</span>
              </div>
            )}

            {/* Primary Action: Google OAuth */}
            <div className="space-y-4">
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full h-11 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/50 font-medium text-sm gap-2.5 transition-all shadow-xs"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent-brand" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                  <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                </Button>
              </motion.div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-border/60" />
                <span className="absolute bg-card px-3 text-xs font-medium text-muted-foreground">
                  or
                </span>
              </div>

              {/* Secondary Action: Email Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9 h-10 rounded-xl bg-muted/20 border-border/80 text-sm font-normal focus:border-accent-brand/70 focus:ring-1 focus:ring-accent-brand/70 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={googleLoading || loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium text-foreground">
                      Password
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-9 pr-9 h-10 rounded-xl bg-muted/20 border-border/80 text-sm font-normal focus:border-accent-brand/70 focus:ring-1 focus:ring-accent-brand/70 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={googleLoading || loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full h-10 rounded-xl gap-2 font-medium text-sm shadow-xs"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </motion.div>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-normal text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-foreground hover:text-accent-brand transition-colors underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-6 text-center text-xs font-normal text-muted-foreground">
        © {new Date().getFullYear()} DELT. All rights reserved.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-sm font-sans text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
