// ==============================================================================
// DELT — Deal Card Data Layer
//
// Pure, dependency-free mapping from the existing Deal model to the fields the
// Deal Card renders (web + email). No fetching, no new identifiers, no fake
// data: everything here comes from the deal record the caller already has.
// ==============================================================================

import { formatCurrency } from '@/lib/plans';
import type { Currency, Deal, DealStatus, Milestone } from '@/lib/types';

export interface DealCardData {
  /** Public deal locator — the existing deals.deal_code. Never a UUID/token. */
  dealCode: string;
  title: string;
  creatorName: string;
  clientName: string;
  /** Currency symbol (₹, $, €, £) — rendered on the same baseline as amount.
   *  Omitted when the price is intentionally unknown (priceKnown: false). */
  currencySymbol?: string;
  /** Amount formatted with the existing locale conventions (no symbol).
   *  Omitted when the price is intentionally unknown (priceKnown: false). */
  amountLabel?: string;
  status: DealStatus;
  /** First scope line or a trimmed description snippet; omitted when empty. */
  scopeSummary?: string;
  deliverablesCount?: number;
  /** 0–100, derived ONLY from existing milestones. Undefined when none exist. */
  progressPercent?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  createdAt?: string;
  deadline?: string;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const MAX_SUMMARY_LENGTH = 110;

/**
 * Map an existing deal (plus already-resolved display names and counts) to
 * Deal Card data. Names are passed in by the caller — the card never fetches.
 *
 * `priceKnown` exists for email contexts where a price was never provided:
 * passing `false` (or omitting `price` with `priceKnown: false`) intentionally
 * suppresses the Value cell instead of presenting a false ₹0. A real `price`
 * of 0 (a genuinely free deal) is still rendered as 0.
 */
export function buildDealCardData(params: {
  deal: Pick<
    Deal,
    'dealCode' | 'title' | 'price' | 'currency' | 'status' | 'createdAt' | 'deadline' | 'description' | 'scope'
  >;
  creatorName?: string;
  clientName?: string;
  deliverablesCount?: number;
  milestones?: Array<Pick<Milestone, 'status'>>;
  /** Set false when the price is genuinely unavailable in this context —
   *  the Value cell is then omitted rather than showing ₹0. */
  priceKnown?: boolean;
}): DealCardData {
  const { deal, creatorName, clientName, deliverablesCount, milestones, priceKnown = true } = params;

  const totalMilestones = milestones?.length ?? 0;
  const completedMilestones = totalMilestones
    ? milestones!.filter((m) => m.status === 'completed').length
    : 0;

  const summarySource = (deal.scope && deal.scope[0]) || deal.description || '';
  const scopeSummary = summarySource
    ? summarySource.length > MAX_SUMMARY_LENGTH
      ? `${summarySource.slice(0, MAX_SUMMARY_LENGTH - 1).trimEnd()}…`
      : summarySource
    : undefined;

  const currency = deal.currency || 'INR';

  // Item 7 data rule: an explicitly unknown price (priceKnown: false) omits
  // the amount entirely; a REAL price of 0 (genuinely free) still renders.
  const showAmount = priceKnown && typeof deal.price === 'number' && Number.isFinite(deal.price);

  return {
    dealCode: deal.dealCode || '',
    title: deal.title,
    creatorName: creatorName || 'Creator',
    clientName: clientName || 'Client',
    currencySymbol: showAmount ? CURRENCY_SYMBOLS[currency] || currency : undefined,
    // Locale formatting only — the symbol is rendered separately so the web
    // card can lock symbol and digits to one baseline.
    amountLabel: showAmount
      ? formatCurrency(deal.price, currency).replace(/^[^\d]+/, '')
      : undefined,
    status: deal.status,
    scopeSummary,
    deliverablesCount,
    // Progress exists only when milestones exist — never a fake number.
    progressPercent:
      totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : undefined,
    completedMilestones: totalMilestones > 0 ? completedMilestones : undefined,
    totalMilestones: totalMilestones > 0 ? totalMilestones : undefined,
    createdAt: deal.createdAt,
    deadline: deal.deadline,
  };
}

// ------------------------------------------------------------------------------
// Deterministic visual identity
// ------------------------------------------------------------------------------

/**
 * Barcode-like stripe widths derived deterministically from the deal code.
 * Same code → same pattern, always. Purely decorative — it encodes nothing
 * and must never be presented as a scannable barcode.
 */
export function dealCodeBars(dealCode: string, count = 30): number[] {
  const source = dealCode || 'DLT';
  let seed = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < source.length; i++) {
    seed ^= source.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // LCG step — stable across renders and environments.
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    bars.push(1 + (seed % 4)); // 1–4px stripe widths
  }
  return bars;
}

// ------------------------------------------------------------------------------
// Status presentation (labels mirror components/deal-status-badge.tsx)
// ------------------------------------------------------------------------------

export interface DealCardStatusMeta {
  label: string;
  /** Small semantic accent — used only for the status dot/underline. */
  accent: string;
}

export const DEAL_CARD_STATUS_META: Record<DealStatus, DealCardStatusMeta> = {
  draft: { label: 'Draft', accent: '#94A3B8' },
  sent: { label: 'Sent', accent: '#3B82F6' },
  viewed: { label: 'Viewed', accent: '#3B82F6' },
  negotiating: { label: 'Negotiating', accent: '#F59E0B' },
  agreed: { label: 'Agreed', accent: '#14B8A6' },
  in_progress: { label: 'In Progress', accent: '#6366F1' },
  payment_pending: { label: 'Payment Pending', accent: '#F59E0B' },
  paid: { label: 'Paid', accent: '#10B981' },
  delivered: { label: 'Delivered', accent: '#A855F7' },
  completed: { label: 'Completed', accent: '#10B981' },
  closed: { label: 'Closed', accent: '#94A3B8' },
  cancelled: { label: 'Cancelled', accent: '#EF4444' },
};

export function getDealCardStatusMeta(status: string): DealCardStatusMeta {
  return (
    DEAL_CARD_STATUS_META[status as DealStatus] ?? DEAL_CARD_STATUS_META.draft
  );
}

// ------------------------------------------------------------------------------
// Date formatting (shared by web + email footers)
// ------------------------------------------------------------------------------

export function formatCardDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatCardCurrency(amount: number, currency: Currency = 'INR'): string {
  return formatCurrency(amount, currency);
}
