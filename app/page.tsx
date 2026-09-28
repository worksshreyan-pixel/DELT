'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { GalaxyBackground } from '@/components/marketing/galaxy-background';
import { MaskedHeading } from '@/components/marketing/masked-heading';
import { DealWorkspaceHero } from '@/components/marketing/deal-workspace-hero';
import { ScrollExpandHero } from '@/components/marketing/scroll-expand-hero';
import { ClientExperienceSection } from '@/components/marketing/client-experience-section';
import { ProblemSection } from '@/components/marketing/problem-section';
import { WorkflowSection } from '@/components/marketing/workflow-section';
import { DisciplinesSection } from '@/components/marketing/disciplines-section';
import { NegotiationDemo } from '@/components/marketing/negotiation-demo';
import { FileRevisionDemo } from '@/components/marketing/file-revision-demo';
import { SecuritySection } from '@/components/marketing/security-section';
import { PLAN_LIST, formatPriceForPlan } from '@/lib/plans';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors overflow-x-hidden font-sans">
      {/* DELT React Bits Galaxy Canvas Background */}
      <GalaxyBackground />

      {/* Dynamic Island ↔ Expanded Header Navigation */}
      <MarketingNav />

      {/* Content Layer: Strictly z-10 above background */}
      <div className="relative z-10 pt-20">
        {/* ── 1. Hero Section ── */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Trust Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-xs backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Payment-Gated Client Workspace</span>
              </motion.div>

              {/* Masked Heading Reveal */}
              <MaskedHeading
                lines={['The secure workspace for', 'your client deals.']}
                delay={0.12}
                highlightLast
              />

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto mt-6 max-w-xl text-balance text-base sm:text-lg text-muted-foreground leading-relaxed font-normal"
              >
                Create the deal → agree on scope and price → deliver work → get client approval → complete payment.
              </motion.p>

              {/* CTAs & Reassurance */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-col items-center justify-center gap-4"
              >
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row w-full sm:w-auto">
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full gap-2 sm:w-auto text-xs font-semibold px-6 rounded-full shadow-md hover:shadow-lg transition-all group">
                      <span>Create your first Deal</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  <Link href="/how-it-works" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-xs font-semibold rounded-full">
                      See how it works
                    </Button>
                  </Link>
                </div>

                <p className="text-[11px] text-muted-foreground font-normal">
                  No credit card required • Start with your first deal
                </p>
              </motion.div>
            </div>

            {/* React Bits Scroll Expand Hero Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12"
            >
              <ScrollExpandHero>
                <DealWorkspaceHero />
              </ScrollExpandHero>
            </motion.div>
          </div>
        </section>

        {/* ── 2. Client Experience Section ── */}
        <ClientExperienceSection />

        {/* ── 3. Problem Section: Orbital Tool Convergence ── */}
        <ProblemSection />

        {/* ── 4. Core Workflow Engine Loop ── */}
        <WorkflowSection />

        {/* ── 5. Structured Price Negotiation Section ── */}
        <section className="border-t border-border/80 py-24 sm:py-32 bg-background/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <motion.div
                className="lg:col-span-6 rounded-2xl bg-card/85 border border-border/80 p-6 sm:p-8 backdrop-blur-md shadow-xs"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl text-foreground">
                  Negotiations become part of the authoritative deal record.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
                  No more lost DMs or vague email price changes. Proposals and counter-offers are documented with stated reasons, and accepted prices lock automatically into the deal contract.
                </p>
                <ul className="mt-6 space-y-3 font-medium text-xs sm:text-sm">
                  {[
                    'Structured price proposals with mandatory stated reasons',
                    'Counter-offers linked directly to original proposal references',
                    'Full negotiation activity log preserved permanently',
                    'Accepted price automatically becomes authoritative deal contract price',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <div className="lg:col-span-6">
                <NegotiationDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Deliverables & Revisions Pipeline ── */}
        <FileRevisionDemo />

        {/* ── 7. Built for Independent Creators (Disciplines) ── */}
        <DisciplinesSection />

        {/* ── 8. Security Section ── */}
        <SecuritySection />

        {/* ── 9. Transparent Pricing Overview ── */}
        <section className="border-t border-border/80 py-24 sm:py-32 bg-background/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center mb-12">
              <motion.div
                className="max-w-2xl text-center rounded-2xl bg-card/85 border border-border/80 px-6 py-5 backdrop-blur-md shadow-xs"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl text-foreground">
                  Start free. Scale when your deals grow.
                </h2>
                <p className="mt-4 text-muted-foreground text-sm sm:text-base">
                  Predictable credit-based plans. Storage and processing fees are transparent and isolated.
                </p>
              </motion.div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLAN_LIST.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    'relative rounded-2xl border bg-card p-6 flex flex-col justify-between transition-all shadow-xs cursor-pointer',
                    plan.highlighted
                      ? 'border-accent-brand shadow-lg ring-1 ring-accent-brand/20'
                      : 'border-border/80 hover:border-foreground/30'
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    {plan.highlighted && (
                      <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-accent-brand/10 border border-accent-brand/30 px-3 py-0.5 text-[10px] font-bold text-accent-brand">
                          Most popular
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold text-base font-display">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground font-display">
                        {formatPriceForPlan(plan)}
                      </span>
                      {plan.price && (
                        <span className="text-xs text-muted-foreground font-medium">/mo</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/40 text-xs font-medium">
                    <span className="font-semibold text-foreground">{plan.dealCredits} Deal credits</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/pricing">
                <Button variant="outline" className="gap-2 text-xs font-semibold rounded-full">
                  See full pricing breakdown
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 10. Final Conversion CTA ── */}
        <section className="border-t border-border/80 py-28 sm:py-36">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center flex justify-center">
            <motion.div
              className="rounded-3xl bg-card/85 border border-border/80 p-8 sm:p-12 backdrop-blur-md shadow-lg"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl text-foreground">
                Start your first Deal today.
              </h2>
              <p className="mt-5 text-muted-foreground text-base sm:text-lg leading-relaxed">
                Stop juggling six tools for one project. Give every client deal a secure, professional home.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 text-xs font-semibold px-8 rounded-full shadow-md group">
                    <span>Create your first Deal</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground text-xs font-semibold rounded-full">
                    See how it works
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground font-medium">
                No credit card required. Free tier includes 1 deal credit.
              </p>
            </motion.div>
          </div>
        </section>

        <MarketingFooter />
      </div>
    </div>
  );
}
