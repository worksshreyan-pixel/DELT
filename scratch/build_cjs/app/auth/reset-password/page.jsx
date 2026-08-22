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
function ResetPasswordPage() {
    const router = (0, navigation_1.useRouter)();
    const supabase = (0, client_1.createClient)();
    const isConfigured = (0, env_1.hasSupabasePublicConfig)();
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [success, setSuccess] = (0, react_1.useState)(false);
    async function handleSubmit(e) {
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
            }
            else {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            }
        }
        catch (err) {
            setError(err?.message || 'Failed to update password.');
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
            {!success ? (<>
                <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Set new password</h1>
                <p className="text-sm text-muted-foreground mb-6">Enter your new secure password below.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="password">New Password</label_1.Label>
                    <div className="relative">
                      <lucide_react_1.Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                      <input_1.Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <lucide_react_1.EyeOff className="h-4 w-4"/> : <lucide_react_1.Eye className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label_1.Label htmlFor="confirmPassword">Confirm Password</label_1.Label>
                    <div className="relative">
                      <lucide_react_1.Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                      <input_1.Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
                    </div>
                  </div>

                  {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <lucide_react_1.AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                      <span>{error}</span>
                    </div>)}

                  <button_1.Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? 'Updating password...' : 'Update password'}
                    {!loading && <lucide_react_1.ArrowRight className="h-4 w-4"/>}
                  </button_1.Button>
                </form>
              </>) : (<div className="text-center space-y-4 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                  <lucide_react_1.CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="text-lg font-semibold">Password updated</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been changed. Redirecting to your workspace...
                </p>
                <link_1.default href="/dashboard">
                  <button_1.Button className="w-full mt-2">Go to Dashboard</button_1.Button>
                </link_1.default>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
exports.default = ResetPasswordPage;
