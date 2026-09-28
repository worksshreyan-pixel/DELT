'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ShieldCheck, Lock, FileText, CreditCard, UserCheck, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const NODES = [
  {
    id: 'otp',
    title: 'Email OTP Authentication',
    icon: KeyRound,
    badge: 'No Password Friction',
    desc: 'Clients open deal workspaces via single-use 6-digit email passcodes. No password friction or mandatory account creation.',
    specs: ['6-digit email verification', 'Timed session security', 'Device-scoped authorization'],
  },
  {
    id: 'scoped',
    title: 'Private Deal Workspaces',
    icon: UserCheck,
    badge: 'Deal-Scoped Authorization',
    desc: 'Each deal workspace is strictly restricted to the creator and invited client. External users cannot view project data.',
    specs: ['Role-based participant access', 'Deal-isolated data boundary', 'Private client session tokens'],
  },
  {
    id: 'files',
    title: 'Protected File Storage',
    icon: Lock,
    badge: 'Payment-Gated Vault',
    desc: 'Uploaded assets are stored in protected storage buckets and remain payment-locked until client approval and payment completion.',
    specs: ['Watermarked preview modes', 'Payment-gated download URLs', 'Versioned file history'],
  },
  {
    id: 'audit',
    title: 'Activity History Log',
    icon: FileText,
    badge: 'Audit Trail',
    desc: 'Every proposal, price agreement, revision upload, and approval event is permanently logged in a clean activity record.',
    specs: ['Timestamped activity logging', 'Verifiable milestone approvals', 'Exportable summary records'],
  },
  {
    id: 'payment',
    title: 'Secure Payment Processing',
    icon: CreditCard,
    badge: 'Automated Payouts',
    desc: 'Payments are processed securely, holding funds safely until deliverables are approved and releasing payouts to the creator instantly.',
    specs: ['Integrated payment gateway', 'Automated instant payouts', 'Transparent fee structure'],
  },
];

export function SecuritySection() {
  const [activeNode, setActiveNode] = useState<string>('otp');

  const selected = NODES.find((n) => n.id === activeNode) || NODES[0];

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
              <Shield className="h-3.5 w-3.5" />
              <span>Trust & Security</span>
            </div>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl text-foreground">
              Built for secure client transactions.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Explore how DELT protects deal privacy, file access, and payment workflows.
            </p>
          </motion.div>
        </div>

        {/* Security Interactive Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Node Flow (Left) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold border-b border-border/40 pb-2">
              <span>Creator Workflow</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Client Experience</span>
            </div>

            {NODES.map((node) => {
              const Icon = node.icon;
              const isActive = activeNode === node.id;
              return (
                <motion.button
                  key={node.id}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setActiveNode(node.id)}
                  onClick={() => setActiveNode(node.id)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                    isActive
                      ? 'border-accent-brand/80 bg-card/95 shadow-md ring-1 ring-accent-brand/20 backdrop-blur-md'
                      : 'border-border/80 bg-card/90 hover:bg-card hover:border-foreground/30 shadow-xs backdrop-blur-md'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-accent-brand' : 'text-muted-foreground')} />
                    <span className={cn('text-xs sm:text-sm font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {node.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {node.badge}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Detailed Security Inspector Card (Right) */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 shadow-xl min-h-[340px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-accent-brand" />
                    <h3 className="font-semibold text-lg text-foreground">{selected.title}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-accent-brand/10 text-accent-brand border border-accent-brand/20">
                    {selected.badge}
                  </span>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                  {selected.desc}
                </p>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Core Security Features
                  </span>
                  <div className="space-y-1.5 text-xs font-medium">
                    {selected.specs.map((spec) => (
                      <div key={spec} className="flex items-center gap-2 rounded bg-muted/30 border border-border/40 px-3 py-2 text-foreground/90">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-semibold">
              <span>DELT Deal Guard Architecture</span>
              <span className="text-emerald-600 dark:text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
