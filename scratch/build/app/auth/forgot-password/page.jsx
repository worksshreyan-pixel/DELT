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
import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { env, hasSupabasePublicConfig } from '@/lib/env';
export default function ForgotPasswordPage() {
    var supabase = createClient();
    var isConfigured = hasSupabasePublicConfig();
    var _a = useState(''), email = _a[0], setEmail = _a[1];
    var _b = useState(false), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), sent = _c[0], setSent = _c[1];
    var _d = useState(''), error = _d[0], setError = _d[1];
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var resetError, msg, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        setError('');
                        if (!email) {
                            setError('Please enter your email address.');
                            return [2 /*return*/];
                        }
                        setLoading(true);
                        if (!isConfigured) {
                            setTimeout(function () {
                                setLoading(false);
                                setSent(true);
                            }, 500);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, supabase.auth.resetPasswordForEmail(email.trim(), {
                                redirectTo: "".concat(env.app.url, "/auth/reset-password"),
                            })];
                    case 2:
                        resetError = (_a.sent()).error;
                        if (resetError) {
                            msg = (resetError.message || '').toLowerCase();
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
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        setError((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Failed to send password reset email.');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo size="lg"/>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {!sent ? (<>
                <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Reset password</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter your email address and we will send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                      <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={function (e) { return setEmail(e.target.value); }} required/>
                    </div>
                  </div>

                  {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                      <span>{error}</span>
                    </div>)}

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? 'Sending link...' : 'Send reset link'}
                    {!loading && <ArrowRight className="h-4 w-4"/>}
                  </Button>
                </form>
              </>) : (<div className="text-center space-y-4 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent password reset instructions to <strong>{email}</strong>.
                </p>
              </div>)}

            <div className="mt-6 pt-4 border-t border-border text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5"/>
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
