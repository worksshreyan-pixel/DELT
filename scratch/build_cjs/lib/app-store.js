"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.permanentlyDeleteDealInStore = exports.closeDealInStore = exports.simulatePaymentInStore = exports.respondToProposalInStore = exports.addProposalToStore = exports.addMessageToStore = exports.createDealInStore = exports.getTemplateById = exports.getPaymentsByDeal = exports.getFileVersionsByDeal = exports.getDeliverablesByDeal = exports.getEventsByDeal = exports.getProposalsByDeal = exports.getMessagesByDeal = exports.getClientById = exports.getDealByToken = exports.getDealById = exports.useAppStore = exports.syncStoreFromSupabase = exports.setStoreUser = exports.clearStoreState = exports.saveStore = exports.loadStoreForUser = exports.INITIAL_STORE_STATE = exports.STANDARD_TEMPLATES = void 0;
// ============================================================================
// DELT — Application Store (User-Isolated Real Reactive Store)
// ============================================================================
const react_1 = require("react");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
const utils_1 = require("@/lib/utils");
// ---------------------------------------------------------------------------
// Standard Blueprints / Templates
// ---------------------------------------------------------------------------
exports.STANDARD_TEMPLATES = [
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
const plans_1 = require("@/lib/plans");
exports.INITIAL_STORE_STATE = {
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
        limitBytes: plans_1.FREE_PLAN_STORAGE_BYTES,
        breakdown: {
            files: 0,
            versions: 0,
            attachments: 0,
        },
    },
    credits: {
        planId: 'free',
        total: plans_1.FREE_PLAN_DEAL_LIMIT,
        used: 0,
        remaining: plans_1.FREE_PLAN_DEAL_LIMIT,
    },
    user: {
        id: '',
        displayName: 'Your Account',
        email: '',
        profession: 'Digital Creator',
    },
    templates: exports.STANDARD_TEMPLATES,
};
let activeUserId = null;
let currentStoreState = { ...exports.INITIAL_STORE_STATE };
const listeners = new Set();
function notifyListeners() {
    listeners.forEach((listener) => {
        try {
            listener();
        }
        catch (e) {
            console.error(e);
        }
    });
}
function getStorageKey(userId) {
    const uid = userId || activeUserId;
    return uid ? `delt_user_${uid}_data` : 'delt_guest_data';
}
function loadStoreForUser(userId) {
    if (typeof window === 'undefined') {
        return { ...exports.INITIAL_STORE_STATE };
    }
    const key = getStorageKey(userId);
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw);
            currentStoreState = {
                ...exports.INITIAL_STORE_STATE,
                ...parsed,
                templates: exports.STANDARD_TEMPLATES,
            };
            return currentStoreState;
        }
    }
    catch (e) {
        console.error('Failed to load store from localStorage', e);
    }
    currentStoreState = { ...exports.INITIAL_STORE_STATE };
    return currentStoreState;
}
exports.loadStoreForUser = loadStoreForUser;
function saveStore(data, userId) {
    currentStoreState = data;
    if (typeof window !== 'undefined') {
        try {
            const key = getStorageKey(userId);
            localStorage.setItem(key, JSON.stringify(data));
        }
        catch (e) {
            console.error('Failed to persist store', e);
        }
    }
    notifyListeners();
}
exports.saveStore = saveStore;
/**
 * Completely resets store state and clears user cache (e.g. on logout).
 */
function clearStoreState() {
    if (typeof window !== 'undefined') {
        try {
            if (activeUserId) {
                localStorage.removeItem(`delt_user_${activeUserId}_data`);
            }
            localStorage.removeItem('delt_guest_data');
            localStorage.removeItem('delt_app_data_v2');
        }
        catch (e) {
            console.error('Error clearing localStorage', e);
        }
    }
    activeUserId = null;
    currentStoreState = { ...exports.INITIAL_STORE_STATE };
    notifyListeners();
}
exports.clearStoreState = clearStoreState;
/**
 * Sets active user and loads user-specific store.
 */
