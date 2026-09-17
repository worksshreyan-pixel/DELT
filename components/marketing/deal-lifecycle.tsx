'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, FileCheck, MessageSquare, CreditCard, ArrowLeftRight, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/plans';
import { DealStatusBadge } from '@/components/deal-status-badge';
import type { DealStatus } from '@/lib/types';

// ─── Stage definitions ────────────────────────────────────────────────────────

type StageId = 'scope' | 'agreed' | 'progress' | 'review' | 'approved' | 'paid' | 'complete';

interface Stage {
  id: StageId;
  label: string;
  status: DealStatus;
  icon: React.ElementType;
  shortDesc: string;
}

const STAGES: Stage[] = [
  { id: 'scope',    label: 'Scope',      status: 'sent',         icon: MessageSquare,    shortDesc: 'Deal created & sent to client' },
  { id: 'agreed',   label: 'Agreed',     status: 'agreed',       icon: ArrowLeftRight,   shortDesc: 'Terms negotiated & accepted' },
  { id: 'progress', label: 'In Progress',status: 'in_progress',  icon: Clock,            shortDesc: 'Work underway' },
  { id: 'review',   label: 'Review',     status: 'delivered',    icon: FileCheck,        shortDesc: 'Deliverables uploaded, awaiting review' },
  { id: 'approved', label: 'Approved',   status: 'paid',         icon: CheckCircle2,     shortDesc: 'Client approved the work' },
  { id: 'paid',     label: 'Paid',       status: 'paid',         icon: CreditCard,       shortDesc: 'Payment confirmed' },
  { id: 'complete', label: 'Complete',   status: 'completed',    icon: CheckCircle2,     shortDesc: 'Deal closed with full audit trail' },
];

// ─── Stage content panels ─────────────────────────────────────────────────────

function ScopePanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">New Deal</p>
          <h4 className="font-display font-semibold text-base mt-0.5">Brand Identity Package</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Priya Nair · Nova Studios</p>
        </div>
        <DealStatusBadge status="sent" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/60 p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Price</p>
          <p className="text-sm font-semibold mt-0.5">{formatCurrency(45000)}</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Deadline</p>
          <p className="text-sm font-semibold mt-0.5">30 days</p>
        </div>
      </div>
      <div className="rounded-lg border border-border p-2.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Scope: </span>
        Logo, brand guidelines, and 3 identity applications.
      </div>
    </div>
  );
}

function AgreedPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Negotiation</p>
        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          Accepted
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-muted/50 px-2.5 py-1.5">
          <p className="text-[10px] text-muted-foreground">Original</p>
          <p className="text-sm font-semibold line-through text-muted-foreground">{formatCurrency(45000)}</p>
        </div>
        <div className="text-muted-foreground/60 text-xs">→</div>
        <div className="flex-1 rounded-lg bg-primary/5 px-2.5 py-1.5">
          <p className="text-[10px] text-muted-foreground">Agreed</p>
          <p className="text-sm font-semibold text-primary">{formatCurrency(40000)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 px-2.5 py-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Final price locked at {formatCurrency(40000)}
        </span>
      </div>
    </div>
  );
}

function ProgressPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Deliverables</p>
        <DealStatusBadge status="in_progress" />
      </div>
      {[
        { name: 'Logo concepts (v1)', state: 'uploaded', color: 'text-blue-600 dark:text-blue-400' },
        { name: 'Brand guidelines draft', state: 'in review', color: 'text-amber-600 dark:text-amber-400' },
        { name: 'Identity applications', state: 'pending', color: 'text-muted-foreground' },
      ].map((item) => (
        <div key={item.name} className="flex items-center justify-between rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{item.name}</span>
          </div>
          <span className={cn('text-[10px] font-medium', item.color)}>{item.state}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Client review</p>
        <span className="rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
          Pending
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card p-2.5">
        <p className="text-[10px] text-muted-foreground mb-1">Brand guidelines draft · v2</p>
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Secured · Download unlocks on payment</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-2 text-center">
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Approve</p>
        </div>
        <div className="flex-1 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-center">
          <p className="text-[10px] font-medium text-muted-foreground">Request changes</p>
        </div>
      </div>
    </div>
  );
}

function ApprovedPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Approval</p>
        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          Approved
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">All deliverables approved</p>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">by Priya Nair · just now</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Files will unlock for download once payment is confirmed.
      </p>
    </div>
  );
}

function PaidPanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Payment</p>
        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          Confirmed
        </span>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="text-sm font-semibold">{formatCurrency(40000)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">DELT fee (2.5%)</span>
          <span className="text-xs text-muted-foreground">−{formatCurrency(1000)}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">You receive</span>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(39000)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        Files unlocked for download
      </div>
    </div>
  );
}

function CompletePanel() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Deal complete</p>
        <DealStatusBadge status="completed" />
      </div>
      <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Audit trail</p>
        {[
          { label: 'Deal created', ts: '12 days ago' },
          { label: 'Terms agreed', ts: '11 days ago' },
          { label: 'Files delivered', ts: '3 days ago' },
          { label: 'Work approved', ts: '1 day ago' },
          { label: 'Payment confirmed', ts: 'Today' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">{item.ts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE_PANELS: Record<StageId, React.ReactNode> = {
  scope: <ScopePanel />,
  agreed: <AgreedPanel />,
  progress: <ProgressPanel />,
  review: <ReviewPanel />,
  approved: <ApprovedPanel />,
  paid: <PaidPanel />,
  complete: <CompletePanel />,
};

// ─── Auto-advance interval ───────────────────────────────────────────────────

const AUTO_ADVANCE_MS = 3200;

// ─── Main component ───────────────────────────────────────────────────────────

export function DealLifecycleViz() {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const advance = useCallback(() => {
    setActiveIndex((i) => (i + 1) % STAGES.length);
  }, []);

  // Auto-advance through stages
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const id = setInterval(advance, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [isPaused, prefersReducedMotion, advance]);

  const activeStage = STAGES[activeIndex];

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-black/5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          delt.app/deals/brand-identity
        </div>
      </div>

      {/* Stage timeline */}
      <div className="border-b border-border bg-muted/20 px-4 py-3 overflow-x-auto">
        <div className="flex items-center min-w-max gap-0">
          {STAGES.map((stage, i) => {
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="flex items-center">
                <button
                  onClick={() => { setActiveIndex(i); setIsPaused(true); }}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg transition-colors relative',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  aria-pressed={isActive}
                  aria-label={`View ${stage.label} stage`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="stage-pill"
                      className="absolute inset-0 rounded-lg bg-background border border-border shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <div className={cn(
                    'relative z-10 flex h-6 w-6 items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' :
                    isPast ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {isPast ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </div>
                  <span className={cn(
                    'relative z-10 text-[10px] font-medium whitespace-nowrap leading-none',
                    isActive ? 'text-foreground' : isPast ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  )}>
                    {stage.label}
                  </span>
                </button>
                {i < STAGES.length - 1 && (
                  <div className={cn(
                    'h-px w-6 transition-colors duration-500',
                    i < activeIndex ? 'bg-emerald-400' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage content */}
      <div className="p-4 min-h-[200px] sm:min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {STAGE_PANELS[activeStage.id]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      {!prefersReducedMotion && !isPaused && (
        <div className="h-0.5 bg-muted relative overflow-hidden">
          <motion.div
            key={`progress-${activeIndex}`}
            className="absolute inset-y-0 left-0 bg-accent-brand"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
