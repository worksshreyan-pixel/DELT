import type { PlanConfig, PlanId } from './types';

// ============================================================================
// Plan & Entitlement Configuration
// Centralized so pricing/limits can change without rewriting UI components.
// ============================================================================

export const FREE_PLAN_DEAL_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PLAN_DEAL_LIMIT || 50);
export const FREE_PLAN_STORAGE_BYTES = Number(process.env.NEXT_PUBLIC_FREE_PLAN_STORAGE_BYTES || 5 * 1024 * 1024 * 1024); // 5 GB

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For trying out DELT with your clients',
    dealCredits: FREE_PLAN_DEAL_LIMIT,
    storageBytes: FREE_PLAN_STORAGE_BYTES,
    features: [
      `${FREE_PLAN_DEAL_LIMIT} Deal credits`,
      `${formatBytes(FREE_PLAN_STORAGE_BYTES)} storage`,
      'Private deal workspace',
      'Chat & negotiation',
      'Client portal link',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For freelancers managing a few active clients',
    dealCredits: 10,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    features: [
      '10 Deal credits',
      '10 GB storage',
      'Private deal workspace',
      'Chat & negotiation',
      'Client portal link',
      'File versioning',
      'Activity timeline',
    ],
    price: 499,
    currency: 'INR',
  },
  creator: {
    id: 'creator',
    name: 'Pro',
    description: 'For active creators managing multiple projects',
    dealCredits: 50,
    storageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
    features: [
      '50 Deal credits',
      '50 GB storage',
      'Everything in Starter',
      'Deal templates',
      'Milestone tracking',
      'Change requests',
      'Priority support',
    ],
    highlighted: true,
    price: 1499,
    currency: 'INR',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For agencies and high-volume professionals',
    dealCredits: 100,
    storageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    features: [
      '100 Deal credits',
      '100 GB storage',
      'Everything in Creator',
      'Advanced analytics',
      'Custom branding on deals',
      'Dedicated support',
      'Team seats (coming soon)',
    ],
    price: 3999,
    currency: 'INR',
  },
};

export const PLAN_LIST = Object.values(PLANS);

// Current demo plan — would come from subscription record in production
export const CURRENT_PLAN: PlanId = 'creator';

// Storage upgrade tiers (separate from plan)
export const STORAGE_ADDONS = [
  { id: 'storage-10gb', label: '10 GB', bytes: 10 * 1024 ** 3, price: 199 },
  { id: 'storage-50gb', label: '50 GB', bytes: 50 * 1024 ** 3, price: 799 },
  { id: 'storage-100gb', label: '100 GB', bytes: 100 * 1024 ** 3, price: 1499 },
];

// Transaction fee configuration (configurable)
export const TRANSACTION_FEES = {
  platformFeePercent: 2.5, // DELT fee
  processingFeePercent: 2.0, // payment gateway fee
  platformFeeMin: 10,
  processingFeeMin: 5,
};

export function getPlan(planId: PlanId): PlanConfig {
  return PLANS[planId];
}

export function formatCurrency(amount: number, currency: 'INR' | 'USD' | 'EUR' | 'GBP' = 'INR'): string {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency] || currency;
  if (currency === 'INR') {
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  }
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatPriceForPlan(plan: PlanConfig): string {
  if (!plan.price) return 'Free';
  return formatCurrency(plan.price, plan.currency || 'INR');
}
