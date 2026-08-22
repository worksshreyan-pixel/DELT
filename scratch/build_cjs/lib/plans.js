"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPriceForPlan = exports.formatBytes = exports.formatCurrency = exports.getPlan = exports.TRANSACTION_FEES = exports.STORAGE_ADDONS = exports.CURRENT_PLAN = exports.PLAN_LIST = exports.PLANS = exports.FREE_PLAN_STORAGE_BYTES = exports.FREE_PLAN_DEAL_LIMIT = void 0;
// ============================================================================
// Plan & Entitlement Configuration
// Centralized so pricing/limits can change without rewriting UI components.
// ============================================================================
exports.FREE_PLAN_DEAL_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PLAN_DEAL_LIMIT || 50);
exports.FREE_PLAN_STORAGE_BYTES = Number(process.env.NEXT_PUBLIC_FREE_PLAN_STORAGE_BYTES || 5 * 1024 * 1024 * 1024); // 5 GB
exports.PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'For trying out DELT with your clients',
        dealCredits: exports.FREE_PLAN_DEAL_LIMIT,
        storageBytes: exports.FREE_PLAN_STORAGE_BYTES,
        features: [
            `${exports.FREE_PLAN_DEAL_LIMIT} Deal credits`,
            `${formatBytes(exports.FREE_PLAN_STORAGE_BYTES)} storage`,
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
        storageBytes: 10 * 1024 * 1024 * 1024,
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
        storageBytes: 50 * 1024 * 1024 * 1024,
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
        storageBytes: 100 * 1024 * 1024 * 1024,
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
exports.PLAN_LIST = Object.values(exports.PLANS);
// Current demo plan — would come from subscription record in production
exports.CURRENT_PLAN = 'creator';
// Storage upgrade tiers (separate from plan)
exports.STORAGE_ADDONS = [
    { id: 'storage-10gb', label: '10 GB', bytes: 10 * 1024 ** 3, price: 199 },
    { id: 'storage-50gb', label: '50 GB', bytes: 50 * 1024 ** 3, price: 799 },
    { id: 'storage-100gb', label: '100 GB', bytes: 100 * 1024 ** 3, price: 1499 },
];
// Transaction fee configuration (configurable)
exports.TRANSACTION_FEES = {
    platformFeePercent: 2.5,
    processingFeePercent: 2.0,
    platformFeeMin: 10,
    processingFeeMin: 5,
};
function getPlan(planId) {
    return exports.PLANS[planId];
}
exports.getPlan = getPlan;
function formatCurrency(amount, currency = 'INR') {
    const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbols[currency] || currency;
    if (currency === 'INR') {
        return `${symbol}${amount.toLocaleString('en-IN')}`;
    }
    return `${symbol}${amount.toLocaleString('en-US')}`;
}
exports.formatCurrency = formatCurrency;
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
exports.formatBytes = formatBytes;
function formatPriceForPlan(plan) {
    if (!plan.price)
        return 'Free';
    return formatCurrency(plan.price, plan.currency || 'INR');
}
exports.formatPriceForPlan = formatPriceForPlan;
