import { cn } from '@/lib/utils';
var statusConfig = {
    draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
    sent: { label: 'Sent', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300', dot: 'bg-blue-500' },
    viewed: { label: 'Viewed', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300', dot: 'bg-blue-500' },
    negotiating: { label: 'Negotiating', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', dot: 'bg-amber-500' },
    agreed: { label: 'Agreed', className: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300', dot: 'bg-teal-500' },
    in_progress: { label: 'In Progress', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300', dot: 'bg-indigo-500' },
    payment_pending: { label: 'Payment Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300', dot: 'bg-amber-500' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', dot: 'bg-emerald-500' },
    delivered: { label: 'Delivered', className: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300', dot: 'bg-purple-500' },
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', dot: 'bg-emerald-500' },
    closed: { label: 'Closed', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300', dot: 'bg-zinc-500' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300', dot: 'bg-red-500' },
};
export function DealStatusBadge(_a) {
    var status = _a.status, className = _a.className;
    var config = statusConfig[status];
    return (<span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', config.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)}/>
      {config.label}
    </span>);
}
var paymentConfig = {
    none: { label: 'No Payment', className: 'bg-muted text-muted-foreground' },
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    processing: { label: 'Processing', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    failed: { label: 'Failed', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
    refunded: { label: 'Refunded', className: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
    disputed: { label: 'Disputed', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
};
export function PaymentStatusBadge(_a) {
    var status = _a.status, className = _a.className;
    var config = paymentConfig[status];
    return (<span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>);
}
var proposalConfig = {
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    countered: { label: 'Countered', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    declined: { label: 'Declined', className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
    cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
    expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};
export function ProposalStatusBadge(_a) {
    var status = _a.status, className = _a.className;
    var config = proposalConfig[status];
    return (<span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>);
}
var deliverableConfig = {
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'In Progress', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    uploaded: { label: 'Uploaded', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    changes_requested: { label: 'Changes Requested', className: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
};
export function DeliverableStatusBadge(_a) {
    var status = _a.status, className = _a.className;
    var config = deliverableConfig[status];
    return (<span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>);
}
var milestoneConfig = {
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'In Progress', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    paid: { label: 'Paid', className: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
};
export function MilestoneStatusBadge(_a) {
    var status = _a.status, className = _a.className;
    var config = milestoneConfig[status];
    return (<span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>);
}
