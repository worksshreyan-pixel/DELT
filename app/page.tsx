'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  MessageSquare,
  ArrowLeftRight,
  FileCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Shield,
  Users,
  FolderKanban,
  Activity,
  Download,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DealStatusBadge } from '@/components/deal-status-badge';
import { UsageMeter } from '@/components/usage-meter';
import { formatCurrency } from '@/lib/plans';
import { MarketingNav } from '@/components/marketing/nav';
import { MarketingFooter } from '@/components/marketing/footer';

const steps = [
  { icon: FolderKanban, title: 'Create a Deal', desc: 'Set up your project, scope, price and client details in minutes.' },
  { icon: Users, title: 'Invite your client', desc: 'Share a private link. Your client gets a focused project portal — no account needed.' },
  { icon: MessageSquare, title: 'Discuss & negotiate', desc: 'Keep all communication in one place. Propose and counter-offer with structure.' },
  { icon: FileCheck, title: 'Deliver the work', desc: 'Upload versions, get approvals, and manage deliverables with full history.' },
  { icon: CreditCard, title: 'Get paid', desc: 'Payment status is tracked alongside the work. Files unlock when payment clears.' },
  { icon: CheckCircle2, title: 'Complete the project', desc: 'Mark the deal complete with a full audit trail of everything that happened.' },
];

const useCases = [
  { label: 'Web Designers', icon: '🎨' },
  { label: 'Developers', icon: '💻' },
  { label: 'Graphic Designers', icon: '✏️' },
  { label: 'Video Editors', icon: '🎬' },
  { label: 'Copywriters', icon: '✍️' },
  { label: 'Digital Creators', icon: '📸' },
  { label: 'Agencies', icon: '🏢' },
];

