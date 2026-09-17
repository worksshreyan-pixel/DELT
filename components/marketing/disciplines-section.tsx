'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Code2, Film, PenTool, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISCIPLINES = [
  {
    id: 'designer',
    label: 'Web & UI Designers',
    icon: Palette,
    badge: 'Design Deliverables',
    headline: 'Protect your Figma exports & vector packages.',
    desc: 'Deliver high-res branding kits, UI prototypes, and design specs with payment-gated locks.',
    workflow: [
      { step: '01', title: 'Figma & Asset Delivery', detail: 'Upload vector packs, brand kits & prototypes in isolated workspace' },
      { step: '02', title: 'Client Feedback & Revision', detail: 'Structured review threads without buried WhatsApp DMs' },
      { step: '03', title: 'Escrow Lock Release', detail: 'Assets unlock automatically when client confirms final design approval' },
    ],
  },
  {
    id: 'developer',
    label: 'Full-Stack Developers',
    icon: Code2,
    badge: 'Code & Deployments',
    headline: 'Milestone scope tracking for software & web apps.',
    desc: 'Break project repositories, database schemas, and deployment milestones into clear agreed steps.',
    workflow: [
      { step: '01', title: 'Milestone Scope Definition', detail: 'Agree on API integrations, database schemas, and staging links' },
      { step: '02', title: 'Code Review & Demo Approval', detail: 'Client inspects live staging environment directly in portal' },
      { step: '03', title: 'Source Repository Release', detail: 'Production repo access and domain transfer unlocked upon payment' },
    ],
  },
  {
    id: 'video',
    label: 'Video & Motion Editors',
    icon: Film,
    badge: 'Media Assets',
    headline: 'Watermark-free final video delivery upon payment.',
    desc: 'Share draft renders for timestamped feedback, then lock full 4K final renders until escrow clears.',
    workflow: [
      { step: '01', title: 'Draft Render Preview', detail: 'Client reviews draft cuts with frame-accurate timestamp notes' },
      { step: '02', title: 'Revision Iteration', detail: 'Track v1, v2, and final render versions with complete change logs' },
      { step: '03', title: '4K ProRes Release', detail: 'Master video files unlock instantly when final payment clears' },
    ],
  },
  {
    id: 'writer',
    label: 'Copywriters & Authors',
    icon: PenTool,
    badge: 'Editorial & Copy',
    headline: 'Clear revision limits & copy sign-offs.',
    desc: 'Manage content drafts, brand messaging frameworks, and SEO copy without endless revision scope creep.',
    workflow: [
      { step: '01', title: 'Draft Submission', detail: 'Share structured copy docs with defined revision limits' },
      { step: '02', title: 'Feedback & Signoff', detail: 'Client approves copy blocks in a permanent audit log' },
      { step: '03', title: 'Final Copy Unlock', detail: 'Final publication rights and raw files unlocked upon completion' },
    ],
  },
  {
    id: 'agency',
    label: 'Agencies & Studios',
    icon: Building2,
    badge: 'Multi-Client Operations',
    headline: 'Unified deal workspace for retainer & project clients.',
    desc: 'Manage multiple concurrent client deals with team permissions, audit logs, and automated payouts.',
    workflow: [
      { step: '01', title: 'Multi-Role Deal Portal', detail: 'Invite project managers, creators, and client stakeholders' },
      { step: '02', title: 'Transparent Retainer Billing', detail: 'Track monthly deal credits and escrow deposits automatically' },
      { step: '03', title: 'Immutable Studio Audit', detail: 'Complete financial and operational history for every client relationship' },
    ],
  },
];

export function DisciplinesSection() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-cycle every 5s unless hovered/clicked
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % DISCIPLINES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const current = DISCIPLINES[activeIdx];
  const Icon = current.icon;

  return (
    <section className="border-t border-border/80 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex justify-center mb-14">
          <motion.div
            className="max-w-2xl text-center rounded-2xl bg-card/85 border border-border/80 px-6 py-5 backdrop-blur-md shadow-xs"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
              Engineered for Digital Creators
            </p>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Custom workflows for every digital discipline.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Select your discipline to see how DELT secures your deliverables and payment workflow.
            </p>
          </motion.div>
        </div>

        {/* Discipline Tab Selector Bar */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex flex-wrap justify-center gap-2 mb-10 p-1.5 rounded-2xl bg-card border border-border/80 shadow-md"
        >
          {DISCIPLINES.map((d, idx) => {
            const DIcon = d.icon;
            const isActive = activeIdx === idx;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setActiveIdx(idx);
                  setIsPaused(true);
                }}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-mono font-medium transition-colors cursor-pointer',
                  isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="discipline-pill"
                    className="absolute inset-0 rounded-xl bg-muted/60 border border-border/80 shadow-xs"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <DIcon className={cn('relative z-10 h-4 w-4', isActive ? 'text-amber-500' : 'text-muted-foreground')} />
                <span className="relative z-10">{d.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Content Card */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl min-h-[340px]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Icon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{current.headline}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{current.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {current.badge}
                </span>
              </div>

              {/* Workflow Breakdown Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {current.workflow.map((w) => (
                  <div key={w.step} className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-amber-500">
                        STEP {w.step}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{w.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{w.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
