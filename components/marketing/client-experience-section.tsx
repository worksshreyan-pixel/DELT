'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Eye, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const CLIENT_STEPS = [
  {
    id: 'link',
    step: '01',
    title: 'Receive Private Link',
    subtitle: 'No software to install',
    icon: Mail,
    desc: 'Your client receives a clean, branded link via email or messaging. No account creation or password setup needed.',
    mockup: {
      tag: 'EMAIL INVITATION',
      title: 'Stark Corp Deal Workspace',
      detail: 'Apex Studio sent you a private deal link for "E-Commerce App & Brand Identity".',
      action: 'Open Deal Workspace',
    },
  },
  {
    id: 'otp',
    step: '02',
    title: 'Instant OTP Access',
    subtitle: '6-digit email passcode',
    icon: KeyRound,
    desc: 'Client enters their email address and receives a 6-digit verification code. Security without user friction.',
    mockup: {
      tag: 'OTP VERIFICATION',
      title: 'Enter Verification Code',
      detail: 'A 6-digit code was sent to client@starkcorp.com',
      code: ['8', '2', '6', '9', '4', '1'],
      action: 'Verify & Access Deal',
    },
  },
  {
    id: 'review',
    step: '03',
    title: 'Review & Feedback',
    subtitle: 'In-app previews & notes',
    icon: Eye,
    desc: 'Client views watermarked previews or Google Drive files, inspects scope items, and leaves structured feedback.',
    mockup: {
      tag: 'CLIENT REVIEW PORTAL',
      title: 'Deliverable Version 3 (Final)',
      detail: 'Watermarked preview available for review. Final assets locked until payment.',
      status: 'Ready for Review',
    },
  },
  {
    id: 'payment',
    step: '04',
    title: 'Approve & Unlock',
    subtitle: 'Instant file release',
    icon: CheckCircle2,
    desc: 'Client approves deliverables and completes payment. High-resolution files unlock instantly and automatically.',
    mockup: {
      tag: 'DEAL COMPLETED',
      title: 'Payment Confirmed & Files Unlocked',
      detail: 'Total ₹22,500 processed. All deliverable files are unlocked and downloadable.',
      status: 'Payment Complete',
    },
  },
];

export function ClientExperienceSection() {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const currentStep = CLIENT_STEPS[activeStepIdx];
  const StepIcon = currentStep.icon;

  return (
    <section className="border-t border-border/80 py-24 sm:py-32 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex justify-center mb-14">
          <motion.div
            className="max-w-2xl text-center"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-brand/10 border border-accent-brand/20 px-3.5 py-1 text-xs font-semibold text-accent-brand mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Friction Client Onboarding</span>
            </div>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl text-foreground">
              Your client doesn&apos;t need to learn DELT.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              No app downloads, no password creation, no complicated signup. Clients open a private deal workspace in seconds with an instant 6-digit email code.
            </p>
          </motion.div>
        </div>

        {/* 4-Step Interactive Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Step Selector Cards (Left) */}
          <div className="lg:col-span-5 space-y-3">
            {CLIENT_STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = activeStepIdx === idx;
              return (
                <motion.button
                  key={s.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveStepIdx(idx)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer',
                    isActive
                      ? 'border-accent-brand/80 bg-card shadow-md ring-1 ring-accent-brand/20'
                      : 'border-border/60 bg-card/60 hover:bg-card hover:border-border'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-colors',
                      isActive ? 'bg-accent-brand/15 text-accent-brand' : 'bg-muted text-muted-foreground'
                    )}>
                      {s.step}
                    </div>
                    <div>
                      <h3 className={cn('text-sm font-semibold transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                        {s.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                    </div>
                  </div>
                  <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-accent-brand' : 'text-muted-foreground/50')} />
                </motion.button>
              );
            })}
          </div>

          {/* Step Visualization Inspector (Right) */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl min-h-[380px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-brand/10 border border-accent-brand/20 text-accent-brand">
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-accent-brand uppercase tracking-wider">
                        STEP {currentStep.step} OF 04
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">{currentStep.title}</h3>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Client Friendly
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStep.desc}
                </p>

                {/* Simulated Portal Preview Box */}
                <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground border-b border-border/40 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent-brand" />
                      {currentStep.mockup.tag}
                    </span>
                    <span className="text-emerald-500 font-medium">OTP Authenticated</span>
                  </div>

                  <p className="text-sm font-semibold text-foreground">{currentStep.mockup.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{currentStep.mockup.detail}</p>

                  {/* OTP Code Boxes preview for Step 2 */}
                  {currentStep.mockup.code && (
                    <div className="flex justify-center gap-2 pt-2">
                      {currentStep.mockup.code.map((num, i) => (
                        <div key={i} className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-brand/40 bg-card text-base font-bold text-foreground shadow-xs">
                          {num}
                        </div>
                      ))}
                    </div>
                  )}

                  {currentStep.mockup.action && (
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-accent-brand/15 border border-accent-brand/30 px-3 py-1.5 text-xs font-semibold text-accent-brand">
                        <span>{currentStep.mockup.action}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Guarantee Banner */}
            <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Zero password fatigue • 100% private deal session
              </span>
              <span className="font-semibold text-foreground">DELT Client Experience</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