const plans = [
  { name: 'Free', deals: '1 Deal', desc: 'Try DELT with your first client' },
  { name: 'Starter', deals: '10 Deals', desc: 'For a few active clients' },
  { name: 'Creator', deals: '50 Deals', desc: 'For active professionals', highlighted: true },
  { name: 'Professional', deals: '100 Deals', desc: 'For agencies and teams' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Private client transactions, all in one place
            </div>
            <h1 className="text-balance text-4xl font-display font-semibold tracking-tight sm:text-5xl md:text-6xl">
              The workspace where digital work gets done.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              DELT brings client communication, negotiation, delivery and payment into one secure workspace.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Create your first Deal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See how it works
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <DealWorkspacePreview />
          </motion.div>
        </div>
      </section>

      {/* Section 1 — Problem */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              The freelancer workflow is broken.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Today you manage client work across five different tools. Nothing connects.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
              {['WhatsApp', 'Email', 'Google Drive', 'Payment Links', 'Spreadsheets', 'Manual Invoices'].map((tool, i) => (
                <div key={tool} className="flex items-center gap-3">
                  <span className="rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-muted-foreground">
                    {tool}
                  </span>
                  {i < 5 && <span className="text-muted-foreground/40">+</span>}
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-6 py-4">
                <span className="text-sm font-medium text-muted-foreground">One Deal.</span>
                <span className="text-lg font-display font-semibold">One workspace.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — How it works */}
      <section className="border-t border-border bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              From creation to completion.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every Deal follows the same clear path. You stay in control at every step.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5">
                        <step.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                    </div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — Deal Workspace Preview (detailed) */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              A workspace your client actually wants to open.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every Deal has its own private workspace with chat, files, payments and a full activity timeline.
            </p>
          </div>
          <WorkspaceFeatureGrid />
        </div>
      </section>

      {/* Section 4 — Negotiation */}
      <section className="border-t border-border bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
                Negotiation becomes part of the record.
              </h2>
              <p className="mt-4 text-muted-foreground">
                No more lost DMs about price changes. Every proposal, counter-offer and acceptance is tracked and timestamped. The final agreed price becomes the Deal's authoritative price.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Structured price proposals with reasons',
                  'Counter-offers linked to original proposals',
                  'Full negotiation history preserved',
                  'Accepted price becomes authoritative',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <NegotiationPreview />
          </div>
        </div>
      </section>

      {/* Section 5 — Secure Delivery */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Delivery with access control.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Files are locked until payment clears. Every access is logged. Your work stays protected.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Lock, title: 'Protected files', desc: 'Files are stored privately and only accessible to verified deal participants.' },
              { icon: Shield, title: 'Controlled access', desc: 'Clients verify via OTP before entering the deal workspace.' },
              { icon: CreditCard, title: 'Payment-aware delivery', desc: 'Deliverables stay locked until payment is confirmed.' },
              { icon: Activity, title: 'Activity history', desc: 'Every upload, download, approval and change is logged.' },
              { icon: FileCheck, title: 'Version control', desc: 'Upload multiple versions with descriptions and approval states.' },
              { icon: Users, title: 'Verified participants', desc: 'Only the creator and the invited client can access the workspace.' },
            ].map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 mb-3">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — For freelancers */}
      <section className="border-t border-border bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Built for every kind of digital work.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {useCases.map((uc) => (
              <div
                key={uc.label}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent/50"
              >
                <span className="text-lg">{uc.icon}</span>
                {uc.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7 — Pricing Preview */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Start free. Scale when you are ready.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pay for Deal credits. Storage and transaction fees are handled separately.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? 'border-primary shadow-md ring-1 ring-primary/20'
                    : ''
                }
              >
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-display font-semibold mt-2">{plan.deals}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                  {plan.highlighted && (
                    <span className="mt-3 inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                      Most popular
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/pricing">
              <Button variant="outline">See full pricing details</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 8 — Final CTA */}
      <section className="border-t border-border bg-primary py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-balance text-3xl font-display font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Your next client project should have one place to live.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Stop juggling tools. Start managing your client work like a professional.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Create a Deal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Preview Component (hero)
// ---------------------------------------------------------------------------

function DealWorkspacePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          delt.app/deals/clinic-website
        </div>
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">
        {/* Mini sidebar */}
        <div className="hidden border-r border-border bg-muted/20 p-3 lg:block">
          <div className="space-y-1">
            {['Dashboard', 'Deals', 'Clients', 'Templates', 'Transactions', 'Storage', 'Settings'].map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  item === 'Deals' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <div className="h-3 w-3 rounded-sm bg-current opacity-60" />
                {item}
              </div>
            ))}
          </div>
        </div>
        {/* Main */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-lg">Clinic Website Redesign</h3>
              <p className="text-xs text-muted-foreground">Sarah Mitchell · BrightSmile Dental</p>
            </div>
            <DealStatusBadge status="in_progress" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold text-sm">{formatCurrency(62000)}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="font-semibold text-sm">65%</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-semibold text-sm">Sep 15</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="font-semibold text-sm text-amber-600">Pending</p>
            </div>
          </div>
          {/* Chat preview */}
          <div className="mt-4 space-y-2 rounded-lg border border-border bg-background p-3">
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">SM</div>
              <div className="flex-1">
                <p className="text-xs font-medium">Sarah Mitchell</p>
                <div className="mt-0.5 rounded-lg rounded-tl-sm bg-muted px-2.5 py-1.5 text-xs">
                  Can we also add dark mode to the booking section?
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-row-reverse">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground">AM</div>
              <div className="flex-1 flex flex-col items-end">
                <p className="text-xs font-medium">Alex Morgan</p>
                <div className="mt-0.5 rounded-lg rounded-tr-sm bg-primary px-2.5 py-1.5 text-xs text-primary-foreground">
                  Yes, I'll include it in the next version.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceFeatureGrid() {
  const features = [
    { icon: MessageSquare, title: 'Chat', desc: 'Keep all project communication in one thread with timestamps and file attachments.' },
    { icon: ArrowLeftRight, title: 'Negotiation', desc: 'Structured price proposals and counter-offers with full history.' },
    { icon: FileCheck, title: 'Files & Deliverables', desc: 'Versioned uploads with approval workflows and payment-aware locking.' },
    { icon: CreditCard, title: 'Payments', desc: 'Track payment status alongside the work with transparent fee breakdown.' },
    { icon: Activity, title: 'Activity Timeline', desc: 'Every action is logged as an immutable event — a real audit trail.' },
    { icon: Users, title: 'Client Portal', desc: 'Your client gets a focused, read-only view of the project via a private link.' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <Card key={f.title} className="h-full">
          <CardContent className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 mb-3">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NegotiationPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">PRICE PROPOSAL</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">Pending</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-sm font-semibold line-through text-muted-foreground">{formatCurrency(25000)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 rounded-lg bg-primary/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">Proposed</p>
            <p className="text-base font-bold text-primary">{formatCurrency(20000)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Reason: "Removing two additional pages."</p>
      </div>
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px w-8 bg-border" />
          Creator counters
          <div className="h-px w-8 bg-border" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">COUNTER OFFER</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Accepted</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-sm font-semibold line-through text-muted-foreground">{formatCurrency(20000)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 rounded-lg bg-primary/5 px-3 py-2">
            <p className="text-xs text-muted-foreground">Proposed</p>
            <p className="text-base font-bold text-primary">{formatCurrency(22000)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Reason: "I can keep all pages but simplify the design system."</p>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Final price agreed at {formatCurrency(22000)}</span>
      </div>
    </div>
  );
}