function setStoreUser(user) {
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
exports.setStoreUser = setStoreUser;
/**
 * Asynchronously synchronizes store state with real Supabase records.
 */
let isSyncing = false;
let lastSyncedAt = 0;
const SYNC_COOLDOWN_MS = 5000;
async function syncStoreFromSupabase(userId, force = false) {
    if (!(0, env_1.hasSupabasePublicConfig)() || !userId)
        return;
    const now = Date.now();
    if (!force && (isSyncing || (now - lastSyncedAt < SYNC_COOLDOWN_MS))) {
        return;
    }
    isSyncing = true;
    const supabase = (0, client_1.createClient)();
    try {
        const [dealsRes, clientsRes, storageRes, creditsRes, notifsRes, txRes] = await Promise.all([
            supabase.from('deals').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
            supabase.from('clients').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
            supabase.from('storage_usage').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('deal_credits').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('transactions').select('*').eq('creator_id', userId).order('date', { ascending: false })
        ]);
        const dealsData = dealsRes.data;
        const clientsData = clientsRes.data;
        const storageData = storageRes.data;
        const creditsData = creditsRes.data;
        const notifsData = notifsRes.data;
        const txData = txRes.data;
        if (dealsData) {
            currentStoreState.deals = dealsData.map((d) => ({
                id: d.id,
                token: d.token,
                creatorId: d.creator_id,
                clientId: d.client_id,
                clientName: d.client_name,
                clientEmail: d.client_email,
                title: d.title,
                description: (0, utils_1.parseDescription)(d.description).description,
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
                previewEnabled: (0, utils_1.parseDescription)(d.description).previewEnabled,
            }));
        }
        if (clientsData) {
            currentStoreState.clients = clientsData.map((c) => ({
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
            }));
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
                total: Number(creditsData.total || plans_1.FREE_PLAN_DEAL_LIMIT),
                used: currentStoreState.deals.length,
                remaining: Math.max(0, Number(creditsData.total || plans_1.FREE_PLAN_DEAL_LIMIT) - currentStoreState.deals.length),
            };
        }
        else {
            currentStoreState.credits = {
                planId: 'free',
                total: plans_1.FREE_PLAN_DEAL_LIMIT,
                used: currentStoreState.deals.length,
                remaining: Math.max(0, plans_1.FREE_PLAN_DEAL_LIMIT - currentStoreState.deals.length),
            };
        }
        if (notifsData) {
            currentStoreState.notifications = notifsData.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                description: n.description,
                dealId: n.deal_id,
                dealTitle: n.deal_title,
                read: Boolean(n.read),
                createdAt: n.created_at,
            }));
        }
        if (txData) {
            currentStoreState.transactions = txData.map((t) => ({
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
            }));
        }
        saveStore(currentStoreState, userId);
    }
    catch (err) {
        console.error('Error syncing store from Supabase', err);
    }
    finally {
        isSyncing = false;
        lastSyncedAt = Date.now();
    }
}
exports.syncStoreFromSupabase = syncStoreFromSupabase;
// ---------------------------------------------------------------------------
// React Hook (Deterministic Hydration)
// ---------------------------------------------------------------------------
function useAppStore() {
    // Always initialize state with INITIAL_STORE_STATE for SSR & initial client render determinism
    const [state, setState] = (0, react_1.useState)(exports.INITIAL_STORE_STATE);
    (0, react_1.useEffect)(() => {
        // Load store on client mount
        const initialData = loadStoreForUser(activeUserId);
        setState({ ...initialData });
        const onChange = () => setState({ ...currentStoreState });
        listeners.add(onChange);
        // If Supabase is available, sync data
        if ((0, env_1.hasSupabasePublicConfig)()) {
            const supabase = (0, client_1.createClient)();
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    setStoreUser({
                        id: user.id,
                        email: user.email || '',
                        displayName: user.user_metadata?.displayName || user.email?.split('@')[0] || 'Creator',
                    });
                    syncStoreFromSupabase(user.id);
                }
            });
        }
        return () => {
            listeners.delete(onChange);
        };
    }, []);
    return state;
}
exports.useAppStore = useAppStore;
// ---------------------------------------------------------------------------
// Store Selectors & Actions
// ---------------------------------------------------------------------------
function getDealById(id) {
    return currentStoreState.deals.find((d) => d.id === id);
}
exports.getDealById = getDealById;
function getDealByToken(token) {
    return currentStoreState.deals.find((d) => d.token === token);
}
exports.getDealByToken = getDealByToken;
function getClientById(id) {
    return currentStoreState.clients.find((c) => c.id === id);
}
exports.getClientById = getClientById;
function getMessagesByDeal(dealId) {
    return currentStoreState.messages[dealId] || [];
}
exports.getMessagesByDeal = getMessagesByDeal;
function getProposalsByDeal(dealId) {
    return currentStoreState.proposals[dealId] || [];
}
exports.getProposalsByDeal = getProposalsByDeal;
function getEventsByDeal(dealId) {
    return currentStoreState.events[dealId] || [];
}
exports.getEventsByDeal = getEventsByDeal;
function getDeliverablesByDeal(dealId) {
    return currentStoreState.deliverables[dealId] || [];
}
exports.getDeliverablesByDeal = getDeliverablesByDeal;
function getFileVersionsByDeal(dealId) {
    return currentStoreState.fileVersions[dealId] || [];
}
exports.getFileVersionsByDeal = getFileVersionsByDeal;
function getPaymentsByDeal(dealId) {
    return currentStoreState.payments[dealId] || [];
}
exports.getPaymentsByDeal = getPaymentsByDeal;
function getTemplateById(id) {
    return currentStoreState.templates.find((t) => t.id === id);
}
exports.getTemplateById = getTemplateById;
function createDealInStore(input) {
    const store = currentStoreState;
    const now = new Date().toISOString();
    const dealId = `dl_${Date.now()}`;
    const token = `dl_${Math.random().toString(36).slice(2, 14)}`;
    const currency = input.currency || 'INR';
    // Find or create client
    let client = store.clients.find((c) => c.email.toLowerCase() === input.clientEmail.toLowerCase());
    if (!client) {
        client = {
            id: `cl_${Date.now()}`,
            creatorId: store.user.id,
            name: input.clientName,
            email: input.clientEmail,
            company: input.clientCompany,
            dealCount: 1,
            totalValue: input.price,
            currency,
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
    const newDeal = {
        id: dealId,
        token,
        creatorId: store.user.id,
        clientId: client.id,
        title: input.title,
        description: input.description || '',
        scope: input.scope && input.scope.length > 0 ? input.scope : ['Project requirements'],
        price: input.price,
        currency,
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
    const createdEvent = {
        id: `ev_${Date.now()}_1`,
        dealId,
        type: 'deal_created',
        actorId: store.user.id,
        actorName: store.user.displayName,
        actorRole: 'creator',
        description: `Deal created for ${input.clientName} at ${input.price} ${currency}`,
        createdAt: now,
    };
    const sharedEvent = {
        id: `ev_${Date.now()}_2`,
        dealId,
        type: 'deal_shared',
        actorId: store.user.id,
        actorName: store.user.displayName,
        actorRole: 'creator',
        description: `Private link generated for ${input.clientEmail}`,
        createdAt: now,
    };
    store.events[dealId] = [sharedEvent, createdEvent];
    // Initial greeting message
    const welcomeMsg = {
        id: `msg_${Date.now()}`,
        dealId,
        senderId: store.user.id,
        senderName: store.user.displayName,
        senderRole: 'creator',
        type: 'text',
        content: `Welcome to the Deal workspace! I have prepared the scope and deliverables for "${input.title}". Feel free to chat, propose adjustments, or review progress right here.`,
        createdAt: now,
    };
    store.messages[dealId] = [welcomeMsg];
    store.proposals[dealId] = [];
    // Deliverables
    const deliverablesList = (input.deliverables && input.deliverables.length > 0
        ? input.deliverables
        : ['Final Project Deliverables']).map((delName, idx) => ({
        id: `del_${Date.now()}_${idx}`,
        dealId,
        name: delName,
        status: 'pending',
        createdAt: now,
    }));
    store.deliverables[dealId] = deliverablesList;
    store.fileVersions[dealId] = [];
    store.payments[dealId] = [];
    // Deduct/track credit
    store.credits.used = store.deals.length;
    store.credits.remaining = Math.max(0, store.credits.total - store.credits.used);
    saveStore(store, store.user.id);
    return newDeal;
}
exports.createDealInStore = createDealInStore;
function addMessageToStore(dealId, input) {
    const store = currentStoreState;
    const now = new Date().toISOString();
    const msg = {
        id: `msg_${Date.now()}`,
        dealId,
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
    const deal = store.deals.find((d) => d.id === dealId);
    if (deal) {
        deal.lastActivityAt = now;
        deal.updatedAt = now;
    }
    saveStore(store, store.user.id);
    return msg;
}
exports.addMessageToStore = addMessageToStore;
function addProposalToStore(dealId, proposedPrice, reason, proposedByRole, proposedByName, parentProposalId) {
    const store = currentStoreState;
    const now = new Date().toISOString();
    const deal = store.deals.find((d) => d.id === dealId);
    let prevPrice = deal ? deal.price : proposedPrice;
    if (parentProposalId) {
        const parent = (store.proposals[dealId] || []).find((p) => p.id === parentProposalId);
        if (parent) {
            prevPrice = parent.proposedPrice;
        }
    }
    const proposal = {
        id: `prop_${Date.now()}`,
        dealId,
        direction: proposedByRole === 'creator' ? 'creator_to_client' : 'client_to_creator',
        previousPrice: prevPrice,
        proposedPrice,
        reason,
        state: 'pending',
        proposedBy: proposedByRole,
        proposedByName,
        proposedByRole,
        createdAt: now,
        counterProposalId: parentProposalId || undefined,
    };
    if (parentProposalId) {
        const parent = (store.proposals[dealId] || []).find((p) => p.id === parentProposalId);
        if (parent) {
            parent.state = 'countered';
            parent.resolvedAt = now;
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
        content: `${proposedByName} proposed price change to ${proposedPrice}`,
        proposalId: proposal.id,
    });
    saveStore(store, store.user.id);
    return proposal;
}
exports.addProposalToStore = addProposalToStore;
function respondToProposalInStore(dealId, proposalId, response, responderName) {
    const store = currentStoreState;
    const now = new Date().toISOString();
    const proposal = (store.proposals[dealId] || []).find((p) => p.id === proposalId);
    const deal = store.deals.find((d) => d.id === dealId);
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
            id: `ev_${Date.now()}`,
            dealId,
            type: 'price_accepted',
            actorName: responderName,
            actorRole: 'creator',
            description: `Price proposal of ${proposal.proposedPrice} ${deal.currency} accepted.`,
            createdAt: now,
        });
    }
    saveStore(store, store.user.id);
}
exports.respondToProposalInStore = respondToProposalInStore;
function simulatePaymentInStore(dealId, paymentMethod = 'Razorpay') {
    const store = currentStoreState;
    const now = new Date().toISOString();
    const deal = store.deals.find((d) => d.id === dealId);
    const client = deal ? store.clients.find((c) => c.id === deal.clientId) : undefined;
    const clientName = deal?.clientName || client?.name || 'Client';
    if (deal) {
        deal.paymentStatus = 'paid';
        deal.status = 'completed';
        deal.progress = 100;
        deal.lastActivityAt = now;
        deal.updatedAt = now;
        // Unlock files
        const versions = store.fileVersions[dealId] || [];
        versions.forEach((v) => {
            v.locked = false;
            v.status = 'approved';
        });
        // Create transaction
        const txId = `TXN-${Date.now().toString().slice(-6)}`;
        const tx = {
            id: txId,
            paymentId: `pay_${Date.now()}`,
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
            id: `ev_${Date.now()}`,
            dealId,
            type: 'payment_completed',
            actorName: clientName,
            actorRole: 'client',
            description: `Payment of ${deal.price} ${deal.currency} verified via ${paymentMethod}. Files unlocked.`,
            createdAt: now,
        });
        // System message
        addMessageToStore(dealId, {
            senderId: 'system',
            senderName: 'DELT System',
            senderRole: 'creator',
            type: 'system',
            content: `Payment of ${deal.price} ${deal.currency} confirmed! All deliverable files have been unlocked for download.`,
        });
        // Notification
        store.notifications.unshift({
            id: `notif_${Date.now()}`,
            type: 'payment_received',
            title: 'Payment Received',
            description: `Received ${deal.price} ${deal.currency} for "${deal.title}"`,
            dealId: deal.id,
            dealTitle: deal.title,
            read: false,
            createdAt: now,
        });
        saveStore(store, store.user.id);
    }
}
exports.simulatePaymentInStore = simulatePaymentInStore;
function closeDealInStore(dealId) {
    const store = currentStoreState;
    const deal = store.deals.find((d) => d.id === dealId);
    if (deal) {
        const now = new Date().toISOString();
        deal.status = 'closed';
        deal.updatedAt = now;
        if (!store.events[dealId]) {
            store.events[dealId] = [];
        }
        const retentionDays = 30;
        const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
        store.events[dealId].push({
            id: `evt_${Date.now()}`,
            dealId,
            type: 'deal_closed',
            actorId: store.user.id,
            actorName: store.user.displayName || 'Creator',
            actorRole: 'creator',
            description: `Deal "${deal.title}" closed by creator. Files entered a ${retentionDays}-day retention period.`,
            createdAt: now,
        });
        const versions = store.fileVersions[dealId] || [];
        versions.forEach((v) => {
            v.files.forEach((f) => {
                f.deletionStatus = 'retention';
                f.retentionUntil = retentionUntil;
            });
        });
        saveStore(store, store.user.id);
    }
}
exports.closeDealInStore = closeDealInStore;
function permanentlyDeleteDealInStore(dealId) {
    const store = currentStoreState;
    store.deals = store.deals.filter((d) => d.id !== dealId);
    delete store.messages[dealId];
    delete store.proposals[dealId];
    delete store.events[dealId];
    delete store.deliverables[dealId];
    delete store.fileVersions[dealId];
    delete store.payments[dealId];
    store.notifications = store.notifications.filter((n) => n.dealId !== dealId);
    saveStore(store, store.user.id);
}
exports.permanentlyDeleteDealInStore = permanentlyDeleteDealInStore;
