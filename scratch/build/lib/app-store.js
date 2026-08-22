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
// ============================================================================
// DELT — Application Store (User-Isolated Real Reactive Store)
// ============================================================================
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { parseDescription } from '@/lib/utils';
// ---------------------------------------------------------------------------
// Standard Blueprints / Templates
// ---------------------------------------------------------------------------
export var STANDARD_TEMPLATES = [
    {
        id: 'tpl-website-dev',
        creatorId: 'standard',
        name: 'Website Development',
        category: 'Web Development',
        description: 'Full-stack or front-end website build tailored to client brand requirements.',
        defaultPrice: 45000,
        currency: 'INR',
        scope: [
            'Requirements & design system review',
            'Responsive web development (desktop & mobile)',
            'CMS integration and SEO configuration',
            'Testing, deployment & handoff',
        ],
        deliverables: ['Production Website Code', 'CMS Admin Credentials', 'Documentation'],
        usageCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'tpl-landing-page',
        creatorId: 'standard',
        name: 'Landing Page & Funnel',
        category: 'Web Development',
        description: 'High-converting single page or campaign funnel with responsive design.',
        defaultPrice: 20000,
        currency: 'INR',
        scope: [
            'Conversion copywriting & structure review',
            'Modern responsive page implementation',
            'Lead capture form & CRM / email integration',
            'Speed optimization & launch checklist',
        ],
        deliverables: ['Live Landing Page', 'Asset Exports', 'Analytics Integration'],
        usageCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'tpl-brand-identity',
        creatorId: 'standard',
        name: 'Brand Identity & Guidelines',
        category: 'Brand Design',
        description: 'Complete brand visual identity system, typography, colors, and asset exports.',
        defaultPrice: 30000,
        currency: 'INR',
        scope: [
            'Brand discovery & moodboard direction',
            'Logo design with primary, secondary & icon variations',
            'Color palette & typography pairing system',
            'Comprehensive brand guideline deck (PDF)',
        ],
        deliverables: ['Vector Logo Package (SVG, EPS, PNG)', 'Brand Style Guide (PDF)', 'Social Media Kit'],
        usageCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'tpl-video-editing',
        creatorId: 'standard',
        name: 'Video Production & Editing',
        category: 'Video Editing',
        description: 'Commercial video editing, color grading, audio mix, and multi-format exports.',
        defaultPrice: 25000,
        currency: 'INR',
        scope: [
            'Footage ingest & narrative assembly cut',
            'Color grading, sound design & background music mix',
            'Motion graphics, subtitles & titles',
            'Revisions & final format exports (16:9 & 9:16)',
        ],
        deliverables: ['Master 4K Export', 'Social Media Cuts (9:16)', 'Project Archive'],
        usageCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
    },
    {
        id: 'tpl-ui-ux-design',
        creatorId: 'standard',
        name: 'UI/UX Mobile & Web App Design',
        category: 'UI/UX Design',
        description: 'End-to-end product design, user journeys, wireframes, and interactive Figma prototypes.',
        defaultPrice: 50000,
        currency: 'INR',
        scope: [
            'User journey mapping & information architecture',
            'High-fidelity interactive prototype in Figma',
            'Design system components & auto-layout tokens',
            'Developer handoff review & asset exports',
        ],
        deliverables: ['Interactive Figma File', 'Design System Library', 'Handoff Documentation'],
        usageCount: 0,
        createdAt: '2025-01-01T00:00:00Z',
    },
];
import { FREE_PLAN_DEAL_LIMIT, FREE_PLAN_STORAGE_BYTES } from '@/lib/plans';
export var INITIAL_STORE_STATE = {
    deals: [],
    clients: [],
    messages: {},
    proposals: {},
    events: {},
    deliverables: {},
    fileVersions: {},
    payments: {},
    notifications: [],
    transactions: [],
    storage: {
        totalBytes: 0,
        limitBytes: FREE_PLAN_STORAGE_BYTES,
        breakdown: {
            files: 0,
            versions: 0,
            attachments: 0,
        },
    },
    credits: {
        planId: 'free',
        total: FREE_PLAN_DEAL_LIMIT,
        used: 0,
        remaining: FREE_PLAN_DEAL_LIMIT,
    },
    user: {
        id: '',
        displayName: 'Your Account',
        email: '',
        profession: 'Digital Creator',
    },
    templates: STANDARD_TEMPLATES,
};
var activeUserId = null;
var currentStoreState = __assign({}, INITIAL_STORE_STATE);
var listeners = new Set();
function notifyListeners() {
    listeners.forEach(function (listener) {
        try {
            listener();
        }
        catch (e) {
            console.error(e);
        }
    });
}
function getStorageKey(userId) {
    var uid = userId || activeUserId;
    return uid ? "delt_user_".concat(uid, "_data") : 'delt_guest_data';
}
export function loadStoreForUser(userId) {
    if (typeof window === 'undefined') {
        return __assign({}, INITIAL_STORE_STATE);
    }
    var key = getStorageKey(userId);
    try {
        var raw = localStorage.getItem(key);
        if (raw) {
            var parsed = JSON.parse(raw);
            currentStoreState = __assign(__assign(__assign({}, INITIAL_STORE_STATE), parsed), { templates: STANDARD_TEMPLATES });
            return currentStoreState;
        }
    }
    catch (e) {
        console.error('Failed to load store from localStorage', e);
    }
    currentStoreState = __assign({}, INITIAL_STORE_STATE);
    return currentStoreState;
}
export function saveStore(data, userId) {
    currentStoreState = data;
    if (typeof window !== 'undefined') {
        try {
            var key = getStorageKey(userId);
            localStorage.setItem(key, JSON.stringify(data));
        }
        catch (e) {
            console.error('Failed to persist store', e);
        }
    }
    notifyListeners();
}
/**
 * Completely resets store state and clears user cache (e.g. on logout).
 */
