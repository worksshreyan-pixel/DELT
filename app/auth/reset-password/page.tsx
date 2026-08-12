'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const isConfigured = hasSupabasePublicConfig();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (!isConfigured) {
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 500);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {!success ? (
              <>
                <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Set new password</h1>
                <p className="text-sm text-muted-foreground mb-6">Enter your new secure password below.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-9"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? 'Updating password...' : 'Update password'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold">Password updated</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been changed. Redirecting to your workspace...
                </p>
                <Link href="/dashboard">
                  <Button className="w-full mt-2">Go to Dashboard</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
