'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Code2, Film, PenTool, Building2, CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISCIPLINES = [
  {
    id: 'developer',
    label: 'Developers',
    icon: Code2,
    badge: 'Code & Deliverables',
    headline: 'Keep scope, revisions, and final delivery in one place.',
    desc: 'Break client software, web applications, and feature releases into clear agreed milestone deliverables.',
    workflow: [
      { step: '01', title: 'Agreed Scope', detail: 'Define clear technical requirements and milestone payments upfront' },
      { step: '02', title: 'Staging & Review', detail: 'Client inspects live staging builds directly in their deal portal' },
      { step: '03', title: 'Release on Payment', detail: 'Production code and repositories unlock automatically upon approval & payment' },
    ],
  },
  {
    id: 'designer',
    label: 'Designers',
    icon: Palette,
    badge: 'UI & Brand Assets',
    headline: 'Deliver versions and collect structured feedback.',
    desc: 'Share UI prototypes, brand kits, and design assets with protected preview access.',
    workflow: [
      { step: '01', title: 'Asset Delivery', detail: 'Upload vector packs, brand kits & Figma exports in private workspace' },
      { step: '02', title: 'Structured Feedback', detail: 'Collect clear design feedback without buried email threads' },
      { step: '03', title: 'High-Res Unlock', detail: 'Source files unlock automatically when client confirms final approval & payment' },
    ],
  },
  {
    id: 'video',
    label: 'Video Editors',
    icon: Film,
    badge: 'Media Delivery',
    headline: 'Keep large deliverables organized while tracking approval.',
    desc: 'Share draft cuts for feedback, then keep final 4K master renders protected until payment clears.',
    workflow: [
      { step: '01', title: 'Draft Preview', detail: 'Share watermarked draft cuts for client review' },
      { step: '02', title: 'Revision History', detail: 'Track v1, v2, and final cuts with clear feedback records' },
      { step: '03', title: 'Master File Release', detail: 'Full-resolution video downloads unlock instantly when final payment clears' },
    ],
  },
  {
    id: 'writer',
    label: 'Consultants & Writers',
    icon: PenTool,
    badge: 'Content & Strategy',
    headline: 'Prevent scope creep and maintain revision limits.',
    desc: 'Manage strategic copy, brand frameworks, and editorial deliverables with defined revision bounds.',
    workflow: [
      { step: '01', title: 'Scope Definition', detail: 'Share structured deliverables with explicit revision limits' },
      { step: '02', title: 'Client Sign-Off', detail: 'Client approves content sections in a permanent record' },
      { step: '03', title: 'Final Deliverable Unlock', detail: 'Publication rights and final strategy documents released upon payment' },
    ],
  },
  {
    id: 'agency',
    label: 'Agencies & Studios',
    icon: Building2,
    badge: 'Client Workspaces',
    headline: 'Unified deal workspaces for every client project.',
    desc: 'Manage multiple client deals with clear progress tracking, audit records, and automated payouts.',
    workflow: [
      { step: '01', title: 'Client Portal', detail: 'Send private, OTP-authenticated deal links to clients' },
      { step: '02', title: 'Structured Milestone Approval', detail: 'Track milestone approvals and payment status in real time' },
      { step: '03', title: 'Studio Activity History', detail: 'Maintain clean financial and operational records for all client work' },
    ],
  },
];

export function DisciplinesSection() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-cycle every 6s unless hovered/clicked
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % DISCIPLINES.length);
    }, 6000);
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
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-brand mb-3">
              <Users className="h-3.5 w-3.5" />
              <span>Built for Independent Creators</span>
            </div>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl text-foreground">
              Workflows tailored to your discipline.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Select your creative discipline to see how DELT protects your client deliverables and payment workflow.
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
                  'relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer',
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
                <DIcon className={cn('relative z-10 h-4 w-4', isActive ? 'text-accent-brand' : 'text-muted-foreground')} />
                <span className="relative z-10">{d.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-brand/10 border border-accent-brand/20">
                    <Icon className="h-5 w-5 text-accent-brand" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{current.headline}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{current.desc}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent-brand/10 text-accent-brand border border-accent-brand/20">
                  {current.badge}
                </span>
              </div>

              {/* Workflow Breakdown Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {current.workflow.map((w) => (
                  <div key={w.step} className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-accent-brand">
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