export function clearStoreState() {
    if (typeof window !== 'undefined') {
        try {
            if (activeUserId) {
                localStorage.removeItem("delt_user_".concat(activeUserId, "_data"));
            }
            localStorage.removeItem('delt_guest_data');
            localStorage.removeItem('delt_app_data_v2');
        }
        catch (e) {
            console.error('Error clearing localStorage', e);
        }
    }
    activeUserId = null;
    currentStoreState = __assign({}, INITIAL_STORE_STATE);
    notifyListeners();
}
/**
 * Sets active user and loads user-specific store.
 */
export function setStoreUser(user) {
    if (activeUserId !== user.id) {
        activeUserId = user.id;
        loadStoreForUser(user.id);
        currentStoreState.user = {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
        };
        notifyListeners();
    }
}
/**
 * Asynchronously synchronizes store state with real Supabase records.
 */
var isSyncing = false;
var lastSyncedAt = 0;
var SYNC_COOLDOWN_MS = 5000;
export function syncStoreFromSupabase(userId, force) {
    if (force === void 0) { force = false; }
    return __awaiter(this, void 0, void 0, function () {
        var now, supabase, _a, dealsRes, clientsRes, storageRes, creditsRes, notifsRes, txRes, dealsData, clientsData, storageData, creditsData, notifsData, txData, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!hasSupabasePublicConfig() || !userId)
                        return [2 /*return*/];
                    now = Date.now();
                    if (!force && (isSyncing || (now - lastSyncedAt < SYNC_COOLDOWN_MS))) {
                        return [2 /*return*/];
                    }
                    isSyncing = true;
                    supabase = createClient();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            supabase.from('deals').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
                            supabase.from('clients').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
                            supabase.from('storage_usage').select('*').eq('user_id', userId).maybeSingle(),
                            supabase.from('deal_credits').select('*').eq('user_id', userId).maybeSingle(),
                            supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                            supabase.from('transactions').select('*').eq('creator_id', userId).order('date', { ascending: false })
                        ])];
                case 2:
                    _a = _b.sent(), dealsRes = _a[0], clientsRes = _a[1], storageRes = _a[2], creditsRes = _a[3], notifsRes = _a[4], txRes = _a[5];
                    dealsData = dealsRes.data;
                    clientsData = clientsRes.data;
                    storageData = storageRes.data;
                    creditsData = creditsRes.data;
                    notifsData = notifsRes.data;
                    txData = txRes.data;
                    if (dealsData) {
                        currentStoreState.deals = dealsData.map(function (d) { return ({
                            id: d.id,
                            token: d.token,
                            creatorId: d.creator_id,
                            clientId: d.client_id,
                            clientName: d.client_name,
                            clientEmail: d.client_email,
                            title: d.title,
                            description: parseDescription(d.description).description,
                            scope: Array.isArray(d.scope) ? d.scope : [],
                            price: Number(d.price),
                            currency: d.currency || 'INR',
                            status: d.status || 'in_progress',
                            deadline: d.deadline,
                            progress: Number(d.progress || 0),
                            paymentStatus: d.payment_status || 'pending',
                            lastActivityAt: d.last_activity_at || d.created_at,
                            createdAt: d.created_at,
                            updatedAt: d.updated_at,
                            previewEnabled: parseDescription(d.description).previewEnabled,
                        }); });
                    }
                    if (clientsData) {
                        currentStoreState.clients = clientsData.map(function (c) { return ({
                            id: c.id,
                            creatorId: c.creator_id,
                            name: c.name,
                            email: c.email,
                            company: c.company,
                            dealCount: c.deal_count,
                            totalValue: Number(c.total_value),
                            currency: c.currency,
                            lastActivityAt: c.last_activity_at,
                            status: c.status,
                            createdAt: c.created_at,
                        }); });
                    }
                    if (storageData) {
                        currentStoreState.storage = {
                            totalBytes: Number(storageData.total_bytes || 0),
                            limitBytes: Number(storageData.limit_bytes || 1073741824),
                            breakdown: {
                                files: Number(storageData.files_bytes || 0),
                                versions: Number(storageData.versions_bytes || 0),
                                attachments: Number(storageData.attachments_bytes || 0),
                            },
                        };
                    }
                    if (creditsData) {
                        currentStoreState.credits = {
                            planId: creditsData.plan_id || 'free',
                            total: Number(creditsData.total || FREE_PLAN_DEAL_LIMIT),
                            used: currentStoreState.deals.length,
                            remaining: Math.max(0, Number(creditsData.total || FREE_PLAN_DEAL_LIMIT) - currentStoreState.deals.length),
                        };
                    }
                    else {
                        currentStoreState.credits = {
                            planId: 'free',
                            total: FREE_PLAN_DEAL_LIMIT,
                            used: currentStoreState.deals.length,
                            remaining: Math.max(0, FREE_PLAN_DEAL_LIMIT - currentStoreState.deals.length),
                        };
                    }
                    if (notifsData) {
                        currentStoreState.notifications = notifsData.map(function (n) { return ({
                            id: n.id,
                            type: n.type,
                            title: n.title,
                            description: n.description,
                            dealId: n.deal_id,
                            dealTitle: n.deal_title,
                            read: Boolean(n.read),
                            createdAt: n.created_at,
                        }); });
                    }
                    if (txData) {
                        currentStoreState.transactions = txData.map(function (t) { return ({
                            id: t.id,
                            paymentId: t.payment_id,
                            dealId: t.deal_id,
                            creatorId: t.creator_id,
                            dealTitle: t.deal_title,
                            clientName: t.client_name,
                            amount: Number(t.amount),
                            currency: t.currency,
                            platformFee: Number(t.platform_fee),
                            processingFee: Number(t.processing_fee),
                            netAmount: Number(t.net_amount),
                            state: t.state,
                            date: t.date,
                        }); });
                    }
                    saveStore(currentStoreState, userId);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    console.error('Error syncing store from Supabase', err_1);
                    return [3 /*break*/, 5];
                case 4:
                    isSyncing = false;
                    lastSyncedAt = Date.now();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// ---------------------------------------------------------------------------
