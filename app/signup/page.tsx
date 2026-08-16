'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, AlertCircle, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // 1. Submit Initial Signup & Request OTP
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agreed) {
      setError('Please accept the terms and privacy policy to continue.');
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
        setError(json.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      // Transition to OTP screen
      setStep('otp');
      setCooldown(json.cooldownSeconds || 30);
      setExpiresSeconds(600);
      setStatusMessage('');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      console.error('Signup request error:', err);
      setError('Network error requesting verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // 2. Verify 6-Digit OTP
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
        setError(json.error || 'Incorrect code. Please try again.');
        setVerifying(false);
        return;
      }

      // Success! Account is verified
      setVerifiedSuccess(true);
      setStatusMessage('Email verified');

      // Sign the user in to establish browser session
      try {
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      } catch (authErr) {
        console.warn('Auto-login notice:', authErr);
      }

      // Automatically continue to dashboard
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('Verification failed. Please check your connection and try again.');
      setVerifying(false);
    }
  }

  // 3. Resend OTP
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
        setStatusMessage('New code sent');
        setCooldown(json.cooldownSeconds || 30);
        setExpiresSeconds(600);
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError('Unable to send the verification email. Please try again.');
    } finally {
      setResending(false);
    }
  }

  // OTP Input Field Handlers
  function handleOtpChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    if (value && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }

    if (value && idx === 5 && newOtp.every((d) => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!pasted) return;
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    const newOtp = [...otp];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);

    const focusIdx = Math.min(digits.length, 5);
    otpRefs.current[focusIdx]?.focus();

    if (digits.length === 6) {
      handleVerifyOtp(digits.join(''));
    }
  }

  // ----------------------------------------------------------------------------
  // VIEW: OTP Verification Screen
  // ----------------------------------------------------------------------------
  if (step === 'otp') {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <Logo size="lg" />
            </div>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center space-y-5">
              {/* Header Icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                {verifiedSuccess ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <KeyRound className="h-7 w-7 text-primary" />
                )}
              </div>

              {/* Title & Info */}
              <div className="space-y-1.5">
                <h1 className="text-xl font-display font-semibold tracking-tight">
                  {verifiedSuccess ? 'Email verified' : 'Verify your email'}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We sent a 6-digit verification code to
                  <br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              {/* Status or Success Banner */}
              {statusMessage && (
                <div
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg p-2.5 text-xs font-medium',
                    verifiedSuccess
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 6-Digit OTP Inputs */}
              {!verifiedSuccess && (
                <div className="space-y-4 pt-2">
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        disabled={verifying || verifiedSuccess}
                        className={cn(
                          'h-12 w-11 sm:h-14 sm:w-12 rounded-lg border border-input bg-background text-center text-xl font-semibold shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50',
                          digit && 'border-primary/60 bg-muted/20'
                        )}
                      />
                    ))}
                  </div>

                  {/* Expiry Timer */}
                  <div className="text-xs text-muted-foreground">
                    {expiresSeconds > 0 ? (
                      <span>Code expires in <strong className="font-mono text-foreground">{formatTime(expiresSeconds)}</strong></span>
                    ) : (
                      <span className="text-destructive font-medium">This code has expired. Request a new code.</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={() => handleVerifyOtp()}
                      disabled={verifying || otp.some((d) => !d) || verifiedSuccess}
                      className="w-full gap-2"
                    >
                      {verifying ? 'Verifying...' : 'Verify'}
                      {!verifying && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={resending || cooldown > 0 || verifiedSuccess}
                        className="text-xs gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className={cn('h-3.5 w-3.5', resending && 'animate-spin')} />
                        {resending ? 'Sending...' : 'Resend code'}
                      </Button>

                      {cooldown > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          Resend available in {cooldown} seconds
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Back to Edit Email */}
              {!verifiedSuccess && (
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError('');
                      setStatusMessage('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Change email address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------
  // VIEW: Signup Initial Form
  // ----------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Create your workspace</h1>
            <p className="text-sm text-muted-foreground mb-6">Start managing client deals professionally.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Alex Morgan"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="password">Password</Label>
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
                {password && (
                  <div className="space-y-1 pt-1">
                    {passwordChecks.map((check, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <Check className={cn('h-3 w-3', check.met ? 'text-emerald-500' : 'text-muted-foreground/40')} />
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
                  className="mt-1 h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground font-normal leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Sending code...' : 'Sign up'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
