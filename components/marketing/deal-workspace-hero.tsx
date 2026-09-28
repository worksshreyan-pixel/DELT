'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/plans';

type DealStage = 'agreed' | 'deliverable' | 'review' | 'approved' | 'paid';

const LIVE_ACTIVITIES = [
  'Client viewing Homepage v2 preview',
  'File integrity verified (sha256: 8f9b2c...)',
  'Payment protection active in secure portal',
  'OTP session authenticated for client@starkcorp.com',
  'Review feedback synced to deal log',
];

export function DealWorkspaceHero() {
  const [currentStage, setCurrentStage] = useState<DealStage>('review');
  const [activityIdx, setActivityIdx] = useState(0);

  // Level 2 continuous motion — live activity ticker rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIdx((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const STAGES: { id: DealStage; label: string; number: string }[] = [
    { id: 'agreed', label: 'Agreed Deal', number: '01' },
    { id: 'deliverable', label: 'Deliverable', number: '02' },
    { id: 'review', label: 'Client Review', number: '03' },
    { id: 'approved', label: 'Approval', number: '04' },
    { id: 'paid', label: 'Payment', number: '05' },
  ];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="relative w-full rounded-2xl border border-border/80 bg-card/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 font-sans"
    >
      {/* Top Bar: Workspace Identity & Live Status Ticker */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-[1px] bg-border" />
          <span className="text-xs font-semibold text-foreground tracking-tight font-display">
            Apex Studio × Stark Corp
          </span>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
            DLT-2026-X94
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Level 2 Continuous Pulse Indicator */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Active Deal Workspace
          </span>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="mt-5 border-b border-border/40 pb-5">
        <div className="grid grid-cols-5 gap-2 text-center">
          {STAGES.map((s, idx) => {
            const isCurrent = currentStage === s.id;
            const stageOrder = ['agreed', 'deliverable', 'review', 'approved', 'paid'];
            const isPassed = stageOrder.indexOf(currentStage) > idx;

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(s.id)}
                className={cn(
                  'group flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl transition-all cursor-pointer',
                  isCurrent
                    ? 'bg-accent-brand/10 border border-accent-brand/30 text-accent-brand font-semibold shadow-xs'
                    : isPassed
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium hover:bg-muted/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isCurrent
                      ? 'bg-accent-brand text-accent-brand-foreground shadow-sm'
                      : isPassed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
                  )}
                >
                  {isPassed ? <CheckCircle2 className="h-4 w-4" /> : s.number}
                </div>
                <span className="text-[11px] sm:text-xs tracking-tight truncate w-full font-display">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Deal Stage Visualizer */}
      <div className="mt-5 rounded-xl border border-border/80 bg-muted/20 p-5 sm:p-6 min-h-[280px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* STAGE 1: AGREED DEAL */}
          {currentStage === 'agreed' && (
            <motion.div
              key="agreed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">
                    Web Application & Brand Identity
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Contract scope and pricing agreed by both parties
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground bg-card border border-border/80 px-3 py-1 rounded-lg shadow-xs">
                  Agreed Price: {formatCurrency(56000)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Creator</span>
                  <p className="text-sm font-semibold text-foreground">Apex Studio</p>
                  <p className="text-xs text-muted-foreground">Delivery: 3 Version Milestones</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">Client</span>
                  <p className="text-sm font-semibold text-foreground">Stark Corp</p>
                  <p className="text-xs text-muted-foreground">Access: Verified via OTP</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: DELIVERABLE READY */}
          {currentStage === 'deliverable' && (
            <motion.div
              key="deliverable"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">
                    Deliverable Uploaded (v2.0)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Apex Studio submitted production-deliverables-v2.zip
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                  <Lock className="h-3.5 w-3.5" /> Protected Until Payment
                </span>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">production-deliverables-v2.zip</span>
                  <span className="text-muted-foreground font-mono text-[11px]">48.2 MB</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Contains Next.js frontend code, Figma UI design assets, and responsive landing page templates. Watermarked preview available for review.
                </p>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: CLIENT REVIEW (DEFAULT PRIMARY STATE) */}
          {currentStage === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">
                    Deliverable Ready for Client Review
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Stark Corp is reviewing Homepage v2 ({formatCurrency(56000)})
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg">
                  <Eye className="h-3.5 w-3.5" /> Ready for Review
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Deliverable</span>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent-brand" />
                    <span>Homepage v2</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Watermarked preview active in portal</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">Payment Protection</span>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Protected Until Approval</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Files unlock automatically after payment</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 4: APPROVAL */}
          {currentStage === 'approved' && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">
                    Client Approved Deliverables
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Stark Corp confirmed: &ldquo;Homepage v2 approved.&rdquo;
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                </span>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready for Payment Completion
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upon payment confirmation of {formatCurrency(56000)}, final high-resolution assets unlock automatically for Stark Corp and payout transfers directly to Apex Studio.
                </p>
              </div>
            </motion.div>
          )}

          {/* STAGE 5: PAYMENT COMPLETED */}
          {currentStage === 'paid' && (
            <motion.div
              key="paid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground font-display">
                    Payment Released & Files Unlocked
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Deal complete: {formatCurrency(56000)} transferred to creator
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  <Unlock className="h-3.5 w-3.5" /> Deliverables Unlocked
                </span>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span>Transaction Complete</span>
                  <span>{formatCurrency(56000)} Payout Sent</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stark Corp downloaded production-deliverables-v2.zip. Deal activity record archived cleanly.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Activity Level 2 Ticker */}
        <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
            <Activity className="h-3.5 w-3.5 text-accent-brand shrink-0 animate-pulse" />
            <AnimatePresence mode="wait">
              <motion.span
                key={activityIdx}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] text-muted-foreground truncate max-w-[280px] sm:max-w-none"
              >
                {LIVE_ACTIVITIES[activityIdx]}
              </motion.span>
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              const stages: DealStage[] = ['agreed', 'deliverable', 'review', 'approved', 'paid'];
              const nextIdx = (stages.indexOf(currentStage) + 1) % stages.length;
              setCurrentStage(stages[nextIdx]);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-brand text-accent-brand-foreground px-3 py-1.5 font-semibold transition-all hover:brightness-110 active:scale-95 cursor-pointer shadow-xs text-xs"
          >
            <span>Next Stage</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
