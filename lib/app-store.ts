'use client';

// ============================================================================
// DELT — Application Store (User-Isolated Real Reactive Store)
// ============================================================================

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import type {
  Deal,
  Client,
  DealMessage,
  PriceProposal,
  DealEvent,
  Deliverable,
  FileVersion,
  Payment,
  AppNotification,
  Transaction,
  StorageUsage,
  DealCredit,
  DealTemplate,
  Currency,
  DealStatus,
  PaymentState,
  PlanId,
} from '@/lib/types';

export type {
  Deal,
  Client,
  DealMessage,
  PriceProposal,
  DealEvent,
  Deliverable,
  FileVersion,
  Payment,
  AppNotification,
  Transaction,
  StorageUsage,
  DealCredit,
  DealTemplate,
  Currency,
  DealStatus,
  PaymentState,
  PlanId,
};

// ---------------------------------------------------------------------------
// Standard Blueprints / Templates
// ---------------------------------------------------------------------------
export const STANDARD_TEMPLATES: DealTemplate[] = [
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

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------
export interface AppStoreData {
  deals: Deal[];
  clients: Client[];
  messages: Record<string, DealMessage[]>;
  proposals: Record<string, PriceProposal[]>;
  events: Record<string, DealEvent[]>;
  deliverables: Record<string, Deliverable[]>;
  fileVersions: Record<string, FileVersion[]>;
  payments: Record<string, Payment[]>;
  notifications: AppNotification[];
  transactions: Transaction[];
  storage: StorageUsage;
  credits: DealCredit;
  user: {
    id: string;
    displayName: string;
    email: string;
    profession?: string;
    company?: string;
    bio?: string;
  };
  templates: DealTemplate[];
}

import { FREE_PLAN_DEAL_LIMIT, FREE_PLAN_STORAGE_BYTES } from '@/lib/plans';

export const INITIAL_STORE_STATE: AppStoreData = {
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

let activeUserId: string | null = null;
let currentStoreState: AppStoreData = { ...INITIAL_STORE_STATE };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

function getStorageKey(userId?: string | null): string {
  const uid = userId || activeUserId;
  return uid ? `delt_user_${uid}_data` : 'delt_guest_data';
}

export function loadStoreForUser(userId?: string | null): AppStoreData {
  if (typeof window === 'undefined') {
    return { ...INITIAL_STORE_STATE };
  }
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      currentStoreState = {
        ...INITIAL_STORE_STATE,
        ...parsed,
        templates: STANDARD_TEMPLATES,
      };
      return currentStoreState;
    }
  } catch (e) {
    console.error('Failed to load store from localStorage', e);
  }
  currentStoreState = { ...INITIAL_STORE_STATE };
  return currentStoreState;
}

export function saveStore(data: AppStoreData, userId?: string | null) {
  currentStoreState = data;
  if (typeof window !== 'undefined') {
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
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
        localStorage.removeItem(`delt_user_${activeUserId}_data`);
      }
      localStorage.removeItem('delt_guest_data');
      localStorage.removeItem('delt_app_data_v2');
    } catch (e) {
      console.error('Error clearing localStorage', e);
    }
  }
  activeUserId = null;
  currentStoreState = { ...INITIAL_STORE_STATE };
  notifyListeners();
}

/**
 * Sets active user and loads user-specific store.
 */
