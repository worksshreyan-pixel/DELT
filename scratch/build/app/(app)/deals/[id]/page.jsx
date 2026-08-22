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
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DealWorkspace } from '@/components/deal-workspace';
import { Breadcrumb } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { FolderKanban } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { parseDescription } from '@/lib/utils';
export default function DealDetailPage() {
    var params = useParams();
    var dealId = params.id;
    var store = useAppStore();
    var _a = useState(function () { return store.deals.find(function (d) { return d.id === dealId; }) || null; }), deal = _a[0], setDeal = _a[1];
    var _b = useState(function () { return store.messages[dealId] || []; }), messages = _b[0], setMessages = _b[1];
    var _c = useState(function () { return store.proposals[dealId] || []; }), proposals = _c[0], setProposals = _c[1];
    var _d = useState(function () { return store.deliverables[dealId] || []; }), deliverables = _d[0], setDeliverables = _d[1];
    var _e = useState(function () { return store.fileVersions[dealId] || []; }), fileVersions = _e[0], setFileVersions = _e[1];
    var _f = useState(function () { return store.events[dealId] || []; }), events = _f[0], setEvents = _f[1];
    var _g = useState(function () { return store.payments[dealId] || []; }), payments = _g[0], setPayments = _g[1];
    var _h = useState(!deal), loading = _h[0], setLoading = _h[1];
    useEffect(function () {
        var storeDeal = store.deals.find(function (d) { return d.id === dealId; });
        if (storeDeal) {
            setDeal(storeDeal);
            setPayments(store.payments[dealId] || []);
        }
        if (!hasSupabasePublicConfig()) {
            setLoading(false);
            return;
        }
        function fetchDealData() {
            return __awaiter(this, void 0, void 0, function () {
                var supabase, currentDeal, dbDeal, _a, dbMsgs, dbProps, dbDelivs, dbVersions, dbEvents, err_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            supabase = createClient();
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 6, 7, 8]);
                            currentDeal = storeDeal;
                            if (!!currentDeal) return [3 /*break*/, 3];
                            return [4 /*yield*/, supabase
                                    .from('deals')
                                    .select('*')
                                    .eq('id', dealId)
                                    .maybeSingle()];
                        case 2:
                            dbDeal = (_b.sent()).data;
                            if (dbDeal) {
                                currentDeal = {
                                    id: dbDeal.id,
                                    token: dbDeal.token,
                                    creatorId: dbDeal.creator_id,
                                    clientId: dbDeal.client_id || '',
                                    title: dbDeal.title,
                                    description: parseDescription(dbDeal.description).description,
                                    scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
                                    price: Number(dbDeal.price),
                                    currency: dbDeal.currency || 'INR',
                                    status: dbDeal.status || 'in_progress',
                                    deadline: dbDeal.deadline,
                                    progress: Number(dbDeal.progress || 0),
                                    paymentStatus: dbDeal.payment_status || 'pending',
                                    lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
                                    createdAt: dbDeal.created_at,
                                    updatedAt: dbDeal.updated_at,
                                    previewEnabled: parseDescription(dbDeal.description).previewEnabled,
                                };
                                setDeal(currentDeal);
                            }
                            _b.label = 3;
                        case 3:
                            if (!currentDeal) return [3 /*break*/, 5];
                            return [4 /*yield*/, Promise.all([
                                    supabase.from('deal_messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: true }),
                                    supabase.from('price_proposals').select('*').eq('deal_id', dealId).order('created_at', { ascending: true }),
                                    supabase.from('deliverables').select('*').eq('deal_id', dealId),
                                    supabase.from('file_versions').select('*').eq('deal_id', dealId).order('version', { ascending: true }),
                                    supabase.from('deal_events').select('*').eq('deal_id', dealId).order('created_at', { ascending: false })
                                ])];
                        case 4:
                            _a = _b.sent(), dbMsgs = _a[0], dbProps = _a[1], dbDelivs = _a[2], dbVersions = _a[3], dbEvents = _a[4];
                            if (dbMsgs.data) {
                                setMessages(dbMsgs.data.map(function (m) { return ({
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
                            if (dbProps.data) {
                                setProposals(dbProps.data.map(function (p) { return ({
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
                                    createdAt: p.created_at,
                                }); }));
                            }
                            if (dbDelivs.data) {
                                setDeliverables(dbDelivs.data.map(function (d) { return ({
                                    id: d.id,
                                    dealId: d.deal_id,
                                    name: d.name,
                                    description: d.description,
                                    status: d.status,
                                    createdAt: d.created_at,
                                }); }));
                            }
                            if (dbVersions.data) {
                                setFileVersions(dbVersions.data.map(function (v) { return ({
                                    id: v.id,
                                    deliverableId: v.deliverable_id,
                                    dealId: v.deal_id || dealId,
                                    version: v.version,
                                    description: v.description,
                                    uploaderId: v.uploader_id || '',
                                    uploaderName: v.uploader_name || 'Creator',
                                    files: Array.isArray(v.files) ? v.files : [],
                                    status: v.status,
                                    locked: Boolean(v.locked),
                                    createdAt: v.created_at,
                                }); }));
                            }
                            if (dbEvents.data) {
                                setEvents(dbEvents.data.map(function (e) { return ({
                                    id: e.id,
                                    dealId: e.deal_id,
                                    type: e.type,
                                    actorName: e.actor_name || 'System',
                                    actorRole: e.actor_role || 'system',
                                    description: e.description,
                                    createdAt: e.created_at,
                                }); }));
                            }
                            _b.label = 5;
                        case 5: return [3 /*break*/, 8];
                        case 6:
                            err_1 = _b.sent();
                            console.error('Error fetching deal details', err_1);
                            return [3 /*break*/, 8];
                        case 7:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        }
        fetchDealData();
    }, [dealId, store.deals, store.payments]);
    useEffect(function () {
        if (!dealId || !hasSupabasePublicConfig())
            return;
        var supabase = createClient();
        var channel = supabase
            .channel("deal-creator:".concat(dealId))
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: "deal_id=eq.".concat(dealId) }, function (payload) {
            var raw = payload.new;
            var formattedMsg = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || dealId,
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
                // Filter out optimistic message if content matches
                var filtered = prev.filter(function (m) { return !(m.id.startsWith('msg_') && m.content === formattedMsg.content); });
                return __spreadArray(__spreadArray([], filtered, true), [formattedMsg], false);
            });
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'price_proposals', filter: "deal_id=eq.".concat(dealId) }, function (payload) {
            var _a, _b, _c, _d;
            var raw = payload.new;
            var formattedProp = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || dealId,
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
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals', filter: "id=eq.".concat(dealId) }, function (payload) {
            var updated = payload.new;
            setDeal(function (prev) {
                var _a;
                if (!prev)
                    return null;
                return __assign(__assign(__assign({}, prev), updated), { price: Number((_a = updated.price) !== null && _a !== void 0 ? _a : prev.price), status: updated.status || prev.status, paymentStatus: updated.payment_status || prev.paymentStatus, lastActivityAt: updated.last_activity_at || prev.lastActivityAt });
            });
        })
            .subscribe();
        return function () {
            supabase.removeChannel(channel);
        };
    }, [dealId]);
    if (loading) {
        return (<div className="py-16 text-center space-y-2">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-xs text-muted-foreground">Loading deal workspace...</p>
      </div>);
    }
    if (!deal) {
        return (<div className="py-12">
        <EmptyState icon={FolderKanban} title="Deal not found" description="This deal may have been removed or does not exist." actionLabel="Back to Deals" actionHref="/deals"/>
      </div>);
    }
    var client = store.clients.find(function (c) { return c.id === deal.clientId; });
    var clientName = deal.client_name || deal.clientName || (client === null || client === void 0 ? void 0 : client.name) || 'Client';
    var clientCompany = client === null || client === void 0 ? void 0 : client.company;
    return (<div className="space-y-4">
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: deal.title }]}/>
      <DealWorkspace deal={deal} clientName={clientName} clientEmail={deal.client_email || deal.clientEmail || ''} clientCompany={clientCompany} creatorName={store.user.displayName || 'Creator'} messages={messages} proposals={proposals} events={events} deliverables={deliverables} fileVersions={fileVersions} milestones={[]} payments={payments} changeRequests={[]}/>
    </div>);
}
