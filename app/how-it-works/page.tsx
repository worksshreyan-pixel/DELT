'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Users,
  MessageSquare,
  FileCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { PixelBlastBackground } from '@/components/marketing/pixel-blast-background';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    step: '01',
    icon: FolderKanban,
    title: 'Create a Deal Workspace',
    desc: 'Set up your project title, description, scope milestones, price, deadline, and required deliverables in a single form.',
    detail: 'Creates a unique workspace locator (e.g. DLT-8V26RW75) with isolated file storage and permission rules.',
    badge: 'Step 1 • Scope',
  },
  {
    step: '02',
    icon: Users,
    title: 'Invite Client via OTP',
    desc: 'Share a private link. Your client enters their email, verifies with a 6-digit OTP, and lands in their dedicated deal portal.',
    detail: 'No password friction or account creation required for your client.',
    badge: 'Step 2 • Access',
  },
  {
    step: '03',
    icon: MessageSquare,
    title: 'Discuss & Negotiate Terms',
    desc: 'All communications stay inside the workspace. Propose new price offers, counter-offer, and lock terms with an immutable audit log.',
    detail: 'Every proposal is timestamped with stated reasons. Agreed price becomes the authoritative contract.',
    badge: 'Step 3 • Agreement',
  },
  {
    step: '04',
    icon: FileCheck,
    title: 'Deliver Files with Versioning',
    desc: 'Upload deliverables in versions (v1, v2, v3 Final). Each asset is checksum-hashed and payment-gated.',
    detail: 'Files stay encrypted and locked until payment is verified by the deal engine.',
    badge: 'Step 4 • Delivery',
  },
  {
    step: '05',
    icon: CreditCard,
    title: 'Client Review & Escrow Deposit',
    desc: 'Client inspects previews and milestone progress inside the workspace, then deposits funds safely into escrow.',
    detail: 'Both platform fee and payment processing fee are displayed transparently before confirmation.',
    badge: 'Step 5 • Escrow',
  },
  {
    step: '06',
    icon: Lock,
    title: 'Automated Payout & Asset Release',
    desc: 'When client approves the milestone, funds transfer to your account instantly while final payment locks release for the client.',
    detail: 'Dual confirmation releases deliverables and closes financial obligations.',
    badge: 'Step 6 • Payout',
  },
  {
    step: '07',
    icon: CheckCircle2,
    title: 'Complete & Archive Deal',
    desc: 'Mark the deal complete. Every milestone, message, approval, and file upload is sealed in a permanent audit log.',
    detail: 'Both creator and client retain permanent access to deliverables and transaction records.',
    badge: 'Step 7 • Complete',
  },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const current = STEPS[activeStep];

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors overflow-x-hidden">
      {/* Monochromatic Pixel Blast Background Layer */}
      <PixelBlastBackground pixelSize={4} gap={24} />

      <MarketingNav />

      <div className="relative z-10 pt-20">
        {/* Header */}
        <section className="flex justify-center px-4 sm:px-6 pt-16 pb-12">
          <motion.div
            className="max-w-3xl text-center rounded-2xl bg-card/85 border border-border/80 p-6 sm:p-8 backdrop-blur-md shadow-xs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-mono font-medium text-foreground shadow-xs backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>Deal Execution Guide</span>
            </div>
            <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl md:text-6xl">
              How DELT works from creation to payout.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Seven structured steps from deal creation to instant payout. Every deal follows the same clear, protected path.
            </p>
          </motion.div>
        </section>

        {/* Interactive Release-Step Timeline */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Step List (Left Column) */}
            <div className="lg:col-span-5 space-y-2">
              {STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isActive = activeStep === idx;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(idx)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                      isActive
                        ? 'border-amber-500/80 bg-card/95 shadow-md ring-1 ring-amber-500/20 scale-[1.01] backdrop-blur-md'
                        : 'border-border/80 bg-card/90 hover:bg-card hover:border-foreground/30 shadow-xs backdrop-blur-md'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-amber-500">
                        {s.step}
                      </span>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', isActive ? 'text-amber-500' : 'text-muted-foreground')} />
                        <span className={cn('text-xs sm:text-sm font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                          {s.title}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Step Detailed Card (Right Column) */}
            <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl min-h-[360px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-bold text-amber-500">
                        STEP {current.step}
                      </span>
                      <h3 className="text-xl font-semibold text-foreground">
                        {current.title}
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {current.badge}
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
                </motion.div>
              </AnimatePresence>

              <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-mono">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  className="hover:text-foreground disabled:opacity-30"
                >
                  ← Previous Step
                </button>
                <button
                  disabled={activeStep === STEPS.length - 1}
                  onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                  className="flex items-center gap-1 hover:text-foreground disabled:opacity-30 text-amber-600 dark:text-amber-400 font-bold"
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/80 py-20">
          <div className="mx-auto max-w-2xl px-4 flex justify-center">
            <div className="w-full text-center rounded-2xl bg-card/85 border border-border/80 p-8 backdrop-blur-md shadow-md">
              <h2 className="text-balance text-3xl font-display font-semibold tracking-tight">
                Ready to create your first Deal?
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                Start free with 1 Deal credit. No credit card required.
              </p>
              <div className="mt-6">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 font-mono text-xs rounded-full px-8 shadow-md">
                    <span>Get started free</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </div>
  );
}
