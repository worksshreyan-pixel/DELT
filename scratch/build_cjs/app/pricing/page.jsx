"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const nav_1 = require("@/components/marketing/nav");
const footer_1 = require("@/components/marketing/footer");
const plans_1 = require("@/lib/plans");
const utils_1 = require("@/lib/utils");
function PricingPage() {
    return (<div className="min-h-screen bg-background">
      <nav_1.MarketingNav />

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-20 pb-12 text-center">
        <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl">
          Simple, credit-based pricing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Buy Deal credits as you need them. Storage and transaction fees are separate and transparent.
        </p>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans_1.PLAN_LIST.map((plan, i) => (<framer_motion_1.motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
              <card_1.Card className={(0, utils_1.cn)('h-full relative', plan.highlighted && 'border-primary shadow-lg ring-1 ring-primary/20')}>
                {plan.highlighted && (<div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Most popular
                    </span>
                  </div>)}
                <card_1.CardContent className="p-6">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 h-10">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-display font-semibold">
                      {(0, plans_1.formatPriceForPlan)(plan)}
                    </span>
                    {plan.price && (<span className="text-sm text-muted-foreground"> /mo</span>)}
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-sm font-semibold">{plan.dealCredits} Deal credits</p>
                    <p className="text-xs text-muted-foreground">
                      {(0, plans_1.formatBytes)(plan.storageBytes)} storage included
                    </p>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {plan.features.map((feature) => (<li key={feature} className="flex items-start gap-2 text-sm">
                        <lucide_react_1.Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>))}
                  </ul>
                  <link_1.default href="/signup" className="mt-6 block">
                    <button_1.Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                      {plan.price ? `Choose ${plan.name}` : 'Start free'}
                    </button_1.Button>
                  </link_1.default>
                </card_1.CardContent>
              </card_1.Card>
            </framer_motion_1.motion.div>))}
        </div>
      </section>

      {/* Storage & Transaction Fees */}
      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Storage */}
            <card_1.Card>
              <card_1.CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                    <lucide_react_1.HardDrive className="h-5 w-5 text-primary"/>
                  </div>
                  <h3 className="font-semibold text-lg">Storage</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Each account receives an included storage allowance based on the plan. Additional storage can be purchased when the account exceeds its limit.
                </p>
                <div className="space-y-2">
                  {plans_1.STORAGE_ADDONS.map((addon) => (<div key={addon.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <span className="text-sm font-medium">{addon.label}</span>
                      <span className="text-sm text-muted-foreground">₹{addon.price}</span>
                    </div>))}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Transaction Fees */}
            <card_1.Card>
              <card_1.CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5">
                    <lucide_react_1.CreditCard className="h-5 w-5 text-primary"/>
                  </div>
                  <h3 className="font-semibold text-lg">Transaction fees</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  If payments are processed through DELT, a configurable transaction fee applies. Both the DELT platform fee and payment processing fee are shown transparently.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="text-sm font-medium">DELT platform fee</span>
                    <span className="text-sm text-muted-foreground">{plans_1.TRANSACTION_FEES.platformFeePercent}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="text-sm font-medium">Payment processing fee</span>
                    <span className="text-sm text-muted-foreground">{plans_1.TRANSACTION_FEES.processingFeePercent}%</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Payment processing fees and DELT fees may apply. Fees are configurable and shown before payment.
                </p>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-balance text-2xl font-display font-semibold tracking-tight text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
            { q: 'What is a Deal credit?', a: 'One Deal credit allows you to create one new Deal. You can manage, edit and complete existing Deals without using additional credits.' },
            { q: 'Do unused credits expire?', a: 'Credits included with your plan remain available as long as your plan is active. Purchased add-on credits do not expire.' },
            { q: 'Can I change plans later?', a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately and are prorated.' },
            { q: 'What happens when I run out of storage?', a: 'Existing files remain accessible. New uploads are blocked until you delete files, purchase additional storage, or upgrade your plan. We never auto-delete your files.' },
            { q: 'Do I have to process payments through DELT?', a: 'No. Payment processing is optional. You can mark payments as received externally. Transaction fees only apply when payments are processed through DELT.' },
        ].map((faq) => (<card_1.Card key={faq.q}>
                <card_1.CardContent className="p-5">
                  <h3 className="font-semibold mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </card_1.CardContent>
              </card_1.Card>))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-balance text-2xl font-display font-semibold tracking-tight">
            Start with 1 free Deal.
          </h2>
          <p className="mt-2 text-muted-foreground">
            No credit card required. Upgrade when you are ready.
          </p>
          <div className="mt-6">
            <link_1.default href="/signup">
              <button_1.Button size="lg" className="gap-2">
                Get started
                <lucide_react_1.ArrowRight className="h-4 w-4"/>
              </button_1.Button>
            </link_1.default>
          </div>
        </div>
      </section>

      <footer_1.MarketingFooter />
    </div>);
}
exports.default = PricingPage;
