'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus,
  Handshake,
  UploadCloud,
  Eye,
  RefreshCw,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WORKFLOW_STAGES = [
  {
    id: 'create',
    stage: '01',
    title: 'Scope Definition',
    icon: FolderPlus,
    desc: 'Set project milestones, price, and deliverables in a dedicated deal workspace.',
    detail: 'Workspace DLT-8V26RW75 initialized with isolated storage and audit permissions.',
    stateLabel: 'Scope Agreed',
  },
  {
    id: 'agree',
    stage: '02',
    title: 'Contract Lock',
    icon: Handshake,
    desc: 'Client enters via single-use OTP. Proposals are negotiated and locked.',
    detail: 'Accepted price becomes the authoritative contract reference.',
    stateLabel: 'Terms Locked',
  },
  {
    id: 'deliver',
    stage: '03',
    title: 'File Upload',
    icon: UploadCloud,
    desc: 'Upload deliverables with SHA-256 version hashes and payment lock protection.',
    detail: 'Files remain encrypted and locked until payment clears.',
    stateLabel: 'v1 Uploaded',
  },
  {
    id: 'review',
    stage: '04',
    title: 'Client Review',
    icon: Eye,
    desc: 'Client inspects previews and milestone completion inside the private portal.',
    detail: 'No lost email threads or expired download links.',
    stateLabel: 'Under Review',
  },
  {
    id: 'revise',
    stage: '05',
    title: 'Revision Pipeline',
    icon: RefreshCw,
    desc: 'Iterate on feedback with complete version history (v1 → v2 → v3 Final).',
    detail: 'Every revision request is logged in the permanent audit trail.',
    stateLabel: 'Revision Logged',
  },
  {
    id: 'approve',
    stage: '06',
    title: 'Escrow Release',
    icon: CheckCircle2,
    desc: 'Client approves final work. Escrow funds deposit into creator account.',
    detail: 'Instant automated payout triggered upon client signoff.',
    stateLabel: 'Payout Released',
  },
  {
    id: 'complete',
    stage: '07',
    title: 'Deal Sealed',
    icon: Lock,
    desc: 'The deal is marked complete with an immutable cryptographically timestamped audit log.',
    detail: 'Permanent archived record retained for both creator and client.',
    stateLabel: 'Deal Complete',
  },
];

export function WorkflowSection() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Continuous loop traveling through stages 0 to 6 every 3.5s
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % WORKFLOW_STAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const current = WORKFLOW_STAGES[activeStage];

  return (
    <section className="border-t border-border/80 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex justify-center mb-14">
          <motion.div
            className="max-w-2xl text-center rounded-2xl bg-card/85 border border-border/80 px-6 py-5 backdrop-blur-md shadow-xs"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
              <Zap className="h-3.5 w-3.5 animate-pulse" />
              <span>DEAL EXECUTION ENGINE</span>
            </div>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Continuous automated deal progression.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Watch the live deal signal travel through all 7 stages from scope creation to instant payout.
            </p>
          </motion.div>
        </div>

        {/* Workflow Execution Layout */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          {/* Stage Nodes (Left Column) */}
          <div className="lg:col-span-5 space-y-2">
            {WORKFLOW_STAGES.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeStage === idx;
              return (
                <motion.button
                  key={s.id}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveStage(idx);
                    setIsPaused(true);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer',
                    isActive
                      ? 'border-amber-500/80 bg-card/95 shadow-md ring-1 ring-amber-500/20 scale-[1.02] backdrop-blur-md'
                      : 'border-border/80 bg-card/90 hover:bg-card hover:border-foreground/30 shadow-xs backdrop-blur-md'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      {s.stage}
                    </span>
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-amber-500' : 'text-muted-foreground')} />
                      <span className={cn('text-xs sm:text-sm font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                        {s.title}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Active Signal Visual Inspector (Right Column) */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl min-h-[360px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl font-bold text-amber-500">
                      STAGE {current.stage}
                    </span>
                    <h3 className="text-xl font-semibold text-foreground">
                      {current.title}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {current.stateLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-base text-foreground font-medium leading-relaxed">
                    {current.desc}
                  </p>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                      {current.detail}
                    </p>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Engine Signal Location</span>
                    <span>Stage {activeStage + 1} of {WORKFLOW_STAGES.length}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${((activeStage + 1) / WORKFLOW_STAGES.length) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono text-[11px]">
                {isPaused ? '⏸ Loop paused (Hovering)' : '▶ Live signal cycling'}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={activeStage === 0}
                  onClick={() => {
                    setActiveStage(Math.max(0, activeStage - 1));
                    setIsPaused(true);
                  }}
                  className="hover:text-foreground disabled:opacity-30 font-mono text-xs"
                >
                  Prev
                </button>
                <button
                  disabled={activeStage === WORKFLOW_STAGES.length - 1}
                  onClick={() => {
                    setActiveStage(Math.min(WORKFLOW_STAGES.length - 1, activeStage + 1));
                    setIsPaused(true);
                  }}
                  className="hover:text-foreground disabled:opacity-30 font-mono text-xs text-amber-600 dark:text-amber-400 font-bold"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
