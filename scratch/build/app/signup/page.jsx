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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
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
    var router = useRouter();
    var supabase = createClient();
    // Form State
    var _a = useState(''), name = _a[0], setName = _a[1];
    var _b = useState(''), email = _b[0], setEmail = _b[1];
    var _c = useState(''), password = _c[0], setPassword = _c[1];
    var _d = useState(false), showPassword = _d[0], setShowPassword = _d[1];
    var _e = useState(false), agreed = _e[0], setAgreed = _e[1];
    var _f = useState(false), loading = _f[0], setLoading = _f[1];
    var _g = useState(''), error = _g[0], setError = _g[1];
    // OTP State
    var _h = useState('form'), step = _h[0], setStep = _h[1];
    var _j = useState(['', '', '', '', '', '']), otp = _j[0], setOtp = _j[1];
    var _k = useState(false), verifying = _k[0], setVerifying = _k[1];
    var _l = useState(false), verifiedSuccess = _l[0], setVerifiedSuccess = _l[1];
    var _m = useState(false), resending = _m[0], setResending = _m[1];
    var _o = useState(''), statusMessage = _o[0], setStatusMessage = _o[1];
    var _p = useState(0), cooldown = _p[0], setCooldown = _p[1];
    var _q = useState(600), expiresSeconds = _q[0], setExpiresSeconds = _q[1]; // 10 minutes
    var otpRefs = useRef([]);
    // Password Validation Checks
    var passwordChecks = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Contains a number', met: /\d/.test(password) },
    ];
    // Cooldown Countdown Timer
    useEffect(function () {
        if (cooldown <= 0)
            return;
        var timer = setInterval(function () {
            setCooldown(function (prev) { return Math.max(0, prev - 1); });
        }, 1000);
        return function () { return clearInterval(timer); };
    }, [cooldown]);
    // OTP Expiry Countdown Timer
    useEffect(function () {
        if (step !== 'otp' || expiresSeconds <= 0)
            return;
        var timer = setInterval(function () {
            setExpiresSeconds(function (prev) { return Math.max(0, prev - 1); });
        }, 1000);
        return function () { return clearInterval(timer); };
    }, [step, expiresSeconds]);
    // Format Expiry MM:SS
    function formatTime(seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return "".concat(mins.toString().padStart(2, '0'), ":").concat(secs.toString().padStart(2, '0'));
    }
    // 1. Submit Initial Signup & Request OTP
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var res, json, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        setError('');
                        if (!name.trim() || !email.trim() || !password) {
                            setError('Please fill in all fields.');
                            return [2 /*return*/];
                        }
                        if (password.length < 8) {
                            setError('Password must be at least 8 characters.');
                            return [2 /*return*/];
                        }
                        if (!agreed) {
                            setError('Please accept the terms and privacy policy to continue.');
                            return [2 /*return*/];
                        }
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/auth/signup-otp/request', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: name.trim(),
                                    email: email.trim().toLowerCase(),
                                    password: password,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _a.sent();
                        if (!res.ok || json.error) {
                            setError(json.error || 'Failed to create account.');
                            setLoading(false);
                            return [2 /*return*/];
                        }
                        // Transition to OTP screen
                        setStep('otp');
                        setCooldown(json.cooldownSeconds || 30);
                        setExpiresSeconds(600);
                        setStatusMessage('');
                        setOtp(['', '', '', '', '', '']);
                        setTimeout(function () { var _a; return (_a = otpRefs.current[0]) === null || _a === void 0 ? void 0 : _a.focus(); }, 150);
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _a.sent();
                        console.error('Signup request error:', err_1);
                        setError('Network error requesting verification code. Please try again.');
                        return [3 /*break*/, 6];
                    case 5:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    // 2. Verify 6-Digit OTP
    function handleVerifyOtp(codeToVerify) {
        return __awaiter(this, void 0, void 0, function () {
            var code, res, json, authErr_1, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (verifying)
                            return [2 /*return*/];
                        code = (codeToVerify || otp.join('')).trim();
                        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
                            setError('Please enter all 6 digits of your verification code.');
                            return [2 /*return*/];
                        }
                        setVerifying(true);
                        setError('');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, fetch('/api/auth/signup-otp/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    email: email.trim().toLowerCase(),
                                    otp: code,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _a.sent();
                        if (!res.ok || json.error) {
                            setError(json.error || 'Incorrect code. Please try again.');
                            setVerifying(false);
                            return [2 /*return*/];
                        }
                        // Success! Account is verified
                        setVerifiedSuccess(true);
                        setStatusMessage('Email verified');
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, supabase.auth.signInWithPassword({
                                email: email.trim().toLowerCase(),
                                password: password,
                            })];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        authErr_1 = _a.sent();
                        console.warn('Auto-login notice:', authErr_1);
                        return [3 /*break*/, 7];
                    case 7:
                        // Automatically continue to dashboard
                        setTimeout(function () {
                            router.push('/dashboard');
                            router.refresh();
                        }, 1000);
                        return [3 /*break*/, 9];
                    case 8:
                        err_2 = _a.sent();
                        console.error('Verification error:', err_2);
                        setError('Verification failed. Please check your connection and try again.');
                        setVerifying(false);
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    // 3. Resend OTP
    function handleResendOtp() {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var res, json, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (resending || cooldown > 0)
                            return [2 /*return*/];
                        setResending(true);
                        setError('');
                        setStatusMessage('');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/auth/signup-otp/request', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: name.trim(),
                                    email: email.trim().toLowerCase(),
                                    password: password,
                                }),
                            })];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _b.sent();
                        if (!res.ok || json.error) {
                            setError(json.error || 'Unable to send the verification email. Please try again.');
                            if (json.cooldownSeconds) {
                                setCooldown(json.cooldownSeconds);
                            }
                        }
                        else {
                            setStatusMessage('New code sent');
                            setCooldown(json.cooldownSeconds || 30);
                            setExpiresSeconds(600);
                            setOtp(['', '', '', '', '', '']);
                            (_a = otpRefs.current[0]) === null || _a === void 0 ? void 0 : _a.focus();
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        err_3 = _b.sent();
                        setError('Unable to send the verification email. Please try again.');
                        return [3 /*break*/, 6];
                    case 5:
                        setResending(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    // OTP Input Field Handlers
    function handleOtpChange(idx, value) {
        var _a;
        if (!/^\d?$/.test(value))
            return;
        var newOtp = __spreadArray([], otp, true);
        newOtp[idx] = value;
        setOtp(newOtp);
        if (value && idx < 5) {
            (_a = otpRefs.current[idx + 1]) === null || _a === void 0 ? void 0 : _a.focus();
        }
        if (value && idx === 5 && newOtp.every(function (d) { return d !== ''; })) {
            handleVerifyOtp(newOtp.join(''));
        }
    }
    function handleOtpKeyDown(idx, e) {
        var _a;
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            (_a = otpRefs.current[idx - 1]) === null || _a === void 0 ? void 0 : _a.focus();
        }
    }
    function handleOtpPaste(e) {
        var _a;
        e.preventDefault();
        var pasted = e.clipboardData.getData('text').trim();
        if (!pasted)
            return;
        var digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
        if (digits.length === 0)
            return;
        var newOtp = __spreadArray([], otp, true);
        digits.forEach(function (d, i) {
            newOtp[i] = d;
        });
        setOtp(newOtp);
        var focusIdx = Math.min(digits.length, 5);
        (_a = otpRefs.current[focusIdx]) === null || _a === void 0 ? void 0 : _a.focus();
        if (digits.length === 6) {
            handleVerifyOtp(digits.join(''));
        }
    }
    // ----------------------------------------------------------------------------
    // VIEW: OTP Verification Screen
    // ----------------------------------------------------------------------------
    if (step === 'otp') {
        return (<div className="flex min-h-screen flex-col bg-muted/20">
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <Logo size="lg"/>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm text-center space-y-5">
              {/* Header Icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                {verifiedSuccess ? (<CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400"/>) : (<KeyRound className="h-7 w-7 text-primary"/>)}
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
              {statusMessage && (<div className={cn('flex items-center justify-center gap-2 rounded-lg p-2.5 text-xs font-medium', verifiedSuccess
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-primary/10 text-primary')}>
                  <CheckCircle2 className="h-4 w-4 shrink-0"/>
                  <span>{statusMessage}</span>
                </div>)}

              {/* Error Banner */}
              {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <span>{error}</span>
                </div>)}

              {/* 6-Digit OTP Inputs */}
              {!verifiedSuccess && (<div className="space-y-4 pt-2">
                  <div className="flex justify-center gap-2">
                    {otp.map(function (digit, idx) { return (<input key={idx} ref={function (el) {
                        otpRefs.current[idx] = el;
                    }} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digit} onChange={function (e) { return handleOtpChange(idx, e.target.value); }} onKeyDown={function (e) { return handleOtpKeyDown(idx, e); }} onPaste={handleOtpPaste} disabled={verifying || verifiedSuccess} className={cn('h-12 w-11 sm:h-14 sm:w-12 rounded-lg border border-input bg-background text-center text-xl font-semibold shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50', digit && 'border-primary/60 bg-muted/20')}/>); })}
                  </div>

                  {/* Expiry Timer */}
                  <div className="text-xs text-muted-foreground">
                    {expiresSeconds > 0 ? (<span>Code expires in <strong className="font-mono text-foreground">{formatTime(expiresSeconds)}</strong></span>) : (<span className="text-destructive font-medium">This code has expired. Request a new code.</span>)}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button onClick={function () { return handleVerifyOtp(); }} disabled={verifying || otp.some(function (d) { return !d; }) || verifiedSuccess} className="w-full gap-2">
                      {verifying ? 'Verifying...' : 'Verify'}
                      {!verifying && <ArrowRight className="h-4 w-4"/>}
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <Button variant="ghost" size="sm" onClick={handleResendOtp} disabled={resending || cooldown > 0 || verifiedSuccess} className="text-xs gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground">
                        <RefreshCw className={cn('h-3.5 w-3.5', resending && 'animate-spin')}/>
                        {resending ? 'Sending...' : 'Resend code'}
                      </Button>

                      {cooldown > 0 && (<span className="text-[11px] text-muted-foreground">
                          Resend available in {cooldown} seconds
                        </span>)}
                    </div>
                  </div>
                </div>)}

              {/* Back to Edit Email */}
              {!verifiedSuccess && (<div className="pt-2 border-t border-border">
                  <button type="button" onClick={function () {
                    setStep('form');
                    setError('');
                    setStatusMessage('');
                }} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
                    Change email address
                  </button>
                </div>)}
            </div>
          </div>
        </div>
      </div>);
    }
    // ----------------------------------------------------------------------------
    // VIEW: Signup Initial Form
    // ----------------------------------------------------------------------------
    return (<div className="flex min-h-screen flex-col bg-muted/20">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo size="lg"/>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-display font-semibold tracking-tight mb-1">Create your workspace</h1>
            <p className="text-sm text-muted-foreground mb-6">Start managing client deals professionally.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="name" type="text" placeholder="Alex Morgan" className="pl-9" value={name} onChange={function (e) { return setName(e.target.value); }} required/>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={function (e) { return setEmail(e.target.value); }} required/>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-9" value={password} onChange={function (e) { return setPassword(e.target.value); }} required/>
                  <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                {password && (<div className="space-y-1 pt-1">
                    {passwordChecks.map(function (check, i) { return (<div key={i} className="flex items-center gap-1.5 text-xs">
                        <Check className={cn('h-3 w-3', check.met ? 'text-emerald-500' : 'text-muted-foreground/40')}/>
                        <span className={check.met ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
                          {check.label}
                        </span>
                      </div>); })}
                  </div>)}
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input type="checkbox" id="terms" checked={agreed} onChange={function (e) { return setAgreed(e.target.checked); }} className="mt-1 h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"/>
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

              {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                  <span>{error}</span>
                </div>)}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Sending code...' : 'Sign up'}
                {!loading && <ArrowRight className="h-4 w-4"/>}
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
    </div>);
}
