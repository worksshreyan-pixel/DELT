"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const logo_1 = require("@/components/logo");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
function ForgotPasswordPage() {
    const supabase = (0, client_1.createClient)();
    const isConfigured = (0, env_1.hasSupabasePublicConfig)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [sent, setSent] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setLoading(true);
        if (!isConfigured) {
            setTimeout(() => {
                setLoading(false);
                setSent(true);
            }, 500);
            return;
        }
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${env_1.env.app.url}/auth/reset-password`,
            });
            if (resetError) {
                const msg = (resetError.message || '').toLowerCase();
                if (msg.includes('rate limit') || resetError.status === 429) {
                    setError('Too many verification attempts. Please wait before requesting another code.');
                }
                else {
                    setError(resetError.message);
                }
            }
            else {
                setSent(true);
            }
        }
        catch (err) {
            setError(err?.message || 'Failed to send password reset email.');
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <logo_1.Logo size="lg"/>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {!sent ? (<>
                <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Reset password</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter your email address and we will send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="email">Email</label_1.Label>
                    <div className="relative">
                      <lucide_react_1.Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                      <input_1.Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                    </div>
                  </div>

                  {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <lucide_react_1.AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                      <span>{error}</span>
                    </div>)}

                  <button_1.Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? 'Sending link...' : 'Send reset link'}
                    {!loading && <lucide_react_1.ArrowRight className="h-4 w-4"/>}
                  </button_1.Button>
                </form>
              </>) : (<div className="text-center space-y-4 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                  <lucide_react_1.CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent password reset instructions to <strong>{email}</strong>.
                </p>
              </div>)}

            <div className="mt-6 pt-4 border-t border-border text-center">
              <link_1.default href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <lucide_react_1.ArrowLeft className="h-3.5 w-3.5"/>
                Back to login
              </link_1.default>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
exports.default = ForgotPasswordPage;
