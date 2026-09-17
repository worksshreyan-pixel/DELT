'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, HardDrive, CreditCard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';
import { PixelBlastBackground } from '@/components/marketing/pixel-blast-background';
import { PLAN_LIST, STORAGE_ADDONS, TRANSACTION_FEES, formatPriceForPlan, formatBytes } from '@/lib/plans';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors overflow-x-hidden">
      {/* Monochromatic Pixel Blast Background Layer */}
      <PixelBlastBackground pixelSize={4} gap={24} />

      <MarketingNav />

      <div className="relative z-10 pt-20">
        {/* Header */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3.5 py-1.5 text-xs font-mono font-medium text-foreground shadow-xs backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Predictable Credit-Based Pricing</span>
            </div>
            <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl md:text-6xl">
              Simple plans for growing digital deals.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Buy Deal credits as you need them. Storage and processing fees are completely transparent and separate.
            </p>
          </motion.div>
        </section>

        {/* Plan Cards */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_LIST.map((plan, i) => {
              const isSelected = hoveredPlan ? hoveredPlan === plan.id : plan.highlighted;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                  className={cn(
                    'relative overflow-hidden flex flex-col justify-between rounded-2xl border bg-card/90 p-6 shadow-xl backdrop-blur-md transition-all duration-200 hover:-translate-y-1',
                    isSelected
                      ? 'border-amber-500 ring-1 ring-amber-500/30'
                      : 'border-border/80'
                  )}
                >
                  <div>
                    {plan.highlighted && (
                      <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          Most popular
                        </span>
                      </div>
                    )}
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 h-10 leading-relaxed">
                      {plan.description}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1 font-mono">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPriceForPlan(plan)}
                      </span>
                      {plan.price && (
                        <span className="text-xs text-muted-foreground">/mo</span>
                      )}
                    </div>
                    <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3 font-mono text-xs space-y-1">
                      <p className="font-semibold text-foreground">{plan.dealCredits} Deal credits</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatBytes(plan.storageBytes)} storage included
                      </p>
                    </div>
                    <ul className="mt-5 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/signup" className="mt-6 block">
                    <Button
                      className={cn(
                        'w-full font-mono text-xs rounded-full transition-all',
                        plan.highlighted ? 'shadow-md' : ''
                      )}
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {plan.price ? `Choose ${plan.name}` : 'Start free'}
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Storage & Transaction Fees Breakdown */}
        <section className="border-t border-border/80 py-20 bg-muted/10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Storage Addons Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <HardDrive className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Storage Allowances</h3>
                    <p className="text-xs text-muted-foreground font-mono">Isolated encrypted storage</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Included storage allowance is based on active plan. Purchased add-on storage does not expire.
                </p>
                <div className="space-y-2 font-mono text-xs">
                  {STORAGE_ADDONS.map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                      <span className="font-semibold text-foreground">{addon.label}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">₹{addon.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Fees Card */}
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Transparent Transaction Fees</h3>
                    <p className="text-xs text-muted-foreground font-mono">Optional escrow payments</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Transaction fees apply only when processing client payments through DELT escrow. Platform and processing fees are shown transparently before checkout.
                </p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <span className="font-semibold text-foreground">DELT Platform Fee</span>
                    <span className="text-foreground">{TRANSACTION_FEES.platformFeePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <span className="font-semibold text-foreground">Payment Processing Fee</span>
                    <span className="text-foreground">{TRANSACTION_FEES.processingFeePercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-border/80 bg-background py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-balance text-2xl font-display font-semibold tracking-tight text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {[
                { q: 'What is a Deal credit?', a: 'One Deal credit allows you to create one new Deal. You can manage, edit, and complete existing Deals without using additional credits.' },
                { q: 'Do unused credits expire?', a: 'Credits included with your plan remain available as long as your plan is active. Purchased add-on credits do not expire.' },
                { q: 'Can I change plans later?', a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.' },
                { q: 'What happens when I run out of storage?', a: 'Existing files remain accessible. New uploads are blocked until you delete files, purchase additional storage, or upgrade your plan.' },
                { q: 'Do I have to process payments through DELT?', a: 'No. Payment processing is optional. You can mark payments as received externally without paying transaction fees.' },
              ].map((faq) => (
                <div key={faq.q} className="rounded-xl border border-border/80 bg-card p-5 space-y-1.5 shadow-xs">
                  <h3 className="font-semibold text-sm text-foreground">{faq.q}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final Pricing CTA */}
        <section className="border-t border-border/80 py-20 bg-card/40">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight">
              Start with 1 free Deal.
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              No credit card required. Upgrade when you are ready to scale.
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
        </section>

        <MarketingFooter />
      </div>
    </div>
  );
}