// React Hook (Deterministic Hydration)
// ---------------------------------------------------------------------------
export function useAppStore() {
    // Always initialize state with INITIAL_STORE_STATE for SSR & initial client render determinism
    var _a = useState(INITIAL_STORE_STATE), state = _a[0], setState = _a[1];
    useEffect(function () {
        // Load store on client mount
        var initialData = loadStoreForUser(activeUserId);
        setState(__assign({}, initialData));
        var onChange = function () { return setState(__assign({}, currentStoreState)); };
        listeners.add(onChange);
        // If Supabase is available, sync data
        if (hasSupabasePublicConfig()) {
            var supabase = createClient();
            supabase.auth.getUser().then(function (_a) {
                var _b, _c;
                var user = _a.data.user;
                if (user) {
                    setStoreUser({
                        id: user.id,
                        email: user.email || '',
                        displayName: ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.displayName) || ((_c = user.email) === null || _c === void 0 ? void 0 : _c.split('@')[0]) || 'Creator',
                    });
                    syncStoreFromSupabase(user.id);
                }
            });
        }
        return function () {
            listeners.delete(onChange);
        };
    }, []);
    return state;
}
// ---------------------------------------------------------------------------
// Store Selectors & Actions
// ---------------------------------------------------------------------------
export function getDealById(id) {
    return currentStoreState.deals.find(function (d) { return d.id === id; });
}
export function getDealByToken(token) {
    return currentStoreState.deals.find(function (d) { return d.token === token; });
}
export function getClientById(id) {
    return currentStoreState.clients.find(function (c) { return c.id === id; });
}
export function getMessagesByDeal(dealId) {
    return currentStoreState.messages[dealId] || [];
}
export function getProposalsByDeal(dealId) {
    return currentStoreState.proposals[dealId] || [];
}
export function getEventsByDeal(dealId) {
    return currentStoreState.events[dealId] || [];
}
export function getDeliverablesByDeal(dealId) {
    return currentStoreState.deliverables[dealId] || [];
}
export function getFileVersionsByDeal(dealId) {
    return currentStoreState.fileVersions[dealId] || [];
}
export function getPaymentsByDeal(dealId) {
    return currentStoreState.payments[dealId] || [];
}
export function getTemplateById(id) {
    return currentStoreState.templates.find(function (t) { return t.id === id; });
}
export function createDealInStore(input) {
    var store = currentStoreState;
    var now = new Date().toISOString();
    var dealId = "dl_".concat(Date.now());
    var token = "dl_".concat(Math.random().toString(36).slice(2, 14));
    var currency = input.currency || 'INR';
    // Find or create client
    var client = store.clients.find(function (c) { return c.email.toLowerCase() === input.clientEmail.toLowerCase(); });
    if (!client) {
        client = {
            id: "cl_".concat(Date.now()),
            creatorId: store.user.id,
            name: input.clientName,
            email: input.clientEmail,
            company: input.clientCompany,
            dealCount: 1,
            totalValue: input.price,
            currency: currency,
            lastActivityAt: now,
            status: 'active',
            createdAt: now,
        };
        store.clients.unshift(client);
    }
    else {
        client.dealCount += 1;
        client.totalValue += input.price;
        client.lastActivityAt = now;
    }
    var newDeal = {
        id: dealId,
        token: token,
        creatorId: store.user.id,
        clientId: client.id,
        title: input.title,
        description: input.description || '',
        scope: input.scope && input.scope.length > 0 ? input.scope : ['Project requirements'],
        price: input.price,
        currency: currency,
        status: 'in_progress',
        deadline: input.deadline,
        progress: 10,
        paymentStatus: 'pending',
        lastActivityAt: now,
        createdAt: now,
        updatedAt: now,
        previewEnabled: input.previewEnabled || false,
    };
    store.deals.unshift(newDeal);
    // Initial event
    var createdEvent = {
        id: "ev_".concat(Date.now(), "_1"),
        dealId: dealId,
        type: 'deal_created',
        actorId: store.user.id,
        actorName: store.user.displayName,
        actorRole: 'creator',
        description: "Deal created for ".concat(input.clientName, " at ").concat(input.price, " ").concat(currency),
        createdAt: now,
    };
    var sharedEvent = {
        id: "ev_".concat(Date.now(), "_2"),
        dealId: dealId,
        type: 'deal_shared',
        actorId: store.user.id,
        actorName: store.user.displayName,
        actorRole: 'creator',
        description: "Private link generated for ".concat(input.clientEmail),
        createdAt: now,
    };
    store.events[dealId] = [sharedEvent, createdEvent];
    // Initial greeting message
    var welcomeMsg = {
        id: "msg_".concat(Date.now()),
        dealId: dealId,
        senderId: store.user.id,
        senderName: store.user.displayName,
        senderRole: 'creator',
        type: 'text',
        content: "Welcome to the Deal workspace! I have prepared the scope and deliverables for \"".concat(input.title, "\". Feel free to chat, propose adjustments, or review progress right here."),
        createdAt: now,
    };
    store.messages[dealId] = [welcomeMsg];
    store.proposals[dealId] = [];
    // Deliverables
    var deliverablesList = (input.deliverables && input.deliverables.length > 0
        ? input.deliverables
        : ['Final Project Deliverables']).map(function (delName, idx) { return ({
        id: "del_".concat(Date.now(), "_").concat(idx),
        dealId: dealId,
        name: delName,
        status: 'pending',
        createdAt: now,
    }); });
    store.deliverables[dealId] = deliverablesList;
    store.fileVersions[dealId] = [];
    store.payments[dealId] = [];
    // Deduct/track credit
    store.credits.used = store.deals.length;
    store.credits.remaining = Math.max(0, store.credits.total - store.credits.used);
    saveStore(store, store.user.id);
    return newDeal;
}
export function addMessageToStore(dealId, input) {
    var store = currentStoreState;
    var now = new Date().toISOString();
    var msg = {
        id: "msg_".concat(Date.now()),
        dealId: dealId,
        senderId: input.senderId,
        senderName: input.senderName,
        senderRole: input.senderRole,
        type: input.type || 'text',
        content: input.content,
        proposalId: input.proposalId,
        createdAt: now,
    };
    if (!store.messages[dealId])
        store.messages[dealId] = [];
    store.messages[dealId].push(msg);
    // Update deal activity
    var deal = store.deals.find(function (d) { return d.id === dealId; });
    if (deal) {
        deal.lastActivityAt = now;
        deal.updatedAt = now;
    }
    saveStore(store, store.user.id);
    return msg;
}
export function addProposalToStore(dealId, proposedPrice, reason, proposedByRole, proposedByName, parentProposalId) {
    var store = currentStoreState;
    var now = new Date().toISOString();
    var deal = store.deals.find(function (d) { return d.id === dealId; });
    var prevPrice = deal ? deal.price : proposedPrice;
    if (parentProposalId) {
        var parent_1 = (store.proposals[dealId] || []).find(function (p) { return p.id === parentProposalId; });
        if (parent_1) {
            prevPrice = parent_1.proposedPrice;
        }
    }
    var proposal = {
        id: "prop_".concat(Date.now()),
        dealId: dealId,
        direction: proposedByRole === 'creator' ? 'creator_to_client' : 'client_to_creator',
        previousPrice: prevPrice,
        proposedPrice: proposedPrice,
        reason: reason,
        state: 'pending',
        proposedBy: proposedByRole,
        proposedByName: proposedByName,
        proposedByRole: proposedByRole,
        createdAt: now,
        counterProposalId: parentProposalId || undefined,
    };
    if (parentProposalId) {
        var parent_2 = (store.proposals[dealId] || []).find(function (p) { return p.id === parentProposalId; });
        if (parent_2) {
            parent_2.state = 'countered';
            parent_2.resolvedAt = now;
        }
    }
    if (!store.proposals[dealId])
        store.proposals[dealId] = [];
    store.proposals[dealId].push(proposal);
    if (deal) {
        deal.status = 'negotiating';
        deal.lastActivityAt = now;
    }
    addMessageToStore(dealId, {
        senderId: proposedByRole,
        senderName: proposedByName,
        senderRole: proposedByRole,
        type: 'proposal',
        content: "".concat(proposedByName, " proposed price change to ").concat(proposedPrice),
        proposalId: proposal.id,
    });
    saveStore(store, store.user.id);
    return proposal;
}
export function respondToProposalInStore(dealId, proposalId, response, responderName) {
    var store = currentStoreState;
    var now = new Date().toISOString();
    var proposal = (store.proposals[dealId] || []).find(function (p) { return p.id === proposalId; });
    var deal = store.deals.find(function (d) { return d.id === dealId; });
    if (proposal) {
        proposal.state = response === 'accept' ? 'accepted' : 'declined';
        proposal.resolvedAt = now;
    }
    if (response === 'accept' && proposal && deal) {
        deal.price = proposal.proposedPrice;
        deal.status = 'agreed';
        deal.lastActivityAt = now;
        if (!store.events[dealId])
            store.events[dealId] = [];
        store.events[dealId].unshift({
            id: "ev_".concat(Date.now()),
            dealId: dealId,
            type: 'price_accepted',
            actorName: responderName,
            actorRole: 'creator',
            description: "Price proposal of ".concat(proposal.proposedPrice, " ").concat(deal.currency, " accepted."),
            createdAt: now,
        });
    }
    saveStore(store, store.user.id);
}
export function simulatePaymentInStore(dealId, paymentMethod) {
    if (paymentMethod === void 0) { paymentMethod = 'Razorpay'; }
    var store = currentStoreState;
    var now = new Date().toISOString();
    var deal = store.deals.find(function (d) { return d.id === dealId; });
    var client = deal ? store.clients.find(function (c) { return c.id === deal.clientId; }) : undefined;
    var clientName = (deal === null || deal === void 0 ? void 0 : deal.clientName) || (client === null || client === void 0 ? void 0 : client.name) || 'Client';
    if (deal) {
        deal.paymentStatus = 'paid';
        deal.status = 'completed';
        deal.progress = 100;
        deal.lastActivityAt = now;
        deal.updatedAt = now;
        // Unlock files
        var versions = store.fileVersions[dealId] || [];
        versions.forEach(function (v) {
            v.locked = false;
            v.status = 'approved';
        });
        // Create transaction
        var txId = "TXN-".concat(Date.now().toString().slice(-6));
        var tx = {
            id: txId,
            paymentId: "pay_".concat(Date.now()),
            dealId: deal.id,
            dealTitle: deal.title,
            clientName: clientName,
            amount: deal.price,
            currency: deal.currency,
            platformFee: Math.round(deal.price * 0.05),
            processingFee: Math.round(deal.price * 0.02),
            netAmount: Math.round(deal.price * 0.93),
            state: 'paid',
            date: now,
        };
        store.transactions.unshift(tx);
        // Event
        if (!store.events[dealId])
            store.events[dealId] = [];
        store.events[dealId].unshift({
            id: "ev_".concat(Date.now()),
            dealId: dealId,
            type: 'payment_completed',
            actorName: clientName,
            actorRole: 'client',
            description: "Payment of ".concat(deal.price, " ").concat(deal.currency, " verified via ").concat(paymentMethod, ". Files unlocked."),
            createdAt: now,
        });
        // System message
        addMessageToStore(dealId, {
            senderId: 'system',
            senderName: 'DELT System',
            senderRole: 'creator',
            type: 'system',
            content: "Payment of ".concat(deal.price, " ").concat(deal.currency, " confirmed! All deliverable files have been unlocked for download."),
        });
        // Notification
        store.notifications.unshift({
            id: "notif_".concat(Date.now()),
            type: 'payment_received',
            title: 'Payment Received',
            description: "Received ".concat(deal.price, " ").concat(deal.currency, " for \"").concat(deal.title, "\""),
            dealId: deal.id,
            dealTitle: deal.title,
            read: false,
            createdAt: now,
        });
        saveStore(store, store.user.id);
    }
}
export function closeDealInStore(dealId) {
    var store = currentStoreState;
    var deal = store.deals.find(function (d) { return d.id === dealId; });
    if (deal) {
        var now = new Date().toISOString();
        deal.status = 'closed';
        deal.updatedAt = now;
        if (!store.events[dealId]) {
            store.events[dealId] = [];
        }
        var retentionDays = 30;
        var retentionUntil_1 = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
        store.events[dealId].push({
            id: "evt_".concat(Date.now()),
            dealId: dealId,
            type: 'deal_closed',
            actorId: store.user.id,
            actorName: store.user.displayName || 'Creator',
            actorRole: 'creator',
            description: "Deal \"".concat(deal.title, "\" closed by creator. Files entered a ").concat(retentionDays, "-day retention period."),
            createdAt: now,
        });
        var versions = store.fileVersions[dealId] || [];
        versions.forEach(function (v) {
            v.files.forEach(function (f) {
                f.deletionStatus = 'retention';
                f.retentionUntil = retentionUntil_1;
            });
        });
        saveStore(store, store.user.id);
    }
}
export function permanentlyDeleteDealInStore(dealId) {
    var store = currentStoreState;
    store.deals = store.deals.filter(function (d) { return d.id !== dealId; });
    delete store.messages[dealId];
    delete store.proposals[dealId];
    delete store.events[dealId];
    delete store.deliverables[dealId];
    delete store.fileVersions[dealId];
    delete store.payments[dealId];
    store.notifications = store.notifications.filter(function (n) { return n.dealId !== dealId; });
    saveStore(store, store.user.id);
}
