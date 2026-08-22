// ============================================================================
// Plan & Entitlement Configuration
// Centralized so pricing/limits can change without rewriting UI components.
// ============================================================================
export var FREE_PLAN_DEAL_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_PLAN_DEAL_LIMIT || 50);
export var FREE_PLAN_STORAGE_BYTES = Number(process.env.NEXT_PUBLIC_FREE_PLAN_STORAGE_BYTES || 5 * 1024 * 1024 * 1024); // 5 GB
export var PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        description: 'For trying out DELT with your clients',
        dealCredits: FREE_PLAN_DEAL_LIMIT,
        storageBytes: FREE_PLAN_STORAGE_BYTES,
        features: [
            "".concat(FREE_PLAN_DEAL_LIMIT, " Deal credits"),
            "".concat(formatBytes(FREE_PLAN_STORAGE_BYTES), " storage"),
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
export var PLAN_LIST = Object.values(PLANS);
// Current demo plan — would come from subscription record in production
export var CURRENT_PLAN = 'creator';
// Storage upgrade tiers (separate from plan)
export var STORAGE_ADDONS = [
    { id: 'storage-10gb', label: '10 GB', bytes: 10 * Math.pow(1024, 3), price: 199 },
    { id: 'storage-50gb', label: '50 GB', bytes: 50 * Math.pow(1024, 3), price: 799 },
    { id: 'storage-100gb', label: '100 GB', bytes: 100 * Math.pow(1024, 3), price: 1499 },
];
// Transaction fee configuration (configurable)
export var TRANSACTION_FEES = {
    platformFeePercent: 2.5,
    processingFeePercent: 2.0,
    platformFeeMin: 10,
    processingFeeMin: 5,
};
export function getPlan(planId) {
    return PLANS[planId];
}
export function formatCurrency(amount, currency) {
    if (currency === void 0) { currency = 'INR'; }
    var symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
    var symbol = symbols[currency] || currency;
    if (currency === 'INR') {
        return "".concat(symbol).concat(amount.toLocaleString('en-IN'));
    }
    return "".concat(symbol).concat(amount.toLocaleString('en-US'));
}
export function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(1)), " ").concat(sizes[i]);
}
export function formatPriceForPlan(plan) {
    if (!plan.price)
        return 'Free';
    return formatCurrency(plan.price, plan.currency || 'INR');
}
