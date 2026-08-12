'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig, env } from '@/lib/env';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const isConfigured = hasSupabasePublicConfig();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
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

    if (!isConfigured) {
      setTimeout(() => {
        setLoading(false);
        router.push('/dashboard');
      }, 500);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            displayName: name.trim(),
          },
          emailRedirectTo: `${env.app.url}/auth/callback?next=/dashboard`,
        },
      });

      if (signUpError) {
        const msg = (signUpError.message || '').toLowerCase();
        if (msg.includes('rate limit') || (signUpError as any).status === 429) {
          setError('Too many verification attempts. Please wait before requesting another code.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // If user is returned and session is established immediately (e.g. email confirmations disabled)
      if (data.session) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Email confirmation required
      setVerificationSent(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    setError('');
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${env.app.url}/auth/callback?next=/dashboard`,
        },
      });
      if (resendErr) {
        const msg = (resendErr.message || '').toLowerCase();
        if (msg.includes('rate limit') || (resendErr as any).status === 429) {
          setError('Too many verification attempts. Please wait before requesting another code.');
        } else {
          setError(resendErr.message);
        }
      } else {
        setResendSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="flex min-h-screen flex-col bg-muted/20">
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <Logo size="lg" />
            </div>
            <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-display font-semibold tracking-tight">Check your email</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a verification link to <strong className="text-foreground">{email}</strong>. Please click the link to confirm your account and access your workspace.
              </p>
              {resendSuccess && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verification email resent successfully!</span>
                </div>
              )}
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="outline" onClick={handleResend} disabled={resending} className="w-full text-xs">
                  {resending ? 'Resending email...' : 'Resend verification email'}
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full text-xs">
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <div className="flex flex-wrap gap-3 pt-1">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1.5 text-xs">
                        <Check className={`h-3 w-3 ${check.met ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                        <span className={check.met ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  I agree to the Terms and Privacy Policy.
                </span>
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
