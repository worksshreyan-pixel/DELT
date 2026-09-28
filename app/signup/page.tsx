'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpCodeSlots } from '@/components/ui/otp-code-slots';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { cn } from '@/lib/utils';
import { PixelBlastBackground } from '@/components/marketing/pixel-blast-background';
import { GoogleIcon } from '@/components/auth/google-icon';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const isConfigured = hasSupabasePublicConfig();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [expiresSeconds, setExpiresSeconds] = useState(600); // 10 minutes

  // Password Validation Checks
  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  // Cooldown Countdown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // OTP Expiry Countdown Timer
  useEffect(() => {
    if (step !== 'otp' || expiresSeconds <= 0) return;
    const timer = setInterval(() => {
      setExpiresSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expiresSeconds]);

  // Format Expiry MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 1. Google OAuth Flow
  async function handleGoogleSignUp() {
    setError('');
    setGoogleLoading(true);

    if (!isConfigured) {
      setTimeout(() => {
        setGoogleLoading(false);
        router.push('/dashboard');
      }, 600);
      return;
    }

    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        setError('Could not complete Google sign-up. Please try again.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError('An unexpected connection error occurred during Google sign-up.');
      setGoogleLoading(false);
    }
  }

  // 2. Submit Initial Signup & Request OTP
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || 'Failed to request verification code.');
        setLoading(false);
        return;
      }

      // Transition to OTP screen
      setStep('otp');
      setCooldown(json.cooldownSeconds || 30);
      setExpiresSeconds(600);
      setStatusMessage('');
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError('Network error requesting verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // 3. Verify 6-Digit OTP
  async function handleVerifyOtp(codeToVerify?: string) {
    if (verifying) return;
    const code = (codeToVerify || otp.join('')).trim();

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || 'Incorrect verification code. Please try again.');
        setVerifying(false);
        return;
      }

      setVerifiedSuccess(true);
      setStatusMessage('Email verified successfully');

      try {
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      } catch (authErr) {
        // Fall back gracefully
      }

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError('Verification failed. Please check your connection and try again.');
      setVerifying(false);
    }
  }

  // 4. Resend OTP
  async function handleResendOtp() {
    if (resending || cooldown > 0) return;

    setResending(true);
    setError('');
    setStatusMessage('');

    try {
      const res = await fetch('/api/auth/signup-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || 'Unable to send the verification email. Please try again.');
        if (json.cooldownSeconds) {
          setCooldown(json.cooldownSeconds);
        }
      } else {
        setStatusMessage('New verification code sent');
        setCooldown(json.cooldownSeconds || 30);
        setExpiresSeconds(600);
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err: any) {
      setError('Unable to send the verification email. Please try again.');
    } finally {
      setResending(false);
    }
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
          {step === 'otp' ? (
            /* OTP Verification Step Surface */
            <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl text-center space-y-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-brand/10 border border-accent-brand/20 text-accent-brand">
                {verifiedSuccess ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <KeyRound className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {verifiedSuccess ? 'Email verified' : 'Verify your email'}
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                  We sent a 6-digit verification code to
                  <br />
                  <strong className="text-foreground font-medium">{email}</strong>
                </p>
              </div>

              {statusMessage && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!verifiedSuccess && (
                <div className="space-y-4 pt-1">
                  <OtpCodeSlots
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={(code) => handleVerifyOtp(code)}
                    disabled={verifying || verifiedSuccess}
                    isLoading={verifying}
                    status={verifiedSuccess ? 'success' : error ? 'error' : 'idle'}
                  />

                  <div className="text-xs text-muted-foreground font-normal">
                    {expiresSeconds > 0 ? (
                      <span>
                        Code expires in{' '}
                        <strong className="text-foreground font-mono font-medium">{formatTime(expiresSeconds)}</strong>
                      </span>
                    ) : (
                      <span className="text-destructive font-medium">Code expired. Request a new code below.</span>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <Button
                      onClick={() => handleVerifyOtp()}
                      disabled={verifying || otp.some((d) => !d) || verifiedSuccess}
                      className="w-full h-10 rounded-xl gap-2 font-medium text-sm shadow-xs"
                    >
                      {verifying ? 'Verifying...' : 'Verify'}
                      {!verifying && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1 font-normal">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={resending || cooldown > 0 || verifiedSuccess}
                        className="text-xs font-medium gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={cn('h-3.5 w-3.5', resending && 'animate-spin')} />
                        {resending ? 'Sending...' : 'Resend code'}
                      </Button>

                      {cooldown > 0 && (
                        <span className="text-xs text-muted-foreground font-mono">
                          Resend in {cooldown}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!verifiedSuccess && (
                <div className="pt-2 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError('');
                      setStatusMessage('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  >
                    Change email address
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Signup Form Surface */
            <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
              <div className="mb-6 text-left">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
                  Create your account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Start managing your client work in one place.
                </p>
              </div>

              {/* Primary Action: Google OAuth */}
              <div className="space-y-4">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignUp}
                    disabled={googleLoading || loading}
                    className="w-full h-11 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/50 font-medium text-sm gap-2.5 transition-all shadow-xs"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
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
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-foreground">
                      Full name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Alex Morgan"
                        className="pl-9 h-10 rounded-xl bg-muted/20 border-border/80 text-sm font-normal focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={googleLoading || loading}
                      />
                    </div>
                  </div>

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
                        className="pl-9 h-10 rounded-xl bg-muted/20 border-border/80 text-sm font-normal focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={googleLoading || loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-9 pr-9 h-10 rounded-xl bg-muted/20 border-border/80 text-sm font-normal focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/70 transition-all"
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
                    {password && (
                      <div className="space-y-1 pt-1 font-normal text-xs">
                        {passwordChecks.map((check, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <Check className={cn('h-3 w-3', check.met ? 'text-emerald-400' : 'text-muted-foreground/40')} />
                            <span className={check.met ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
                              {check.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-border bg-muted/20 text-amber-500 focus:ring-amber-500"
                    />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-amber-500 transition-colors">
                        Terms
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-amber-500 transition-colors">
                        Privacy Policy
                      </Link>
                    </Label>
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
                      {loading ? 'Sending code...' : 'Create account'}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-sm font-normal text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-foreground hover:text-amber-500 transition-colors underline underline-offset-4">
              Log in
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