export function setStoreUser(user: { id: string; email: string; displayName: string }) {
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
export async function syncStoreFromSupabase(userId: string) {
  if (!hasSupabasePublicConfig() || !userId) return;

  const supabase = createClient();
  try {
    // 1. Fetch user deals
    const { data: dealsData } = await supabase
      .from('deals')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (dealsData) {
      currentStoreState.deals = dealsData.map((d: any) => ({
        id: d.id,
        token: d.token,
        creatorId: d.creator_id,
        clientId: d.client_id,
        clientName: d.client_name,
        clientEmail: d.client_email,
        title: d.title,
        description: d.description || '',
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
      }));
    }

    // 2. Fetch clients
    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (clientsData) {
      currentStoreState.clients = clientsData.map((c: any) => ({
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

    // 3. Fetch storage usage
    const { data: storageData } = await supabase
      .from('storage_usage')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

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

    // 4. Fetch credits
    const { data: creditsData } = await supabase
      .from('deal_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditsData) {
      currentStoreState.credits = {
        planId: creditsData.plan_id || 'free',
        total: Number(creditsData.total || FREE_PLAN_DEAL_LIMIT),
        used: currentStoreState.deals.length,
        remaining: Math.max(0, Number(creditsData.total || FREE_PLAN_DEAL_LIMIT) - currentStoreState.deals.length),
      };
    } else {
      currentStoreState.credits = {
        planId: 'free',
        total: FREE_PLAN_DEAL_LIMIT,
        used: currentStoreState.deals.length,
        remaining: Math.max(0, FREE_PLAN_DEAL_LIMIT - currentStoreState.deals.length),
      };
    }

    // 5. Fetch notifications
    const { data: notifsData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notifsData) {
      currentStoreState.notifications = notifsData.map((n: any) => ({
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

    // 6. Fetch transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('creator_id', userId)
      .order('date', { ascending: false });

    if (txData) {
      currentStoreState.transactions = txData.map((t: any) => ({
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
  } catch (err) {
    console.error('Error syncing store from Supabase', err);
  }
}

// ---------------------------------------------------------------------------
// React Hook (Deterministic Hydration)
// ---------------------------------------------------------------------------
export function useAppStore(): AppStoreData {
  // Always initialize state with INITIAL_STORE_STATE for SSR & initial client render determinism
  const [state, setState] = useState<AppStoreData>(INITIAL_STORE_STATE);

  useEffect(() => {
    // Load store on client mount
    const initialData = loadStoreForUser(activeUserId);
    setState({ ...initialData });

    const onChange = () => setState({ ...currentStoreState });
    listeners.add(onChange);

    // If Supabase is available, sync data
    if (hasSupabasePublicConfig()) {
      const supabase = createClient();
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

// ---------------------------------------------------------------------------
// Store Selectors & Actions
// ---------------------------------------------------------------------------
export function getDealById(id: string): Deal | undefined {
  return currentStoreState.deals.find((d) => d.id === id);
}

export function getDealByToken(token: string): Deal | undefined {
  return currentStoreState.deals.find((d) => d.token === token);
}

export function getClientById(id: string): Client | undefined {
  return currentStoreState.clients.find((c) => c.id === id);
}

export function getMessagesByDeal(dealId: string): DealMessage[] {
  return currentStoreState.messages[dealId] || [];
}

export function getProposalsByDeal(dealId: string): PriceProposal[] {
  return currentStoreState.proposals[dealId] || [];
}

export function getEventsByDeal(dealId: string): DealEvent[] {
  return currentStoreState.events[dealId] || [];
}

export function getDeliverablesByDeal(dealId: string): Deliverable[] {
  return currentStoreState.deliverables[dealId] || [];
}

export function getFileVersionsByDeal(dealId: string): FileVersion[] {
  return currentStoreState.fileVersions[dealId] || [];
}

export function getPaymentsByDeal(dealId: string): Payment[] {
  return currentStoreState.payments[dealId] || [];
}

export function getTemplateById(id: string): DealTemplate | undefined {
  return currentStoreState.templates.find((t) => t.id === id);
}

// ---------------------------------------------------------------------------
// Mutation Actions
// ---------------------------------------------------------------------------

export interface CreateDealInput {
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  title: string;
  description?: string;
  scope?: string[];
  price: number;
  currency?: string;
  deadline?: string;
  deliverables?: string[];
}

export function createDealInStore(input: CreateDealInput): Deal {
  const store = currentStoreState;
  const now = new Date().toISOString();
  const dealId = `dl_${Date.now()}`;
  const token = `dl_${Math.random().toString(36).slice(2, 14)}`;
  const currency: Currency = (input.currency as Currency) || 'INR';

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
  } else {
    client.dealCount += 1;
    client.totalValue += input.price;
    client.lastActivityAt = now;
  }

  const newDeal: Deal = {
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
  };

  store.deals.unshift(newDeal);

  // Initial event
  const createdEvent: DealEvent = {
    id: `ev_${Date.now()}_1`,
    dealId,
    type: 'deal_created',
    actorId: store.user.id,
    actorName: store.user.displayName,
    actorRole: 'creator',
    description: `Deal created for ${input.clientName} at ${input.price} ${currency}`,
    createdAt: now,
  };

  const sharedEvent: DealEvent = {
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
  const welcomeMsg: DealMessage = {
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
  const deliverablesList: Deliverable[] = (
    input.deliverables && input.deliverables.length > 0
      ? input.deliverables
      : ['Final Project Deliverables']
  ).map((delName, idx) => ({
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

export function addMessageToStore(
  dealId: string,
  input: {
    senderId: string;
    senderName: string;
    senderRole: 'creator' | 'client';
    type?: 'text' | 'system' | 'proposal' | 'file';
    content: string;
    proposalId?: string;
  }
): DealMessage {
  const store = currentStoreState;
  const now = new Date().toISOString();
  const msg: DealMessage = {
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

  if (!store.messages[dealId]) store.messages[dealId] = [];
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

export function addProposalToStore(
  dealId: string,
  proposedPrice: number,
  reason: string | undefined,
  proposedByRole: 'creator' | 'client',
  proposedByName: string
): PriceProposal {
  const store = currentStoreState;
  const now = new Date().toISOString();
  const deal = store.deals.find((d) => d.id === dealId);
  const prevPrice = deal ? deal.price : proposedPrice;

  const proposal: PriceProposal = {
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
  };

  if (!store.proposals[dealId]) store.proposals[dealId] = [];
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

export function respondToProposalInStore(
  dealId: string,
  proposalId: string,
  response: 'accept' | 'decline',
  responderName: string
) {
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

    if (!store.events[dealId]) store.events[dealId] = [];
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

export function simulatePaymentInStore(dealId: string, paymentMethod = 'Razorpay') {
  const store = currentStoreState;
  const now = new Date().toISOString();
  const deal = store.deals.find((d) => d.id === dealId);
  const client = deal ? store.clients.find((c) => c.id === deal.clientId) : undefined;
  const clientName = (deal as any)?.clientName || client?.name || 'Client';

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
    const tx: Transaction = {
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
    if (!store.events[dealId]) store.events[dealId] = [];
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

export function permanentlyDeleteDealInStore(dealId: string) {
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

