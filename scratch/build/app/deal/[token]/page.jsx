'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Lock, Send, Check, FileCheck, Clock, Download, ArrowLeftRight, CreditCard, Flag, AlertCircle, RefreshCw, Eye, } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealStatusBadge, PaymentStatusBadge, DeliverableStatusBadge } from '@/components/deal-status-badge';
import { PriceProposalCard } from '@/components/price-proposal-card';
import { ChatMessageItem } from '@/components/chat-message';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { addProposalToStore, respondToProposalInStore, simulatePaymentInStore } from '@/lib/app-store';
function getInitials(name) {
    if (!name)
        return 'CL';
    return name.split(' ').map(function (n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
}
export default function ClientDealPage() {
    var params = useParams();
    var token = params.token;
    var _a = useState(null), deal = _a[0], setDeal = _a[1];
    var _b = useState(null), dealMeta = _b[0], setDealMeta = _b[1];
    var _c = useState(false), dealNotFound = _c[0], setDealNotFound = _c[1];
    var _d = useState(true), loadingDeal = _d[0], setLoadingDeal = _d[1];
    var _e = useState(false), verified = _e[0], setVerified = _e[1];
    var _f = useState(''), email = _f[0], setEmail = _f[1];
    var _g = useState(['', '', '', '', '', '']), otp = _g[0], setOtp = _g[1];
    var _h = useState(false), otpSent = _h[0], setOtpSent = _h[1];
    var _j = useState(false), isSending = _j[0], setIsSending = _j[1];
    var _k = useState(false), verifying = _k[0], setVerifying = _k[1];
    var _l = useState(''), error = _l[0], setError = _l[1];
    var _m = useState(''), statusMessage = _m[0], setStatusMessage = _m[1];
    var _o = useState(0), cooldown = _o[0], setCooldown = _o[1];
    var otpRefs = useRef([]);
    var isSendingRef = useRef(false);
    var isVerifyingRef = useRef(false);
    // Cooldown countdown timer
    useEffect(function () {
        if (cooldown <= 0)
            return;
        var timer = setInterval(function () {
            setCooldown(function (prev) { return (prev > 0 ? prev - 1 : 0); });
        }, 1000);
        return function () { return clearInterval(timer); };
    }, [cooldown]);
    // Initial Deal Metadata & Session Verification
    useEffect(function () {
        var isMounted = true;
        function loadDeal() {
            return __awaiter(this, void 0, void 0, function () {
                var savedToken, res, json, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setLoadingDeal(true);
                            setError('');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            savedToken = typeof window !== 'undefined' ? localStorage.getItem("delt_client_session_".concat(token)) : null;
                            return [4 /*yield*/, fetch("/api/deals/".concat(encodeURIComponent(token), "/verify-access"), {
                                    method: 'POST',
                                    headers: __assign({ 'Content-Type': 'application/json' }, (savedToken ? { 'x-client-session-token': savedToken } : {})),
                                })];
                        case 2:
                            res = _a.sent();
                            if (!isMounted)
                                return [2 /*return*/];
                            if (res.status === 404) {
                                setDealNotFound(true);
                                setLoadingDeal(false);
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, res.json()];
                        case 3:
                            json = _a.sent();
                            if (json.authorized && json.deal) {
                                setDeal(json.deal);
                                setEmail(json.clientEmail || json.deal.clientEmail || '');
                                setVerified(true);
                            }
                            else {
                                setDealMeta({
                                    title: json.dealTitle || 'Deal Workspace',
                                    clientEmail: json.clientEmail || '',
                                    creatorName: json.creatorName || 'Creator',
                                });
                                if (json.clientEmail) {
                                    setEmail(json.clientEmail);
                                }
                                if (json.error) {
                                    setError(json.error);
                                }
                            }
                            return [3 /*break*/, 6];
                        case 4:
                            e_1 = _a.sent();
                            if (isMounted) {
                                console.error('Error verifying deal session:', e_1);
                                setError('Failed to connect to Deal workspace.');
                            }
                            return [3 /*break*/, 6];
                        case 5:
                            if (isMounted) {
                                setLoadingDeal(false);
                            }
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        if (token) {
            loadDeal();
        }
        return function () {
            isMounted = false;
        };
    }, [token]);
    // Request 6-Digit OTP via Resend
    function handleSendOtp() {
        return __awaiter(this, void 0, void 0, function () {
            var targetEmail, res, json, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isSendingRef.current || isSending || cooldown > 0)
                            return [2 /*return*/];
                        isSendingRef.current = true;
                        targetEmail = (email || '').trim().toLowerCase();
                        if (!targetEmail) {
                            setError('Please enter your email address.');
                            isSendingRef.current = false;
                            return [2 /*return*/];
                        }
                        // Client email match check against private workspace meta
                        if ((dealMeta === null || dealMeta === void 0 ? void 0 : dealMeta.clientEmail) && targetEmail !== dealMeta.clientEmail.toLowerCase()) {
                            setError('This email address is not authorized for this private Deal workspace.');
                            isSendingRef.current = false;
                            return [2 /*return*/];
                        }
                        setIsSending(true);
                        setError('');
                        setStatusMessage('');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("/api/deals/".concat(encodeURIComponent(token), "/request-otp"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: targetEmail }),
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _a.sent();
                        if (!res.ok || !json.success) {
                            setError(json.error || 'Failed to send verification code.');
                            if (json.cooldownSeconds) {
                                setCooldown(json.cooldownSeconds);
                            }
                            return [2 /*return*/];
                        }
                        setOtpSent(true);
                        setOtp(['', '', '', '', '', '']);
                        setCooldown(30);
                        setStatusMessage("Code sent to ".concat(targetEmail));
                        setTimeout(function () { var _a; return (_a = otpRefs.current[0]) === null || _a === void 0 ? void 0 : _a.focus(); }, 150);
                        return [3 /*break*/, 6];
                    case 4:
                        e_2 = _a.sent();
                        console.error('OTP request error:', e_2);
                        setError('Unable to send the verification email. Please try again.');
                        return [3 /*break*/, 6];
                    case 5:
                        isSendingRef.current = false;
                        setIsSending(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    // Verify 6-Digit OTP submitted by client
    function handleVerifyOtp(codeToVerify) {
        return __awaiter(this, void 0, void 0, function () {
            var code, targetEmail, serverVerifyRes, serverVerifyJson, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isVerifyingRef.current || verifying)
                            return [2 /*return*/];
                        isVerifyingRef.current = true;
                        code = (codeToVerify || otp.join('')).trim();
                        if (code.length !== 6) {
                            setError('Please enter all 6 digits of the verification code.');
                            isVerifyingRef.current = false;
                            return [2 /*return*/];
                        }
                        targetEmail = (email || (dealMeta === null || dealMeta === void 0 ? void 0 : dealMeta.clientEmail) || '').trim().toLowerCase();
                        if (!targetEmail) {
                            setError('Email address is required.');
                            isVerifyingRef.current = false;
                            return [2 /*return*/];
                        }
                        setVerifying(true);
                        setError('');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("/api/deals/".concat(encodeURIComponent(token), "/verify-otp"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: targetEmail, otp: code }),
                            })];
                    case 2:
                        serverVerifyRes = _a.sent();
                        return [4 /*yield*/, serverVerifyRes.json()];
                    case 3:
                        serverVerifyJson = _a.sent();
                        if (!serverVerifyRes.ok || !serverVerifyJson.authorized) {
                            setError(serverVerifyJson.error || 'Incorrect code. Please try again.');
                            setVerifying(false);
                            isVerifyingRef.current = false;
                            return [2 /*return*/];
                        }
                        if (serverVerifyJson.clientSessionToken) {
                            localStorage.setItem("delt_client_session_".concat(token), serverVerifyJson.clientSessionToken);
                        }
                        if (serverVerifyJson.deal) {
                            setDeal(serverVerifyJson.deal);
                        }
                        setVerified(true);
                        return [3 /*break*/, 6];
                    case 4:
                        e_3 = _a.sent();
                        console.error('OTP verification error:', e_3);
                        setError('Verification failed. Please try again.');
                        return [3 /*break*/, 6];
                    case 5:
                        isVerifyingRef.current = false;
                        setVerifying(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleSignOutAndSwitch() {
        return __awaiter(this, void 0, void 0, function () {
            var supabase, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        localStorage.removeItem("delt_client_session_".concat(token));
                        supabase = createClient();
                        return [4 /*yield*/, supabase.auth.signOut()];
                    case 1:
                        _a.sent();
                        setVerified(false);
                        setOtpSent(false);
                        setOtp(['', '', '', '', '', '']);
                        setError('');
                        setStatusMessage('');
                        if (dealMeta === null || dealMeta === void 0 ? void 0 : dealMeta.clientEmail) {
                            setEmail(dealMeta.clientEmail);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error('Error signing out:', err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function handleOtpChange(idx, value) {
        var _a;
        if (!/^\d?$/.test(value))
            return;
        var newOtp = __spreadArray([], otp, true);
        newOtp[idx] = value;
        setOtp(newOtp);
        if (value && idx < 5)
            (_a = otpRefs.current[idx + 1]) === null || _a === void 0 ? void 0 : _a.focus();
        if (value && idx === 5 && newOtp.every(function (d) { return d !== ''; })) {
            setTimeout(function () { return handleVerifyOtp(newOtp.join('')); }, 50);
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
            setTimeout(function () { return handleVerifyOtp(newOtp.join('')); }, 100);
        }
    }
    if (loadingDeal) {
        return (<div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
          <p className="text-sm text-muted-foreground">Opening Deal Workspace...</p>
        </div>
      </div>);
    }
    if (dealNotFound) {
        return (<div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <Lock className="h-7 w-7 text-destructive"/>
            </div>
            <h2 className="text-xl font-display font-semibold tracking-tight mb-1">Deal no longer exists</h2>
            <p className="text-sm text-muted-foreground">
              This Deal has been closed or is no longer available. Please verify with your creator.
            </p>
          </CardContent>
        </Card>
      </div>);
    }
    if (!verified || !deal) {
        return (<div className="flex min-h-screen flex-col bg-muted/20">
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex justify-center">
              <Logo size="lg"/>
            </div>
            <Card>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {!otpSent ? (<motion.div key="email" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                          <Lock className="h-5 w-5 text-primary"/>
                        </div>
                        <h1 className="text-lg font-display font-semibold tracking-tight mb-1">Private Client Workspace</h1>
                        <p className="text-sm text-muted-foreground">{(dealMeta === null || dealMeta === void 0 ? void 0 : dealMeta.title) || 'Deal Workspace'}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Your Email Address</Label>
                          <Input id="email" type="email" placeholder="e.g. rahul@example.com" value={email} onChange={function (e) { return setEmail(e.target.value); }} required/>
                          <p className="text-xs text-muted-foreground">
                            Enter the email address where your creator sent this Deal.
                          </p>
                        </div>

                        {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                            <span>{error}</span>
                          </div>)}

                        <Button onClick={handleSendOtp} className="w-full gap-2" disabled={!email || isSending || cooldown > 0}>
                          {isSending
                    ? 'Sending Code...'
                    : cooldown > 0
                        ? "Resend available in ".concat(cooldown, "s")
                        : 'Send OTP'}
                          {!isSending && cooldown <= 0 && <ArrowRight className="h-4 w-4"/>}
                        </Button>
                      </div>
                    </motion.div>) : (<motion.div key="otp" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <div className="mb-6 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5">
                          <ShieldCheck className="h-5 w-5 text-primary"/>
                        </div>
                        <h1 className="text-lg font-display font-semibold tracking-tight mb-1">Enter Verification Code</h1>
                        <p className="text-sm text-muted-foreground">
                          Code sent to <span className="font-medium text-foreground">{email}</span>
                        </p>
                      </div>

                      <div className="space-y-4">
                        {statusMessage && (<div className="rounded-lg bg-primary/5 p-2.5 text-xs text-muted-foreground text-center border border-primary/10">
                            {statusMessage}
                          </div>)}

                        <div className="flex justify-center gap-2">
                          {otp.map(function (digit, i) { return (<Input key={i} ref={function (el) { otpRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} className="h-12 w-12 text-center text-lg font-semibold" value={digit} onChange={function (e) { return handleOtpChange(i, e.target.value); }} onKeyDown={function (e) { return handleOtpKeyDown(i, e); }} onPaste={handleOtpPaste}/>); })}
                        </div>

                        {error && (<div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5"/>
                            <span>{error}</span>
                          </div>)}

                        <Button onClick={function () { return handleVerifyOtp(); }} className="w-full gap-2" disabled={verifying || otp.join('').length !== 6}>
                          {verifying ? 'Verifying...' : 'Verify & Open Workspace'}
                          {!verifying && <ArrowRight className="h-4 w-4"/>}
                        </Button>

                        <div className="flex items-center justify-between pt-2 text-xs">
                          <button type="button" onClick={function () { setOtpSent(false); setError(''); }} className="text-muted-foreground hover:text-foreground">
                            Change email
                          </button>
                          <button type="button" onClick={handleSendOtp} disabled={cooldown > 0 || isSending} className="text-primary hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1">
                            <RefreshCw className={"h-3 w-3 ".concat(isSending ? 'animate-spin' : '')}/>
                            {cooldown > 0 ? "Resend available in ".concat(cooldown, "s") : 'Resend code'}
                          </button>
                        </div>
                      </div>
                    </motion.div>)}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>);
    }
    return (<ClientPortal deal={deal} clientEmail={email} clientName={deal.clientName || deal.client_name || 'Client'} creatorName="Creator"/>);
}
// ---------------------------------------------------------------------------
// Client Portal Active Component
// ---------------------------------------------------------------------------
function ClientPortal(_a) {
    var deal = _a.deal, clientEmail = _a.clientEmail, clientName = _a.clientName, creatorName = _a.creatorName;
    var _b = useState(deal), currentDeal = _b[0], setCurrentDeal = _b[1];
    var _c = useState([]), messages = _c[0], setMessages = _c[1];
    var _d = useState([]), proposals = _d[0], setProposals = _d[1];
    var _e = useState([]), deliverables = _e[0], setDeliverables = _e[1];
    var _f = useState([]), fileVersions = _f[0], setFileVersions = _f[1];
    var _g = useState([]), events = _g[0], setEvents = _g[1];
    var _h = useState(''), input = _h[0], setInput = _h[1];
    var _j = useState(false), proposalOpen = _j[0], setProposalOpen = _j[1];
    var _k = useState(false), paymentOpen = _k[0], setPaymentOpen = _k[1];
    var _l = useState(false), changesOpen = _l[0], setChangesOpen = _l[1];
    var _m = useState(''), changeFeedback = _m[0], setChangeFeedback = _m[1];
    var _o = useState(''), proposalPrice = _o[0], setProposalPrice = _o[1];
    var _p = useState(''), proposalReason = _p[0], setProposalReason = _p[1];
    var _q = useState(false), paying = _q[0], setPaying = _q[1];
    var _r = useState(false), downloading = _r[0], setDownloading = _r[1];
    var scrollRef = useRef(null);
    var _s = useState(null), activeProposal = _s[0], setActiveProposal = _s[1];
    var _t = useState(false), submittingProposal = _t[0], setSubmittingProposal = _t[1];
    var _u = useState(false), previewModalOpen = _u[0], setPreviewModalOpen = _u[1];
    var _v = useState(''), previewUrl = _v[0], setPreviewUrl = _v[1];
    var _w = useState(''), previewMimeType = _w[0], setPreviewMimeType = _w[1];
    var _x = useState(''), previewFileName = _x[0], setPreviewFileName = _x[1];
    var _y = useState(null), previewLoadingFileId = _y[0], setPreviewLoadingFileId = _y[1];
    var isClosed = currentDeal.status === 'closed';
    var isPaid = currentDeal.paymentStatus === 'paid' || currentDeal.status === 'completed';
    // Load deliverable files & messages from Supabase (Single, stable effect on mount)
    useEffect(function () {
        if (!hasSupabasePublicConfig())
            return;
        var supabase = createClient();
        function loadData() {
            return __awaiter(this, void 0, void 0, function () {
                var dbDelivs, dbVersions, dbProps, dbMsgs, dbEvents;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, supabase.from('deliverables').select('*').eq('deal_id', deal.id)];
                        case 1:
                            dbDelivs = (_a.sent()).data;
                            if (dbDelivs && dbDelivs.length > 0) {
                                setDeliverables(dbDelivs.map(function (d) { return ({
                                    id: d.id,
                                    dealId: d.deal_id,
                                    name: d.name,
                                    description: d.description,
                                    status: d.status,
                                    createdAt: d.created_at,
                                }); }));
                            }
                            return [4 /*yield*/, supabase.from('file_versions').select('*').eq('deal_id', deal.id).order('version', { ascending: true })];
                        case 2:
                            dbVersions = (_a.sent()).data;
                            if (dbVersions && dbVersions.length > 0) {
                                setFileVersions(dbVersions.map(function (v) { return ({
                                    id: v.id,
                                    deliverableId: v.deliverable_id,
                                    dealId: v.deal_id,
                                    version: v.version,
                                    description: v.description,
                                    uploaderId: v.uploader_id,
                                    uploaderName: v.uploader_name,
                                    files: Array.isArray(v.files) ? v.files : [],
                                    status: v.status,
                                    locked: Boolean(v.locked),
                                    createdAt: v.created_at,
                                }); }));
                            }
                            return [4 /*yield*/, supabase.from('price_proposals').select('*').eq('deal_id', deal.id).order('created_at', { ascending: true })];
                        case 3:
                            dbProps = (_a.sent()).data;
                            if (dbProps && dbProps.length > 0) {
                                setProposals(dbProps.map(function (p) { return ({
                                    id: p.id,
                                    dealId: p.deal_id,
                                    direction: p.direction,
                                    previousPrice: Number(p.previous_price),
                                    proposedPrice: Number(p.proposed_price),
                                    reason: p.reason,
                                    state: p.state,
                                    proposedBy: p.proposed_by,
                                    proposedByName: p.proposed_by_name,
                                    proposedByRole: p.proposed_by_role,
                                    counterProposalId: p.counter_proposal_id || p.parent_proposal_id || p.parentProposalId,
                                    createdAt: p.created_at,
                                }); }));
                            }
                            return [4 /*yield*/, supabase.from('deal_messages').select('*').eq('deal_id', deal.id).order('created_at', { ascending: true })];
                        case 4:
                            dbMsgs = (_a.sent()).data;
                            if (dbMsgs && dbMsgs.length > 0) {
                                setMessages(dbMsgs.map(function (m) { return ({
                                    id: m.id,
                                    dealId: m.deal_id,
                                    senderId: m.sender_id,
                                    senderName: m.sender_name,
                                    senderRole: m.sender_role,
                                    type: m.type,
                                    content: m.content,
                                    proposalId: m.proposal_id,
                                    createdAt: m.created_at,
                                }); }));
                            }
                            return [4 /*yield*/, supabase.from('deal_events').select('*').eq('deal_id', deal.id).order('created_at', { ascending: false })];
                        case 5:
                            dbEvents = (_a.sent()).data;
                            if (dbEvents && dbEvents.length > 0) {
                                setEvents(dbEvents.map(function (e) { return ({
                                    id: e.id,
                                    dealId: e.deal_id,
                                    type: e.type,
                                    actorName: e.actor_name || 'System',
                                    actorRole: e.actor_role || 'system',
                                    description: e.description,
                                    createdAt: e.created_at,
                                }); }));
                            }
                            return [2 /*return*/];
                    }
                });
            });
        }
        loadData();
        // Scoped Realtime channel
        var channel = supabase
            .channel("deal:".concat(deal.id))
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: "deal_id=eq.".concat(deal.id) }, function (payload) {
            var raw = payload.new;
            var formattedMsg = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || deal.id,
                senderId: raw.sender_id || raw.senderId || 'user',
                senderName: raw.sender_name || raw.senderName || 'User',
                senderRole: raw.sender_role || raw.senderRole || 'client',
                type: raw.type,
                content: raw.content,
                proposalId: raw.proposal_id || raw.proposalId,
                createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
            };
            setMessages(function (prev) {
                var exists = prev.some(function (m) { return m.id === formattedMsg.id; });
                if (exists)
                    return prev;
                var filtered = prev.filter(function (m) { return !(m.id.startsWith('msg_') && m.content === formattedMsg.content); });
                return __spreadArray(__spreadArray([], filtered, true), [formattedMsg], false);
            });
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'price_proposals', filter: "deal_id=eq.".concat(deal.id) }, function (payload) {
            var _a, _b, _c, _d;
            var raw = payload.new;
            var formattedProp = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || deal.id,
                direction: raw.direction,
                previousPrice: Number((_b = (_a = raw.previous_price) !== null && _a !== void 0 ? _a : raw.previousPrice) !== null && _b !== void 0 ? _b : 0),
                proposedPrice: Number((_d = (_c = raw.proposed_price) !== null && _c !== void 0 ? _c : raw.proposedPrice) !== null && _d !== void 0 ? _d : 0),
                reason: raw.reason,
                state: raw.state,
                proposedBy: raw.proposed_by || raw.proposedBy || 'user',
                proposedByName: raw.proposed_by_name || raw.proposedByName || 'User',
                proposedByRole: raw.proposed_by_role || raw.proposedByRole || 'client',
                counterProposalId: raw.parent_proposal_id || raw.parentProposalId || raw.counter_proposal_id || raw.counterProposalId,
                createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
            };
            if (payload.eventType === 'INSERT') {
                setProposals(function (prev) {
                    var filtered = prev.filter(function (p) { return !(p.id.startsWith('prop_') && p.proposedPrice === formattedProp.proposedPrice && p.proposedByRole === formattedProp.proposedByRole); });
                    if (filtered.some(function (p) { return p.id === formattedProp.id; }))
                        return filtered;
                    return __spreadArray(__spreadArray([], filtered, true), [formattedProp], false);
                });
            }
            else if (payload.eventType === 'UPDATE') {
                setProposals(function (prev) {
                    return prev.map(function (p) { return (p.id === formattedProp.id ? formattedProp : p); });
                });
            }
        })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals', filter: "id=eq.".concat(deal.id) }, function (payload) {
            var updated = payload.new;
            setCurrentDeal(function (prev) { return (__assign(__assign(__assign({}, prev), updated), { paymentStatus: updated.payment_status || prev.paymentStatus, lastActivityAt: updated.last_activity_at || prev.lastActivityAt })); });
            if (updated.payment_status === 'paid' || updated.status === 'completed') {
                setDeliverables(function (prev) { return prev.map(function (d) { return (__assign(__assign({}, d), { status: 'approved' })); }); });
                setFileVersions(function (prev) { return prev.map(function (v) { return (__assign(__assign({}, v), { status: 'approved', locked: false })); }); });
            }
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables', filter: "deal_id=eq.".concat(deal.id) }, function (payload) {
            var raw = payload.new;
            var updatedDel = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId,
                name: raw.name,
                description: raw.description,
                status: raw.status,
                createdAt: raw.created_at || raw.createdAt,
            };
            setDeliverables(function (prev) {
                var exists = prev.some(function (d) { return d.id === updatedDel.id; });
                if (exists) {
                    return prev.map(function (d) { return (d.id === updatedDel.id ? updatedDel : d); });
                }
                return __spreadArray(__spreadArray([], prev, true), [updatedDel], false);
            });
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'file_versions', filter: "deal_id=eq.".concat(deal.id) }, function (payload) {
            var raw = payload.new;
            var updatedVer = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId,
                deliverableId: raw.deliverable_id || raw.deliverableId,
                version: raw.version,
                description: raw.description,
                uploaderId: raw.uploader_id || raw.uploaderId || 'creator',
                uploaderName: raw.uploader_name || raw.uploaderName || 'Creator',
                status: raw.status,
                locked: raw.locked,
                files: raw.files || [],
                createdAt: raw.created_at || raw.createdAt,
            };
            setFileVersions(function (prev) {
                var exists = prev.some(function (v) { return v.id === updatedVer.id; });
                if (exists) {
                    return prev.map(function (v) { return (v.id === updatedVer.id ? updatedVer : v); });
                }
                return __spreadArray(__spreadArray([], prev, true), [updatedVer], false);
            });
        })
            .subscribe();
        return function () {
            supabase.removeChannel(channel);
        };
    }, [deal.id]);
    useEffect(function () {
        var _a;
        (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);
    function sendMessage() {
        return __awaiter(this, void 0, void 0, function () {
            var text, optId, optMsg, res, data, serverMsg_1, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!input.trim())
                            return [2 /*return*/];
                        text = input.trim();
                        setInput('');
                        optId = "msg_".concat(Date.now());
                        optMsg = {
                            id: optId,
                            dealId: currentDeal.id,
                            senderId: 'client',
                            senderName: clientName,
                            senderRole: 'client',
                            type: 'text',
                            content: text,
                            createdAt: new Date().toISOString(),
                        };
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [optMsg], false); });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch('/api/messages/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    senderName: clientName,
                                    senderRole: 'client',
                                    type: 'text',
                                    content: text,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = _a.sent();
                        if (data.message) {
                            serverMsg_1 = {
                                id: data.message.id,
                                dealId: data.message.deal_id,
                                senderId: data.message.sender_id,
                                senderName: data.message.sender_name,
                                senderRole: data.message.sender_role,
                                type: data.message.type,
                                content: data.message.content,
                                createdAt: data.message.created_at,
                            };
                            setMessages(function (prev) {
                                return prev.map(function (m) { return (m.id === optId ? serverMsg_1 : m); });
                            });
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_4 = _a.sent();
                        console.error('Error sending message:', e_4);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleProposePrice(e) {
        return __awaiter(this, void 0, void 0, function () {
            var price, res, json, newProp_1, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        price = parseInt(proposalPrice, 10);
                        if (!price || price <= 0 || submittingProposal)
                            return [2 /*return*/];
                        setSubmittingProposal(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/negotiation/propose', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    proposedPrice: price,
                                    reason: proposalReason,
                                    proposedByRole: 'client',
                                    proposedByName: clientName,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _a.sent();
                        if (res.ok && json.proposal) {
                            newProp_1 = {
                                id: json.proposal.id,
                                dealId: json.proposal.deal_id,
                                direction: json.proposal.direction,
                                previousPrice: Number(json.proposal.previous_price),
                                proposedPrice: Number(json.proposal.proposed_price),
                                reason: json.proposal.reason,
                                state: json.proposal.state,
                                proposedBy: json.proposal.proposed_by,
                                proposedByName: json.proposal.proposed_by_name,
                                proposedByRole: json.proposal.proposed_by_role,
                                createdAt: json.proposal.created_at,
                            };
                            addProposalToStore(currentDeal.id, price, proposalReason.trim() || undefined, 'client', clientName);
                            setProposals(function (prev) {
                                var filtered = prev.filter(function (p) { return !p.id.startsWith('prop_'); });
                                if (filtered.some(function (p) { return p.id === newProp_1.id; }))
                                    return filtered;
                                return __spreadArray(__spreadArray([], filtered, true), [newProp_1], false);
                            });
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        e_5 = _a.sent();
                        console.error(e_5);
                        return [3 /*break*/, 6];
                    case 5:
                        setSubmittingProposal(false);
                        setProposalPrice('');
                        setProposalReason('');
                        setProposalOpen(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleCounterProposal(e) {
        return __awaiter(this, void 0, void 0, function () {
            var price, res, json, counterProp_1, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        price = parseInt(proposalPrice, 10);
                        if (!price || price <= 0 || !activeProposal || submittingProposal)
                            return [2 /*return*/];
                        setSubmittingProposal(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/negotiation/propose', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    proposedPrice: price,
                                    reason: proposalReason,
                                    proposedByRole: 'client',
                                    proposedByName: clientName,
                                    parentProposalId: activeProposal.id,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _a.sent();
                        if (res.ok && json.proposal) {
                            counterProp_1 = {
                                id: json.proposal.id,
                                dealId: json.proposal.deal_id,
                                direction: json.proposal.direction,
                                previousPrice: Number(json.proposal.previous_price),
                                proposedPrice: Number(json.proposal.proposed_price),
                                reason: json.proposal.reason,
                                state: json.proposal.state,
                                proposedBy: json.proposal.proposed_by,
                                proposedByName: json.proposal.proposed_by_name,
                                proposedByRole: json.proposal.proposed_by_role,
                                counterProposalId: activeProposal.id,
                                createdAt: json.proposal.created_at,
                            };
                            addProposalToStore(currentDeal.id, price, proposalReason.trim() || undefined, 'client', clientName, activeProposal.id);
                            setProposals(function (prev) {
                                var filtered = prev.map(function (p) { return p.id === activeProposal.id ? __assign(__assign({}, p), { state: 'countered' }) : p; })
                                    .filter(function (p) { return !p.id.startsWith('prop_'); });
                                if (filtered.some(function (p) { return p.id === counterProp_1.id; }))
                                    return filtered;
                                return __spreadArray(__spreadArray([], filtered, true), [counterProp_1], false);
                            });
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        e_6 = _a.sent();
                        console.error(e_6);
                        return [3 /*break*/, 6];
                    case 5:
                        setSubmittingProposal(false);
                        setProposalPrice('');
                        setProposalReason('');
                        setActiveProposal(null);
                        setProposalOpen(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleAcceptProposal(proposal) {
        return __awaiter(this, void 0, void 0, function () {
            var res, json, e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        return [4 /*yield*/, fetch('/api/negotiation/respond', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    proposalId: proposal.id,
                                    dealId: currentDeal.id,
                                    response: 'accept',
                                    responderName: clientName,
                                    responderRole: 'client',
                                }),
                            })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _a.sent();
                        if (res.ok) {
                            respondToProposalInStore(currentDeal.id, proposal.id, 'accept', clientName);
                            setCurrentDeal(function (prev) { return (__assign(__assign({}, prev), { price: proposal.proposedPrice, status: 'agreed' })); });
                            setProposals(function (prev) {
                                return prev.map(function (p) { return (p.id === proposal.id ? __assign(__assign({}, p), { state: 'accepted', resolvedAt: new Date().toISOString() }) : p); });
                            });
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        e_7 = _a.sent();
                        console.error(e_7);
                        return [3 /*break*/, 5];
                    case 4:
                        setActiveProposal(null);
                        setProposalOpen(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleDeclineProposal(proposal) {
        return __awaiter(this, void 0, void 0, function () {
            var res, json, e_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, 4, 5]);
                        return [4 /*yield*/, fetch('/api/negotiation/respond', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    proposalId: proposal.id,
                                    dealId: currentDeal.id,
                                    response: 'decline',
                                    responderName: clientName,
                                    responderRole: 'client',
                                }),
                            })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        json = _a.sent();
                        if (res.ok) {
                            respondToProposalInStore(currentDeal.id, proposal.id, 'decline', clientName);
                            setProposals(function (prev) {
                                return prev.map(function (p) { return (p.id === proposal.id ? __assign(__assign({}, p), { state: 'declined', resolvedAt: new Date().toISOString() }) : p); });
                            });
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        e_8 = _a.sent();
                        console.error(e_8);
                        return [3 /*break*/, 5];
                    case 4:
                        setActiveProposal(null);
                        setProposalOpen(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleApproveDeliverables() {
        return __awaiter(this, void 0, void 0, function () {
            var e_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/deliverables/approve', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    action: 'approve',
                                    clientName: clientName,
                                }),
                            })];
                    case 1:
                        _a.sent();
                        setDeliverables(function (prev) { return prev.map(function (d) { return (__assign(__assign({}, d), { status: 'approved' })); }); });
                        setFileVersions(function (prev) { return prev.map(function (v) { return (__assign(__assign({}, v), { status: 'approved', locked: false })); }); });
                        alert('Deliverables approved! All project files are verified.');
                        return [3 /*break*/, 3];
                    case 2:
                        e_9 = _a.sent();
                        console.error(e_9);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    function handleRequestChanges(e) {
        return __awaiter(this, void 0, void 0, function () {
            var e_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/deliverables/approve', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    action: 'request_changes',
                                    feedback: changeFeedback,
                                    clientName: clientName,
                                }),
                            })];
                    case 2:
                        _a.sent();
                        setDeliverables(function (prev) { return prev.map(function (d) { return (__assign(__assign({}, d), { status: 'changes_requested' })); }); });
                        setChangesOpen(false);
                        setChangeFeedback('');
                        alert('Change request submitted to creator.');
                        return [3 /*break*/, 4];
                    case 3:
                        e_10 = _a.sent();
                        console.error(e_10);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }
    function handleCompletePayment() {
        return __awaiter(this, void 0, void 0, function () {
            var orderRes, orderData, verifyRes, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setPaying(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, 6, 7]);
                        return [4 /*yield*/, fetch('/api/payments/create-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ dealId: currentDeal.id, token: currentDeal.token }),
                            })];
                    case 2:
                        orderRes = _a.sent();
                        return [4 /*yield*/, orderRes.json()];
                    case 3:
                        orderData = _a.sent();
                        return [4 /*yield*/, fetch('/api/payments/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderId: orderData.orderId,
                                    paymentId: "pay_".concat(Date.now()),
                                    signature: 'verified_sig',
                                    dealId: currentDeal.id,
                                    demo: true,
                                }),
                            })];
                    case 4:
                        verifyRes = _a.sent();
                        if (verifyRes.ok) {
                            simulatePaymentInStore(currentDeal.id, 'Razorpay Verified');
                            setCurrentDeal(function (prev) { return (__assign(__assign({}, prev), { paymentStatus: 'paid', status: 'completed', progress: 100 })); });
                            setDeliverables(function (prev) { return prev.map(function (d) { return (__assign(__assign({}, d), { status: 'approved' })); }); });
                            setFileVersions(function (prev) { return prev.map(function (v) { return (__assign(__assign({}, v), { status: 'approved', locked: false })); }); });
                            setPaymentOpen(false);
                        }
                        return [3 /*break*/, 7];
                    case 5:
                        err_2 = _a.sent();
                        console.error('Payment error:', err_2);
                        simulatePaymentInStore(currentDeal.id, 'Demo Card');
                        setCurrentDeal(function (prev) { return (__assign(__assign({}, prev), { paymentStatus: 'paid', status: 'completed', progress: 100 })); });
                        setDeliverables(function (prev) { return prev.map(function (d) { return (__assign(__assign({}, d), { status: 'approved' })); }); });
                        setFileVersions(function (prev) { return prev.map(function (v) { return (__assign(__assign({}, v), { status: 'approved', locked: false })); }); });
                        setPaymentOpen(false);
                        return [3 /*break*/, 7];
                    case 6:
                        setPaying(false);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function handleDownloadFile(filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var savedToken, res, err, signedUrl, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setDownloading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        savedToken = localStorage.getItem("delt_client_session_".concat(currentDeal.token));
                        return [4 /*yield*/, fetch('/api/files/signed-url', {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'application/json' }, (savedToken ? { 'x-client-session-token': savedToken } : {})),
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    token: currentDeal.token,
                                    filePath: filePath,
                                    isCreator: false,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        err = _a.sent();
                        alert(err.error || 'Failed to download file.');
                        return [2 /*return*/];
                    case 4: return [4 /*yield*/, res.json()];
                    case 5:
                        signedUrl = (_a.sent()).signedUrl;
                        if (signedUrl) {
                            window.open(signedUrl, '_blank');
                        }
                        return [3 /*break*/, 8];
                    case 6:
                        err_3 = _a.sent();
                        alert(err_3.message || 'Download failed');
                        return [3 /*break*/, 8];
                    case 7:
                        setDownloading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    function handleDownloadAllFiles() {
        return __awaiter(this, void 0, void 0, function () {
            var allFiles, savedToken, _i, allFiles_1, f, res, signedUrl, a, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        allFiles = [];
                        fileVersions.forEach(function (v) {
                            v.files.forEach(function (f) {
                                var p = f.path || f.url || f.name;
                                if (p)
                                    allFiles.push({ name: f.name, path: p });
                            });
                        });
                        if (allFiles.length === 0)
                            return [2 /*return*/];
                        setDownloading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, 10, 11]);
                        savedToken = localStorage.getItem("delt_client_session_".concat(currentDeal.token));
                        _i = 0, allFiles_1 = allFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < allFiles_1.length)) return [3 /*break*/, 8];
                        f = allFiles_1[_i];
                        return [4 /*yield*/, fetch('/api/files/signed-url', {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'application/json' }, (savedToken ? { 'x-client-session-token': savedToken } : {})),
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    token: currentDeal.token,
                                    filePath: f.path,
                                    isCreator: false,
                                }),
                            })];
                    case 3:
                        res = _a.sent();
                        if (!res.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, res.json()];
                    case 4:
                        signedUrl = (_a.sent()).signedUrl;
                        if (signedUrl) {
                            a = document.createElement('a');
                            a.href = signedUrl;
                            a.download = f.name;
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 400); })];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        err_4 = _a.sent();
                        console.error('Error downloading all files:', err_4);
                        return [3 /*break*/, 11];
                    case 10:
                        setDownloading(false);
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    }
    function handleViewPreview(versionId, fileId, fileName, mimeType) {
        return __awaiter(this, void 0, void 0, function () {
            var savedToken, res, errData, signedUrl, err_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (previewLoadingFileId)
                            return [2 /*return*/];
                        setPreviewLoadingFileId(fileId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 7, 8]);
                        savedToken = localStorage.getItem("delt_client_session_".concat(currentDeal.token));
                        return [4 /*yield*/, fetch('/api/files/preview', {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'application/json' }, (savedToken ? { 'x-client-session-token': savedToken } : {})),
                                body: JSON.stringify({
                                    dealId: currentDeal.id,
                                    token: currentDeal.token,
                                    fileVersionId: versionId,
                                    fileId: fileId,
                                }),
                            })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        errData = _a.sent();
                        alert(errData.error || 'Failed to fetch preview');
                        return [2 /*return*/];
                    case 4: return [4 /*yield*/, res.json()];
                    case 5:
                        signedUrl = (_a.sent()).signedUrl;
                        setPreviewUrl(signedUrl);
                        setPreviewMimeType(mimeType);
                        setPreviewFileName(fileName);
                        setPreviewModalOpen(true);
                        return [3 /*break*/, 8];
                    case 6:
                        err_5 = _a.sent();
                        alert(err_5.message || 'Error loading preview');
                        return [3 /*break*/, 8];
                    case 7:
                        setPreviewLoadingFileId(null);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="min-h-screen bg-muted/20">
      {/* Client header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm"/>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5"/>
            <span>Private Client Workspace</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Deal header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold tracking-tight">{currentDeal.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
            <span>·</span>
            <DealStatusBadge status={currentDeal.status}/>
            <span>·</span>
            <PaymentStatusBadge status={currentDeal.paymentStatus}/>
          </div>

          {isClosed && (<div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300">
              <Check className="h-4 w-4 text-zinc-500 shrink-0"/>
              <span>This Deal is closed. Project history and deliverables are preserved in read-only mode.</span>
            </div>)}
        </div>

        <Tabs defaultValue="overview">
          <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
            <TabsList className="w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                      <p className="text-sm font-semibold">{formatCurrency(currentDeal.price, currentDeal.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                      <p className="text-sm font-semibold capitalize">{currentDeal.status.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                      <p className="text-sm font-semibold">
                        {currentDeal.deadline ? new Date(currentDeal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                      <PaymentStatusBadge status={currentDeal.paymentStatus}/>
                    </div>
                  </div>
                  {currentDeal.description && (<div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm leading-relaxed">{currentDeal.description}</p>
                    </div>)}
                  {currentDeal.scope && currentDeal.scope.length > 0 && (<div>
                      <p className="text-xs text-muted-foreground mb-2">Scope</p>
                      <ul className="space-y-1.5">
                        {currentDeal.scope.map(function (s, i) { return (<li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                            <span className="text-muted-foreground">{s}</span>
                          </li>); })}
                      </ul>
                    </div>)}
                  {deliverables.length > 0 && (<div>
                      <p className="text-xs text-muted-foreground mb-2">Deliverables</p>
                      <div className="space-y-2">
                        {deliverables.map(function (d) { return (<div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                              <p className="text-sm font-medium">{d.name}</p>
                              {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                            </div>
                            <DeliverableStatusBadge status={isPaid ? 'approved' : d.status}/>
                          </div>); })}
                      </div>
                    </div>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Client Access</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{getInitials(clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{clientEmail}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500"/>
                      <span>Access verified via Email OTP</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5"/>
                      <span>Encrypted communication</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
                    {messages.map(function (msg, i) {
            var prevMsg = messages[i - 1];
            var showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';
            if (msg.type === 'proposal' && msg.proposalId) {
                var proposal_1 = proposals.find(function (p) { return p.id === msg.proposalId; });
                if (proposal_1) {
                    return (<ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'client'} showAvatar={showAvatar}>
                              <div className="max-w-sm">
                                <PriceProposalCard proposal={proposal_1} currency={currentDeal.currency} perspective="client" onAccept={function () { return handleAcceptProposal(proposal_1); }} onCounter={function () { setActiveProposal(proposal_1); setProposalPrice(''); setProposalReason(''); setProposalOpen(true); }} onDecline={function () { return handleDeclineProposal(proposal_1); }}/>
                              </div>
                            </ChatMessageItem>);
                }
            }
            return <ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'client'} showAvatar={showAvatar}/>;
        })}
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-end gap-2">
                      {!isClosed && (<Dialog open={proposalOpen} onOpenChange={function (open) { setProposalOpen(open); if (!open)
            setActiveProposal(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                              <ArrowLeftRight className="h-3.5 w-3.5"/>
                              Propose Price
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{activeProposal ? 'Respond to Proposal' : 'Propose Price Adjustment'}</DialogTitle>
                            </DialogHeader>
                            {activeProposal ? (<div className="space-y-4 pt-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 rounded-lg bg-muted/50 p-3">
                                    <p className="text-xs text-muted-foreground">Previous</p>
                                    <p className="text-sm font-semibold line-through text-muted-foreground">
                                      {formatCurrency(activeProposal.previousPrice, currentDeal.currency)}
                                    </p>
                                  </div>
                                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground"/>
                                  <div className="flex-1 rounded-lg bg-primary/5 p-3">
                                    <p className="text-xs text-muted-foreground">Proposed</p>
                                    <p className="text-sm font-bold text-primary">
                                      {formatCurrency(activeProposal.proposedPrice, currentDeal.currency)}
                                    </p>
                                  </div>
                                </div>
                                {activeProposal.reason && (<div className="rounded-lg bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground mb-0.5">Their reason</p>
                                    <p className="text-sm text-foreground">{activeProposal.reason}</p>
                                  </div>)}
                                <form onSubmit={handleCounterProposal} className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="counterPrice">Your counter price ({currentDeal.currency})</Label>
                                    <Input id="counterPrice" type="number" placeholder={String(activeProposal.proposedPrice)} value={proposalPrice} onChange={function (e) { return setProposalPrice(e.target.value); }} required/>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="counterReason">Reason (optional)</Label>
                                    <Textarea id="counterReason" placeholder="Explain your counter offer..." rows={3} value={proposalReason} onChange={function (e) { return setProposalReason(e.target.value); }}/>
                                  </div>
                                  <DialogFooter className="gap-2">
                                    <Button type="button" variant="ghost" onClick={function () { return handleDeclineProposal(activeProposal); }} className="mr-auto text-muted-foreground">
                                      Decline
                                    </Button>
                                    <Button type="button" variant="outline" onClick={function () { return handleAcceptProposal(activeProposal); }}>
                                      Accept
                                    </Button>
                                    <Button type="submit" disabled={!proposalPrice || submittingProposal}>
                                      {submittingProposal ? 'Sending...' : 'Send Counter'}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </div>) : (<form onSubmit={handleProposePrice} className="space-y-4 pt-2">
                                <div className="rounded-lg bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground">Current price</p>
                                  <p className="text-lg font-semibold">{formatCurrency(currentDeal.price, currentDeal.currency)}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="c-price">New proposed price ({currentDeal.currency})</Label>
                                  <Input id="c-price" type="number" placeholder={String(currentDeal.price)} value={proposalPrice} onChange={function (e) { return setProposalPrice(e.target.value); }} required/>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="c-reason">Reason (optional)</Label>
                                  <Textarea id="c-reason" placeholder="Explain your proposal..." value={proposalReason} onChange={function (e) { return setProposalReason(e.target.value); }} rows={3}/>
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={function () { return setProposalOpen(false); }}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={!proposalPrice || submittingProposal}>
                                    {submittingProposal ? 'Sending...' : 'Submit Proposal'}
                                  </Button>
                                </DialogFooter>
                              </form>)}
                          </DialogContent>
                        </Dialog>)}

                      <Textarea placeholder={isClosed ? "Deal is closed (read-only chat history)" : "Type a message to your creator..."} value={input} disabled={isClosed} onChange={function (e) { return setInput(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter' && !e.shiftKey && !isClosed) {
        e.preventDefault();
        sendMessage();
    } }} className="min-h-[40px] max-h-24 resize-none" rows={1}/>
                      <Button size="icon" onClick={sendMessage} className="shrink-0" disabled={isClosed || !input.trim()}>
                        <Send className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files */}
          <TabsContent value="files" className="mt-4">
            <div className="space-y-4">
              {/* Download All Bar when files exist and deal is paid */}
              {isPaid && fileVersions.some(function (v) { return v.files.length > 0; }) && (<div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 mb-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Unlocked Deliverables</p>
                    <p className="text-[11px] text-muted-foreground">Download all approved project files in one click</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleDownloadAllFiles} disabled={downloading}>
                    <Download className="h-3.5 w-3.5"/>
                    {downloading ? 'Downloading...' : 'Download All Files'}
                  </Button>
                </div>)}

              {deliverables.length === 0 && fileVersions.length === 0 ? (<Card>
                  <CardContent className="p-8 text-center">
                    <EmptyState icon={FileCheck} title="No files yet" description="Your creator will upload deliverable files here."/>
                  </CardContent>
                </Card>) : (deliverables.map(function (del) {
            var versions = fileVersions.filter(function (v) { return v.deliverableId === del.id; });
            return (<Card key={del.id}>
                      <CardHeader className="flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">{del.name}</CardTitle>
                        <DeliverableStatusBadge status={isPaid || currentDeal.status === 'completed' ? 'approved' : del.status}/>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {versions.length === 0 ? (<p className="text-xs text-muted-foreground">No files uploaded yet.</p>) : (versions.map(function (v) { return (<div key={v.id} className="rounded-lg border border-border p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                                <span className="text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                              {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
                              <div className="space-y-1.5">
                                {v.files.map(function (f) { return (<div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
                                    <span className="font-medium truncate">{f.name}</span>
                                    {f.deletionStatus === 'deleted' ? (<span className="text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded text-[10px]">
                                        File deleted (retention expired)
                                      </span>) : isPaid ? (<Button size="sm" variant="outline" className="gap-1 text-xs" onClick={function () { return handleDownloadFile(f.path || f.url || f.name); }}>
                                        <Download className="h-3 w-3"/>
                                        Download
                                      </Button>) : currentDeal.previewEnabled ? (f.previewStatus === 'ready' && f.previewPath ? (<div className="flex items-center gap-2">
                                          <Button size="sm" variant="outline" className="gap-1 text-xs text-primary border-primary/25 hover:bg-primary/5 hover:text-primary h-7" onClick={function () { return handleViewPreview(v.id, f.id, f.name, f.previewType || 'image/jpeg'); }} disabled={previewLoadingFileId === f.id}>
                                            <Eye className="h-3 w-3"/>
                                            {previewLoadingFileId === f.id ? 'Loading...' : 'Preview'}
                                          </Button>
                                          <span className="text-muted-foreground flex items-center gap-0.5">
                                            <Lock className="h-3 w-3"/> Locked
                                          </span>
                                        </div>) : f.previewStatus === 'processing' ? (<div className="flex items-center gap-2">
                                          <span className="text-[10px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded animate-pulse">
                                            Preview processing
                                          </span>
                                          <span className="text-muted-foreground flex items-center gap-0.5">
                                            <Lock className="h-3 w-3"/> Locked
                                          </span>
                                        </div>) : (<div className="flex items-center gap-2">
                                          <span className="text-[10px] text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded">
                                            Preview unavailable
                                          </span>
                                          <span className="text-muted-foreground flex items-center gap-0.5">
                                            <Lock className="h-3 w-3"/> Locked
                                          </span>
                                        </div>)) : (<div className="flex items-center gap-2">
                                        <span className="text-muted-foreground flex items-center gap-0.5">
                                          <Lock className="h-3 w-3"/> Locked
                                        </span>
                                      </div>)}
                                  </div>); })}
                              </div>
                            </div>); }))}
                      </CardContent>
                    </Card>);
        }))}

              {/* Approval & Changes Bar */}
              {!isClosed && (<div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Flag className="h-3.5 w-3.5"/>
                        Request Changes
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Deliverable Changes</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRequestChanges} className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>What needs to be revised?</Label>
                          <Textarea placeholder="Describe the adjustments needed..." rows={4} value={changeFeedback} onChange={function (e) { return setChangeFeedback(e.target.value); }} required/>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={function () { return setChangesOpen(false); }}>
                            Cancel
                          </Button>
                          <Button type="submit">Submit Request</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApproveDeliverables}>
                    <Check className="h-3.5 w-3.5"/>
                    Approve Deliverables
                  </Button>
                </div>)}
            </div>
          </TabsContent>

          {/* Payment */}
          <TabsContent value="payment" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Project Amount</span>
                    <span className="text-sm font-semibold">{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Amount Due</span>
                    <span className="text-lg font-display font-semibold">
                      {isPaid ? formatCurrency(0, currentDeal.currency) : formatCurrency(currentDeal.price, currentDeal.currency)}
                    </span>
                  </div>

                  {!isPaid && !isClosed ? (<Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full gap-2 mt-2">
                          <CreditCard className="h-4 w-4"/>
                          Pay with Razorpay ({formatCurrency(currentDeal.price, currentDeal.currency)})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Complete Deal Payment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Deal:</span>
                              <span className="font-medium">{currentDeal.title}</span>
                            </div>
                            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                              <span>Total Amount:</span>
                              <span>{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Razorpay checkout handles Credit/Debit Cards, UPI, Netbanking, and Wallets. Files unlock instantly upon payment confirmation.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={function () { return setPaymentOpen(false); }}>
                            Cancel
                          </Button>
                          <Button onClick={handleCompletePayment} disabled={paying}>
                            {paying ? 'Processing Payment...' : "Confirm Pay ".concat(formatCurrency(currentDeal.price, currentDeal.currency))}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>) : isPaid ? (<div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 mt-2">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400"/>
                      <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                        Payment confirmed. All deliverable files are unlocked for download.
                      </span>
                    </div>) : (<div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>This deal is closed without payment.</span>
                    </div>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <PaymentStatusBadge status={currentDeal.paymentStatus}/>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isPaid
            ? 'Payment complete. You can download all deliverables under the Files tab.'
            : isClosed
                ? 'Deal is closed.'
                : 'Files will be unlocked automatically once payment is confirmed.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Deal Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                {events.length === 0 ? (<EmptyState icon={Clock} title="No activity recorded" description="Events will appear here as work progresses."/>) : (<Timeline events={events}/>)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Secure File Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base truncate">Preview — {previewFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-muted/20 min-h-[40vh] max-h-[60vh] rounded-md relative">
            {previewMimeType.startsWith('image/') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={previewFileName} className="max-w-full max-h-[55vh] object-contain rounded shadow-sm select-none pointer-events-none"/>) : previewMimeType === 'application/pdf' ? (<iframe src={previewUrl} title={previewFileName} className="w-full h-[55vh] border-0 rounded shadow-sm"/>) : previewMimeType.startsWith('video/') ? (<video src={previewUrl} controls controlsList="nodownload" className="max-w-full max-h-[55vh] object-contain rounded shadow-sm"/>) : (<div className="text-center py-12 space-y-2">
                <p className="text-sm font-semibold text-foreground">Preview unavailable</p>
                <p className="text-xs text-muted-foreground">Original file will be available after payment.</p>
              </div>)}
          </div>
          <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium">
              <Lock className="h-3.5 w-3.5"/>
              <span>Preview mode — Original file available after payment.</span>
            </div>
            <Button size="sm" variant="outline" onClick={function () { return setPreviewModalOpen(false); }}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
