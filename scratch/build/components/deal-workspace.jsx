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
import { FileCheck, CreditCard, Activity, ArrowLeftRight, Send, Check, X, AlertCircle, Upload, Lock, Flag, Download, Copy, Share2, ExternalLink, } from 'lucide-react';
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
import { FileCard } from '@/components/file-card';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { getDealPublicUrl } from '@/lib/deal-url';
import { useRouter } from 'next/navigation';
import { cn, serializeDescription } from '@/lib/utils';
import { addProposalToStore, respondToProposalInStore, closeDealInStore } from '@/lib/app-store';
function getInitials(name) {
    if (!name)
        return 'YA';
    return name.split(' ').map(function (n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
}
export function DealWorkspace(_a) {
    var _this = this;
    var deal = _a.deal, clientName = _a.clientName, clientEmail = _a.clientEmail, clientCompany = _a.clientCompany, creatorName = _a.creatorName, messages = _a.messages, proposals = _a.proposals, deliverables = _a.deliverables, fileVersions = _a.fileVersions, events = _a.events, milestones = _a.milestones, payments = _a.payments, changeRequests = _a.changeRequests;
    var router = useRouter();
    var _b = useState(deal), currentDeal = _b[0], setCurrentDeal = _b[1];
    useEffect(function () {
        setCurrentDeal(deal);
    }, [deal]);
    var _c = useState('overview'), activeTab = _c[0], setActiveTab = _c[1];
    var _d = useState(false), closeDialogOpen = _d[0], setCloseDialogOpen = _d[1];
    var _e = useState(false), closing = _e[0], setClosing = _e[1];
    var _f = useState(''), closeError = _f[0], setCloseError = _f[1];
    var _g = useState(false), linkCopied = _g[0], setLinkCopied = _g[1];
    var canonicalUrl = getDealPublicUrl(currentDeal.token || currentDeal.id);
    var isClosed = currentDeal.status === 'closed';
    var handleShare = function () { return __awaiter(_this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof navigator !== 'undefined' && navigator.share)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.share({
                            title: currentDeal.title,
                            text: "Review and collaborate on \"".concat(currentDeal.title, "\" on DELT"),
                            url: canonicalUrl,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    err_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4:
                    navigator.clipboard.writeText(canonicalUrl);
                    setLinkCopied(true);
                    setTimeout(function () { return setLinkCopied(false); }, 2000);
                    return [2 /*return*/];
            }
        });
    }); };
    function handleCloseDeal() {
        return __awaiter(this, void 0, void 0, function () {
            var res, errJson, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setClosing(true);
                        setCloseError('');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch("/api/deals/".concat(currentDeal.id, "/close"), {
                                method: 'POST',
                            })];
                    case 2:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        errJson = _a.sent();
                        setCloseError(errJson.error || 'Failed to close deal.');
                        setClosing(false);
                        return [2 /*return*/];
                    case 4:
                        closeDealInStore(currentDeal.id);
                        setCurrentDeal(function (prev) { return (__assign(__assign({}, prev), { status: 'closed', updatedAt: new Date().toISOString() })); });
                        setCloseDialogOpen(false);
                        setClosing(false);
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        console.error('Error closing deal:', err_2);
                        setCloseError(err_2.message || 'Failed to close deal.');
                        setClosing(false);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    return (<div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">{currentDeal.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{clientName}</span>
              {clientCompany && <><span>·</span><span>{clientCompany}</span></>}
              <span>·</span>
              <span>{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DealStatusBadge status={currentDeal.status}/>

            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                  Close Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Close and permanently delete this Deal?</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2 text-sm text-muted-foreground">
                  <p className="text-foreground font-medium">
                    This action cannot be undone. Closing this Deal will permanently delete:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    <li>The Deal workspace and all access links</li>
                    <li>All chat messages and conversations</li>
                    <li>Timeline events and activity history</li>
                    <li>All deliverables, file versions, and uploaded storage files</li>
                  </ul>
                  {closeError && (<p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                      {closeError}
                    </p>)}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={function () { return setCloseDialogOpen(false); }} disabled={closing}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleCloseDeal} disabled={closing}>
                    {closing ? 'Deleting Deal...' : 'Close & Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Shareable Client Link Banner */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Client Portal Link</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  OTP Protected
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate font-mono select-all">
                {canonicalUrl}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={function () {
            navigator.clipboard.writeText(canonicalUrl);
            setLinkCopied(true);
            setTimeout(function () { return setLinkCopied(false); }, 2000);
        }}>
                <Copy className="h-3.5 w-3.5"/>
                {linkCopied ? 'Link Copied!' : 'Copy Link'}
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={handleShare}>
                <Share2 className="h-3.5 w-3.5"/>
                Share
              </Button>
              <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={function () { return window.open(canonicalUrl, '_blank'); }}>
                <ExternalLink className="h-3.5 w-3.5"/>
                Open Client View
              </Button>
            </div>
          </div>
        </div>

        {isClosed && (<div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300">
            <Check className="h-4 w-4 text-zinc-500 shrink-0"/>
            <span>This Deal is closed.</span>
          </div>)}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <TabsList className="w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab deal={currentDeal} deliverables={deliverables} milestones={milestones} events={events} clientName={clientName} creatorName={creatorName}/>
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <ChatTab deal={currentDeal} messages={messages} proposals={proposals} creatorName={creatorName} isClosed={isClosed}/>
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FilesTab deal={currentDeal} deliverables={deliverables} fileVersions={fileVersions} changeRequests={changeRequests} isClosed={isClosed}/>
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab deal={currentDeal} payments={payments}/>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab events={events}/>
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab deal={currentDeal} onUpdateDeal={setCurrentDeal} fileVersions={fileVersions}/>
        </TabsContent>
      </Tabs>
    </div>);
}
// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
function OverviewTab(_a) {
    var deal = _a.deal, deliverables = _a.deliverables, milestones = _a.milestones, events = _a.events, clientName = _a.clientName, creatorName = _a.creatorName;
    return (<div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                <p className="text-sm font-semibold">{formatCurrency(deal.price, deal.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                <PaymentStatusBadge status={deal.paymentStatus}/>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                <p className="text-sm font-semibold">
                  {deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <p className="text-sm font-semibold capitalize">{deal.status.replace('_', ' ')}</p>
              </div>
            </div>

            {deal.description && (<div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{deal.description}</p>
              </div>)}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Scope</p>
              <ul className="space-y-1.5">
                {deal.scope.map(function (s, i) { return (<li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                    <span>{s}</span>
                  </li>); })}
              </ul>
            </div>
          </CardContent>
        </Card>

        {deliverables.length > 0 && (<Card>
            <CardHeader>
              <CardTitle className="text-base">Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deliverables.map(function (del) { return (<div key={del.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{del.name}</p>
                    {del.description && <p className="text-xs text-muted-foreground mt-0.5">{del.description}</p>}
                  </div>
                  <DeliverableStatusBadge status={deal.paymentStatus === 'paid' || deal.status === 'completed' ? 'approved' : del.status}/>
                </div>); })}
            </CardContent>
          </Card>)}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{getInitials(clientName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{clientName}</p>
                <p className="text-xs text-muted-foreground">{deal.client_email || deal.clientEmail || ''}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
              <p className="font-medium text-foreground">Private Workspace Access</p>
              <p className="text-muted-foreground leading-relaxed">
                Client accesses this deal via private token link with email OTP verification.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (<p className="text-sm text-muted-foreground">No events recorded yet.</p>) : (<Timeline events={events.slice(0, 4)}/>)}
          </CardContent>
        </Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Chat Tab (With Supabase Realtime Scoped Subscription)
// ---------------------------------------------------------------------------
function ChatTab(_a) {
    var _this = this;
    var deal = _a.deal, messages = _a.messages, proposals = _a.proposals, creatorName = _a.creatorName, isClosed = _a.isClosed;
    var _b = useState(messages), localMessages = _b[0], setLocalMessages = _b[1];
    var _c = useState(proposals), localProposals = _c[0], setLocalProposals = _c[1];
    var _d = useState(''), input = _d[0], setInput = _d[1];
    var _e = useState(false), proposalOpen = _e[0], setProposalOpen = _e[1];
    var _f = useState(false), counterOpen = _f[0], setCounterOpen = _f[1];
    var _g = useState(null), activeProposal = _g[0], setActiveProposal = _g[1];
    var _h = useState(false), submittingProposal = _h[0], setSubmittingProposal = _h[1];
    var scrollRef = useRef(null);
    // Supabase Realtime Subscription Scoped to Deal
    useEffect(function () {
        if (!hasSupabasePublicConfig())
            return;
        var supabase = createClient();
        var channel = supabase
            .channel("deal:".concat(deal.id))
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: "deal_id=eq.".concat(deal.id) }, function (payload) {
            var raw = payload.new;
            var formattedMsg = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || deal.id,
                senderId: raw.sender_id || raw.senderId || 'creator',
                senderName: raw.sender_name || raw.senderName || creatorName,
                senderRole: raw.sender_role || raw.senderRole || 'creator',
                type: raw.type,
                content: raw.content,
                proposalId: raw.proposal_id || raw.proposalId,
                createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
            };
            setLocalMessages(function (prev) {
                // Replace any optimistic message with same content if within 5 seconds, or deduplicate
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
                proposedByRole: raw.proposed_by_role || raw.proposedByRole || 'creator',
                counterProposalId: raw.parent_proposal_id || raw.parentProposalId || raw.counter_proposal_id || raw.counterProposalId,
                createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
            };
            if (payload.eventType === 'INSERT') {
                setLocalProposals(function (prev) {
                    var filtered = prev.filter(function (p) { return !(p.id.startsWith('prop_') && p.proposedPrice === formattedProp.proposedPrice && p.proposedByRole === formattedProp.proposedByRole); });
                    if (filtered.some(function (p) { return p.id === formattedProp.id; }))
                        return filtered;
                    return __spreadArray(__spreadArray([], filtered, true), [formattedProp], false);
                });
            }
            else if (payload.eventType === 'UPDATE') {
                setLocalProposals(function (prev) {
                    return prev.map(function (p) { return (p.id === formattedProp.id ? formattedProp : p); });
                });
            }
        })
            .subscribe();
        return function () {
            supabase.removeChannel(channel);
        };
    }, [deal.id]);
    useEffect(function () {
        var _a;
        (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [localMessages]);
    useEffect(function () {
        setLocalMessages(messages);
    }, [messages]);
    useEffect(function () {
        setLocalProposals(proposals);
    }, [proposals]);
    function sendMessage() {
        return __awaiter(this, void 0, void 0, function () {
            var text, optId, optMsg, res, data, serverMsg_1, e_1;
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
                            dealId: deal.id,
                            senderId: 'creator',
                            senderName: creatorName,
                            senderRole: 'creator',
                            type: 'text',
                            content: text,
                            createdAt: new Date().toISOString(),
                        };
                        setLocalMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [optMsg], false); });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, fetch('/api/messages/send', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: deal.id,
                                    senderName: creatorName,
                                    senderRole: 'creator',
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
                            setLocalMessages(function (prev) {
                                return prev.map(function (m) { return (m.id === optId ? serverMsg_1 : m); });
                            });
                        }
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.error('Error sending message:', e_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleAcceptProposal(proposal) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/negotiation/respond', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    proposalId: proposal.id,
                                    dealId: deal.id,
                                    response: 'accept',
                                    responderName: creatorName,
                                    responderRole: 'creator',
                                }),
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [3 /*break*/, 3];
                    case 3:
                        respondToProposalInStore(deal.id, proposal.id, 'accept', creatorName);
                        setProposalOpen(false);
                        setCounterOpen(false);
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleDeclineProposal() {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!activeProposal) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch('/api/negotiation/respond', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    proposalId: activeProposal.id,
                                    dealId: deal.id,
                                    response: 'decline',
                                    responderName: creatorName,
                                    responderRole: 'creator',
                                }),
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        console.error(e_3);
                        return [3 /*break*/, 4];
                    case 4:
                        respondToProposalInStore(deal.id, activeProposal.id, 'decline', creatorName);
                        _a.label = 5;
                    case 5:
                        setProposalOpen(false);
                        setCounterOpen(false);
                        return [2 /*return*/];
                }
            });
        });
    }
    var pendingProposal = localProposals.find(function (p) { return p.state === 'pending' && p.direction === 'client_to_creator'; });
    return (<div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {localMessages.map(function (msg, i) {
            var prevMsg = localMessages[i - 1];
            var showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';
            if (msg.type === 'proposal' && msg.proposalId) {
                var proposal_1 = localProposals.find(function (p) { return p.id === msg.proposalId; });
                if (proposal_1) {
                    return (<ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'creator'} showAvatar={showAvatar}>
                  <div className="max-w-sm">
                    <PriceProposalCard proposal={proposal_1} currency={deal.currency} perspective="creator" onAccept={function () { return handleAcceptProposal(proposal_1); }} onCounter={function () { setActiveProposal(proposal_1); setCounterOpen(true); }} onDecline={handleDeclineProposal}/>
                  </div>
                </ChatMessageItem>);
                }
            }
            return (<ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'creator'} showAvatar={showAvatar}/>);
        })}
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-end gap-2">
          <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <ArrowLeftRight className="h-3.5 w-3.5"/>
                Propose Price
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ProposalForm currentPrice={deal.price} currency={deal.currency} disabled={submittingProposal} onSubmit={function (price, reason) { return __awaiter(_this, void 0, void 0, function () {
            var res, json, newProp_1, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setSubmittingProposal(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/negotiation/propose', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: deal.id,
                                    proposedPrice: price,
                                    reason: reason,
                                    proposedByRole: 'creator',
                                    proposedByName: creatorName,
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
                            addProposalToStore(deal.id, price, reason, 'creator', creatorName);
                            setLocalProposals(function (prev) {
                                var filtered = prev.filter(function (p) { return !p.id.startsWith('prop_'); });
                                if (filtered.some(function (p) { return p.id === newProp_1.id; }))
                                    return filtered;
                                return __spreadArray(__spreadArray([], filtered, true), [newProp_1], false);
                            });
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        e_4 = _a.sent();
                        console.error(e_4);
                        return [3 /*break*/, 6];
                    case 5:
                        setSubmittingProposal(false);
                        setProposalOpen(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); }}/>
            </DialogContent>
          </Dialog>
          <Textarea placeholder="Type a message..." value={input} onChange={function (e) { return setInput(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    } }} className="min-h-[40px] max-h-24 resize-none" rows={1}/>
          <Button size="icon" onClick={sendMessage} className="shrink-0">
            <Send className="h-4 w-4"/>
          </Button>
        </div>

        {/* Pending proposal action banner */}
        {!isClosed && pendingProposal && (<div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0"/>
            <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
              {pendingProposal.proposedByName} proposed {formatCurrency(pendingProposal.proposedPrice, deal.currency)}
            </span>
            <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={function () { return setActiveProposal(pendingProposal); }}>
                  Respond
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CounterOfferForm proposal={pendingProposal} currency={deal.currency} onAccept={function () { return handleAcceptProposal(pendingProposal); }} onDecline={handleDeclineProposal} disabled={submittingProposal} onSubmit={function (price, reason) { return __awaiter(_this, void 0, void 0, function () {
                var res, json, counterProp_1, e_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setSubmittingProposal(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, 5, 6]);
                            return [4 /*yield*/, fetch('/api/negotiation/propose', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        dealId: deal.id,
                                        proposedPrice: price,
                                        reason: reason,
                                        proposedByRole: 'creator',
                                        proposedByName: creatorName,
                                        parentProposalId: pendingProposal.id,
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
                                    counterProposalId: pendingProposal.id,
                                    createdAt: json.proposal.created_at,
                                };
                                addProposalToStore(deal.id, price, reason, 'creator', creatorName, pendingProposal.id);
                                setLocalProposals(function (prev) {
                                    var filtered = prev.map(function (p) { return p.id === pendingProposal.id ? __assign(__assign({}, p), { state: 'countered' }) : p; })
                                        .filter(function (p) { return !p.id.startsWith('prop_'); });
                                    if (filtered.some(function (p) { return p.id === counterProp_1.id; }))
                                        return filtered;
                                    return __spreadArray(__spreadArray([], filtered, true), [counterProp_1], false);
                                });
                            }
                            return [3 /*break*/, 6];
                        case 4:
                            e_5 = _a.sent();
                            console.error(e_5);
                            return [3 /*break*/, 6];
                        case 5:
                            setSubmittingProposal(false);
                            setCounterOpen(false);
                            return [7 /*endfinally*/];
                        case 6: return [2 /*return*/];
                    }
                });
            }); }}/>
              </DialogContent>
            </Dialog>
          </div>)}
      </div>
    </div>);
}
function ProposalForm(_a) {
    var currentPrice = _a.currentPrice, currency = _a.currency, onSubmit = _a.onSubmit, disabled = _a.disabled;
    var _b = useState(''), price = _b[0], setPrice = _b[1];
    var _c = useState(''), reason = _c[0], setReason = _c[1];
    return (<>
      <DialogHeader>
        <DialogTitle>Propose Price Adjustment</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Current price</p>
          <p className="text-lg font-semibold">{formatCurrency(currentPrice, currency)}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposedPrice">New proposed price ({currency})</Label>
          <Input id="proposedPrice" type="number" placeholder={String(currentPrice)} value={price} onChange={function (e) { return setPrice(e.target.value); }}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposalReason">Reason (optional)</Label>
          <Textarea id="proposalReason" placeholder="Explain why you are proposing this price..." rows={3} value={reason} onChange={function (e) { return setReason(e.target.value); }}/>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={function () { return onSubmit(Number(price), reason); }} disabled={!price || disabled}>
          {disabled ? 'Sending...' : 'Send Proposal'}
        </Button>
      </DialogFooter>
    </>);
}
function CounterOfferForm(_a) {
    var proposal = _a.proposal, currency = _a.currency, onAccept = _a.onAccept, onDecline = _a.onDecline, onSubmit = _a.onSubmit, disabled = _a.disabled;
    var _b = useState(''), price = _b[0], setPrice = _b[1];
    var _c = useState(''), reason = _c[0], setReason = _c[1];
    return (<>
      <DialogHeader>
        <DialogTitle>Respond to Proposal</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-sm font-semibold line-through text-muted-foreground">
              {formatCurrency(proposal.previousPrice, currency)}
            </p>
          </div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground"/>
          <div className="flex-1 rounded-lg bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Proposed</p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(proposal.proposedPrice, currency)}
            </p>
          </div>
        </div>
        {proposal.reason && (<div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Their reason</p>
            <p className="text-sm">{proposal.reason}</p>
          </div>)}
        <div className="space-y-2">
          <Label htmlFor="counterPrice">Your counter price</Label>
          <Input id="counterPrice" type="number" placeholder={String(proposal.proposedPrice)} value={price} onChange={function (e) { return setPrice(e.target.value); }}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="counterReason">Reason (optional)</Label>
          <Textarea id="counterReason" placeholder="Explain your counter offer..." rows={3} value={reason} onChange={function (e) { return setReason(e.target.value); }}/>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onDecline} className="mr-auto text-muted-foreground" disabled={disabled}>
          <X className="h-4 w-4 mr-1.5"/>
          Decline
        </Button>
        <Button variant="outline" onClick={onAccept} className="gap-1.5" disabled={disabled}>
          <Check className="h-4 w-4"/>
          Accept
        </Button>
        <Button onClick={function () { return onSubmit(Number(price), reason); }} disabled={!price || disabled}>
          {disabled ? 'Sending...' : 'Send Counter'}
        </Button>
      </DialogFooter>
    </>);
}
// ---------------------------------------------------------------------------
// Files Tab (Private Storage & Upload Modal)
// ---------------------------------------------------------------------------
function FilesTab(_a) {
    var _b;
    var deal = _a.deal, deliverables = _a.deliverables, fileVersions = _a.fileVersions, changeRequests = _a.changeRequests, isClosed = _a.isClosed;
    var isPaid = deal.paymentStatus === 'paid';
    var _c = useState(false), uploadOpen = _c[0], setUploadOpen = _c[1];
    var _d = useState(((_b = deliverables[0]) === null || _b === void 0 ? void 0 : _b.id) || ''), selectedDeliverable = _d[0], setSelectedDeliverable = _d[1];
    var _e = useState(''), fileDesc = _e[0], setFileDesc = _e[1];
    var _f = useState(null), selectedFile = _f[0], setSelectedFile = _f[1];
    var _g = useState(false), uploading = _g[0], setUploading = _g[1];
    var _h = useState(''), uploadError = _h[0], setUploadError = _h[1];
    function handleUploadFile(e) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var previewBlob, formData, originalExt, previewExt, previewName, res, data, err_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        e.preventDefault();
                        if (!selectedFile)
                            return [2 /*return*/];
                        setUploading(true);
                        setUploadError('');
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, 7, 8]);
                        return [4 /*yield*/, generateClientPreview(selectedFile)];
                    case 2:
                        previewBlob = _c.sent();
                        formData = new FormData();
                        formData.append('dealId', deal.id);
                        formData.append('deliverableId', selectedDeliverable || ((_a = deliverables[0]) === null || _a === void 0 ? void 0 : _a.id) || 'del-1');
                        formData.append('description', fileDesc);
                        formData.append('file', selectedFile);
                        if (previewBlob) {
                            originalExt = (_b = selectedFile.name.split('.').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase();
                            previewExt = originalExt;
                            if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
                                previewExt = 'jpg';
                            }
                            previewName = selectedFile.name.replace(/\.[^.]+$/, "-preview.".concat(previewExt));
                            formData.append('previewFile', new File([previewBlob], previewName, { type: previewBlob.type }));
                        }
                        return [4 /*yield*/, fetch('/api/files/upload', {
                                method: 'POST',
                                body: formData,
                            })];
                    case 3:
                        res = _c.sent();
                        if (!!res.ok) return [3 /*break*/, 5];
                        return [4 /*yield*/, res.json()];
                    case 4:
                        data = _c.sent();
                        throw new Error(data.error || 'Failed to upload file');
                    case 5:
                        setUploadOpen(false);
                        setSelectedFile(null);
                        setFileDesc('');
                        return [3 /*break*/, 8];
                    case 6:
                        err_3 = _c.sent();
                        setUploadError(err_3.message || 'Upload failed');
                        return [3 /*break*/, 8];
                    case 7:
                        setUploading(false);
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
    var _j = useState(false), downloadingAll = _j[0], setDownloadingAll = _j[1];
    var allFilesList = fileVersions.flatMap(function (v) {
        return v.files.map(function (f) { return ({
            name: f.name,
            path: f.path || f.url || f.name,
        }); });
    });
    function handleDownloadAllFiles() {
        return __awaiter(this, void 0, void 0, function () {
            var _i, allFilesList_1, file, res, signedUrl, a, e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (allFilesList.length === 0)
                            return [2 /*return*/];
                        setDownloadingAll(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, 10, 11]);
                        _i = 0, allFilesList_1 = allFilesList;
                        _a.label = 2;
                    case 2:
                        if (!(_i < allFilesList_1.length)) return [3 /*break*/, 8];
                        file = allFilesList_1[_i];
                        return [4 /*yield*/, fetch('/api/files/signed-url', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    dealId: deal.id,
                                    filePath: file.path,
                                    isCreator: true,
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
                            a.download = file.name;
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
                        e_6 = _a.sent();
                        console.error('Download error:', e_6);
                        return [3 /*break*/, 11];
                    case 10:
                        setDownloadingAll(false);
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Download All Bar when files exist */}
        {allFilesList.length > 1 && (<div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Project Deliverables ({allFilesList.length} files)</p>
              <p className="text-[11px] text-muted-foreground">Download all uploaded version assets in one click</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleDownloadAllFiles} disabled={downloadingAll}>
              <Download className="h-3.5 w-3.5"/>
              {downloadingAll ? 'Downloading...' : 'Download All Files'}
            </Button>
          </div>)}

        {/* Upload area */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <Upload className="h-5 w-5 text-muted-foreground"/>
            </div>
            <p className="text-sm font-medium">Upload deliverables</p>
            <p className="text-xs text-muted-foreground mt-1">
              Files are saved to private storage and unlocked automatically upon payment.
            </p>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  <Upload className="h-3.5 w-3.5"/>
                  Select files to upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Deliverable Version</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadFile} className="space-y-4 pt-2">
                  {deliverables.length > 0 && (<div className="space-y-1.5">
                      <Label className="text-xs">Select Deliverable</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs" value={selectedDeliverable} onChange={function (e) { return setSelectedDeliverable(e.target.value); }}>
                        {deliverables.map(function (del) { return (<option key={del.id} value={del.id}>
                            {del.name}
                          </option>); })}
                      </select>
                    </div>)}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Version Description (optional)</Label>
                    <Input placeholder="e.g. Master design export v2 with revisions" value={fileDesc} onChange={function (e) { return setFileDesc(e.target.value); }}/>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Choose File *</Label>
                    <Input type="file" onChange={function (e) { var _a; return setSelectedFile(((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) || null); }} required/>
                  </div>
                  {uploadError && (<div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                      {uploadError}
                    </div>)}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={function () { return setUploadOpen(false); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!selectedFile || uploading}>
                      {uploading ? 'Uploading...' : 'Upload Version'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Deliverables with versions */}
        {deliverables.length === 0 ? (<Card>
            <CardContent>
              <EmptyState icon={FileCheck} title="No deliverables" description="No deliverables have been added to this deal yet."/>
            </CardContent>
          </Card>) : (deliverables.map(function (del) {
            var versions = fileVersions.filter(function (v) { return v.deliverableId === del.id; });
            return (<Card key={del.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{del.name}</CardTitle>
                  <DeliverableStatusBadge status={isPaid || deal.status === 'completed' ? 'approved' : del.status}/>
                </CardHeader>
                <CardContent>
                  {versions.length === 0 ? (<p className="text-sm text-muted-foreground">No versions uploaded yet.</p>) : (<div className="space-y-3">
                      {versions.map(function (v) { return (<div key={v.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                              {v.version === Math.max.apply(Math, versions.map(function (vv) { return vv.version; })) && (<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
                          <div className="space-y-1.5">
                            {v.files.map(function (f) { return (<FileCard key={f.id} file={f} locked={v.locked && !isPaid}/>); })}
                          </div>
                          {!isPaid && v.locked && (<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3"/>
                              <span>Files locked until payment is confirmed</span>
                            </div>)}
                          {isPaid && (<div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3"/>
                              <span>Files unlocked — payment confirmed</span>
                            </div>)}
                        </div>); })}
                    </div>)}
                </CardContent>
              </Card>);
        }))}
      </div>

      {/* Sidebar: Change requests */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4"/>
              Change Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {changeRequests.length === 0 ? (<p className="text-sm text-muted-foreground">No change requests.</p>) : (changeRequests.map(function (cr) { return (<div key={cr.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{cr.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cr.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {cr.requestedByName}</span>
                    <span className="capitalize text-amber-600 dark:text-amber-400 font-medium">{cr.status}</span>
                  </div>
                </div>); }))}
          </CardContent>
        </Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Payments Tab
// ---------------------------------------------------------------------------
function PaymentsTab(_a) {
    var deal = _a.deal, payments = _a.payments;
    var isPaid = deal.paymentStatus === 'paid';
    return (<div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Total Deal Amount</p>
                <p className="text-2xl font-display font-semibold mt-0.5">{formatCurrency(deal.price, deal.currency)}</p>
              </div>
              <PaymentStatusBadge status={deal.paymentStatus}/>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Payment Status</span>
                <span className="font-medium capitalize">{deal.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{deal.currency}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Deliverables Access</span>
                <span className="font-medium">
                  {isPaid ? 'Unlocked (All files downloadable)' : 'Locked until payment confirmed'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5"/>
              </div>
              <div>
                <p className="text-sm font-medium">Razorpay Gateway</p>
                <p className="text-xs text-muted-foreground">Cards, UPI, Netbanking & Wallets</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
              When your client completes payment in the portal, files unlock immediately and the transaction is recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Activity Tab
// ---------------------------------------------------------------------------
function ActivityTab(_a) {
    var events = _a.events;
    return (<Card>
      <CardHeader>
        <CardTitle className="text-base">Deal Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (<EmptyState icon={Activity} title="No activity recorded" description="Events will appear here as deal updates occur."/>) : (<Timeline events={events}/>)}
      </CardContent>
    </Card>);
}
function SettingsTab(_a) {
    var deal = _a.deal, onUpdateDeal = _a.onUpdateDeal, fileVersions = _a.fileVersions;
    var router = useRouter();
    var _b = useState(deal.previewEnabled || false), previewEnabled = _b[0], setPreviewEnabled = _b[1];
    var _c = useState(false), updating = _c[0], setUpdating = _c[1];
    var _d = useState(''), statusText = _d[0], setStatusText = _d[1];
    var _e = useState(''), progressText = _e[0], setProgressText = _e[1];
    // Sync state if deal updates
    useEffect(function () {
        setPreviewEnabled(deal.previewEnabled || false);
    }, [deal]);
    function handleTogglePreview(checked) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var supabase, serializedDesc, updateErr, filesToProcess, _i, fileVersions_1, version, files, _d, files_1, f, ext, isImage, isPdf, isVideo, isSupported, completedCount, _e, filesToProcess_1, target, targetExt, targetIsVideo, formData_1, uploadRes_1, signedRes, signedUrl, fileDataRes, blob, fileObj, previewBlob, originalExt, previewExt, originalBaseName, previewName, formData, uploadRes, fileErr_1, err_4;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        setUpdating(true);
                        setStatusText('Updating setting...');
                        setProgressText('');
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 18, 19, 20]);
                        supabase = createClient();
                        serializedDesc = serializeDescription(deal.description, checked);
                        return [4 /*yield*/, supabase
                                .from('deals')
                                .update({ description: serializedDesc })
                                .eq('id', deal.id)];
                    case 2:
                        updateErr = (_f.sent()).error;
                        if (updateErr)
                            throw updateErr;
                        // Update local state
                        onUpdateDeal(__assign(__assign({}, deal), { previewEnabled: checked, description: serializedDesc || '' }));
                        setPreviewEnabled(checked);
                        setStatusText('Setting saved.');
                        if (!checked) return [3 /*break*/, 16];
                        setStatusText('Checking for files needing previews...');
                        filesToProcess = [];
                        for (_i = 0, fileVersions_1 = fileVersions; _i < fileVersions_1.length; _i++) {
                            version = fileVersions_1[_i];
                            files = Array.isArray(version.files) ? version.files : [];
                            for (_d = 0, files_1 = files; _d < files_1.length; _d++) {
                                f = files_1[_d];
                                ext = ((_a = f.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                                isImage = (f.type || '').startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
                                isPdf = f.type === 'application/pdf' || ext === 'pdf';
                                isVideo = (f.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                                isSupported = isImage || isPdf || isVideo;
                                // If supported and does not have a ready preview
                                if (isSupported && (!f.previewPath || f.previewStatus !== 'ready') && f.deletionStatus !== 'deleted') {
                                    filesToProcess.push({
                                        versionId: version.id,
                                        fileId: f.id,
                                        fileItem: f,
                                    });
                                }
                            }
                        }
                        if (filesToProcess.length === 0) {
                            setStatusText('Preview ready');
                            setUpdating(false);
                            return [2 /*return*/];
                        }
                        completedCount = 0;
                        setStatusText("Generating previews... 0 of ".concat(filesToProcess.length, " files completed"));
                        _e = 0, filesToProcess_1 = filesToProcess;
                        _f.label = 3;
                    case 3:
                        if (!(_e < filesToProcess_1.length)) return [3 /*break*/, 15];
                        target = filesToProcess_1[_e];
                        _f.label = 4;
                    case 4:
                        _f.trys.push([4, 13, , 14]);
                        setProgressText("Processing: ".concat(target.fileItem.name, "..."));
                        targetExt = ((_b = target.fileItem.name.split('.').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                        targetIsVideo = (target.fileItem.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(targetExt);
                        if (!targetIsVideo) return [3 /*break*/, 6];
                        formData_1 = new FormData();
                        formData_1.append('dealId', deal.id);
                        formData_1.append('fileVersionId', target.versionId);
                        formData_1.append('fileId', target.fileId);
                        return [4 /*yield*/, fetch('/api/files/preview-upload', {
                                method: 'POST',
                                body: formData_1,
                            })];
                    case 5:
                        uploadRes_1 = _f.sent();
                        if (!uploadRes_1.ok)
                            throw new Error('Failed to start server-side video preview generation');
                        completedCount++;
                        setStatusText("Generating previews... ".concat(completedCount, " of ").concat(filesToProcess.length, " files completed"));
                        return [3 /*break*/, 14];
                    case 6: return [4 /*yield*/, fetch('/api/files/signed-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                dealId: deal.id,
                                filePath: target.fileItem.path,
                                isCreator: true,
                            }),
                        })];
                    case 7:
                        signedRes = _f.sent();
                        if (!signedRes.ok)
                            throw new Error('Failed to get download URL');
                        return [4 /*yield*/, signedRes.json()];
                    case 8:
                        signedUrl = (_f.sent()).signedUrl;
                        if (!signedUrl)
                            throw new Error('Download URL not returned');
                        return [4 /*yield*/, fetch(signedUrl)];
                    case 9:
                        fileDataRes = _f.sent();
                        if (!fileDataRes.ok)
                            throw new Error('Failed to download file');
                        return [4 /*yield*/, fileDataRes.blob()];
                    case 10:
                        blob = _f.sent();
                        fileObj = new File([blob], target.fileItem.name, { type: target.fileItem.type });
                        return [4 /*yield*/, generateClientPreview(fileObj)];
                    case 11:
                        previewBlob = _f.sent();
                        if (!previewBlob)
                            throw new Error('Failed to generate preview copy');
                        originalExt = (_c = fileObj.name.split('.').pop()) === null || _c === void 0 ? void 0 : _c.toLowerCase();
                        previewExt = originalExt || 'jpg';
                        if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
                            previewExt = 'jpg';
                        }
                        originalBaseName = fileObj.name.substring(0, fileObj.name.lastIndexOf('.')) || fileObj.name;
                        previewName = "preview-".concat(originalBaseName, ".").concat(previewExt);
                        formData = new FormData();
                        formData.append('dealId', deal.id);
                        formData.append('fileVersionId', target.versionId);
                        formData.append('fileId', target.fileId);
                        formData.append('previewFile', new File([previewBlob], previewName, { type: previewBlob.type }));
                        return [4 /*yield*/, fetch('/api/files/preview-upload', {
                                method: 'POST',
                                body: formData,
                            })];
                    case 12:
                        uploadRes = _f.sent();
                        if (!uploadRes.ok)
                            throw new Error('Failed to upload preview file');
                        completedCount++;
                        setStatusText("Generating previews... ".concat(completedCount, " of ").concat(filesToProcess.length, " files completed"));
                        return [3 /*break*/, 14];
                    case 13:
                        fileErr_1 = _f.sent();
                        console.error("Failed to process preview for ".concat(target.fileItem.name, ":"), fileErr_1);
                        completedCount++;
                        setStatusText("Generating previews... ".concat(completedCount, " of ").concat(filesToProcess.length, " files completed"));
                        return [3 /*break*/, 14];
                    case 14:
                        _e++;
                        return [3 /*break*/, 3];
                    case 15:
                        setStatusText('Preview ready');
                        setProgressText('');
                        // Trigger a reload or state refresh
                        router.refresh();
                        return [3 /*break*/, 17];
                    case 16:
                        setStatusText('');
                        setProgressText('');
                        _f.label = 17;
                    case 17: return [3 /*break*/, 20];
                    case 18:
                        err_4 = _f.sent();
                        console.error('Error toggling preview settings:', err_4);
                        setStatusText("Error: ".concat(err_4.message || 'Failed to update settings'));
                        return [3 /*break*/, 20];
                    case 19:
                        setUpdating(false);
                        return [7 /*endfinally*/];
                    case 20: return [2 /*return*/];
                }
            });
        });
    }
    return (<Card>
      <CardHeader>
        <CardTitle className="text-base">Deal Workspace Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">Client File Preview</span>
              <p className="text-xs text-muted-foreground pr-4">
                Let clients inspect watermarked previews before payment.
              </p>
            </div>
            <button type="button" disabled={updating} onClick={function () { return handleTogglePreview(!previewEnabled); }} className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50", previewEnabled ? "bg-primary" : "bg-muted")}>
              <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out", previewEnabled ? "translate-x-5" : "translate-x-0")}/>
            </button>
          </div>

          {(statusText || progressText) && (<div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
              {statusText && <p className="font-semibold text-primary">{statusText}</p>}
              {progressText && <p className="text-muted-foreground">{progressText}</p>}
            </div>)}
        </div>
      </CardContent>
    </Card>);
}
var loadPdfLib = function () {
    return new Promise(function (resolve, reject) {
        if (window.PDFLib)
            return resolve(window.PDFLib);
        var script = document.createElement('script');
        script.src = '/lib/pdf-lib.min.js';
        script.onload = function () { return resolve(window.PDFLib); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};
function generateClientPreview(file) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var fileType, ext, isImage, isPdf, PDFLib, fileBytes, _b, pdfDoc, font, pages, pagesToKeep, previewDoc, copiedPages, _i, copiedPages_1, page, _c, width, height, text, fontSize, stepX, stepY, rotationAngle, y, xOffset, x, previewBytes, err_5;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fileType = file.type || '';
                    ext = ((_a = file.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                    isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
                    isPdf = fileType === 'application/pdf' || ext === 'pdf';
                    if (isImage) {
                        return [2 /*return*/, new Promise(function (resolve) {
                                var reader = new FileReader();
                                reader.onload = function (event) {
                                    var _a;
                                    var img = new Image();
                                    img.onload = function () {
                                        var canvas = document.createElement('canvas');
                                        var maxDim = 1000;
                                        var width = img.width;
                                        var height = img.height;
                                        if (width > height) {
                                            if (width > maxDim) {
                                                height = Math.round((height * maxDim) / width);
                                                width = maxDim;
                                            }
                                        }
                                        else {
                                            if (height > maxDim) {
                                                width = Math.round((width * maxDim) / height);
                                                height = maxDim;
                                            }
                                        }
                                        canvas.width = width;
                                        canvas.height = height;
                                        var ctx = canvas.getContext('2d');
                                        if (!ctx) {
                                            resolve(null);
                                            return;
                                        }
                                        ctx.drawImage(img, 0, 0, width, height);
                                        ctx.save();
                                        // Calculate font size dynamically based on dimensions (responsive)
                                        var fontSize = Math.max(32, Math.round(Math.min(width, height) * 0.045));
                                        ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)'; // Hollow dark gray outline at 35% opacity
                                        ctx.lineWidth = 2;
                                        ctx.font = "bold ".concat(fontSize, "px sans-serif");
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        var text = 'DELT PREVIEW';
                                        var textWidth = ctx.measureText(text).width;
                                        var stepX = textWidth + 35; // Compact horizontal gap (20-50px)
                                        var stepY = fontSize + 45; // Compact vertical gap (30-60px)
                                        // Rotate by -30 degrees
                                        ctx.rotate((-30 * Math.PI) / 180);
                                        // Render staggered tiled grid of hollow watermarks
                                        for (var y = -height * 2; y < height * 2.5; y += stepY) {
                                            var xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
                                            for (var x = -width * 2 - xOffset; x < width * 2.5; x += stepX) {
                                                ctx.strokeText(text, x + xOffset, y);
                                            }
                                        }
                                        ctx.restore();
                                        canvas.toBlob(function (blob) {
                                            resolve(blob);
                                        }, 'image/jpeg', 0.6);
                                    };
                                    img.onerror = function () { return resolve(null); };
                                    img.src = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                                };
                                reader.onerror = function () { return resolve(null); };
                                reader.readAsDataURL(file);
                            })];
                    }
                    if (!isPdf) return [3 /*break*/, 10];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, loadPdfLib()];
                case 2:
                    PDFLib = (_d.sent());
                    if (!PDFLib)
                        return [2 /*return*/, null];
                    _b = Uint8Array.bind;
                    return [4 /*yield*/, file.arrayBuffer()];
                case 3:
                    fileBytes = new (_b.apply(Uint8Array, [void 0, _d.sent()]))();
                    return [4 /*yield*/, PDFLib.PDFDocument.load(fileBytes)];
                case 4:
                    pdfDoc = _d.sent();
                    return [4 /*yield*/, pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold)];
                case 5:
                    font = _d.sent();
                    pages = pdfDoc.getPages();
                    pagesToKeep = pages.slice(0, 5);
                    return [4 /*yield*/, PDFLib.PDFDocument.create()];
                case 6:
                    previewDoc = _d.sent();
                    return [4 /*yield*/, previewDoc.copyPages(pdfDoc, pagesToKeep.map(function (_, i) { return i; }))];
                case 7:
                    copiedPages = _d.sent();
                    for (_i = 0, copiedPages_1 = copiedPages; _i < copiedPages_1.length; _i++) {
                        page = copiedPages_1[_i];
                        previewDoc.addPage(page);
                        _c = page.getSize(), width = _c.width, height = _c.height;
                        text = 'DELT PREVIEW';
                        fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
                        stepX = (fontSize * 8) + 35;
                        stepY = fontSize + 45;
                        rotationAngle = 30;
                        page.pushOperators(PDFLib.pushGraphicsState(), PDFLib.setStrokingColor(PDFLib.rgb(0.27, 0.27, 0.27)), // rgb(70,70,70) -> 70/255 = 0.27
                        PDFLib.setLineWidth(2), PDFLib.setTextRenderingMode(PDFLib.TextRenderingMode.Outline));
                        for (y = -100; y < height + 200; y += stepY) {
                            xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
                            for (x = -100 - xOffset; x < width + 200; x += stepX) {
                                page.drawText(text, {
                                    x: x + xOffset,
                                    y: y,
                                    size: fontSize,
                                    font: font,
                                    opacity: 0.35,
                                    rotate: PDFLib.degrees(rotationAngle),
                                });
                            }
                        }
                        page.pushOperators(PDFLib.popGraphicsState());
                    }
                    return [4 /*yield*/, previewDoc.save()];
                case 8:
                    previewBytes = _d.sent();
                    return [2 /*return*/, new Blob([previewBytes], { type: 'application/pdf' })];
                case 9:
                    err_5 = _d.sent();
                    console.error('Error generating PDF preview client-side:', err_5);
                    return [2 /*return*/, null];
                case 10: return [2 /*return*/, null];
            }
        });
    });
}
