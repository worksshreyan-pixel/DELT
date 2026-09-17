'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ShieldCheck, Lock, FileText, CreditCard, UserCheck, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const NODES = [
  {
    id: 'otp',
    title: 'OTP Access Control',
    icon: KeyRound,
    badge: 'No Password Friction',
    desc: 'Clients access the deal workspace via automated single-use passcode. No sign-up wall or account creation overhead.',
    specs: ['6-digit OTP verification', 'Session expiry in 24 hours', 'Device-bound authorization'],
  },
  {
    id: 'scoped',
    title: 'Scoped Permissions',
    icon: UserCheck,
    badge: 'Zero External Access',
    desc: 'Only the invited creator and verified client can view or interact with the deal workspace.',
    specs: ['Role-based access matrix', 'Participant-only encryption', 'Zero third-party exposure'],
  },
  {
    id: 'files',
    title: 'Protected Deliverables',
    icon: Lock,
    badge: 'Payment-Gated Vault',
    desc: 'Uploaded assets are stored in isolated encrypted buckets and remain locked until payment confirmation.',
    specs: ['SHA-256 integrity verification', 'Escrow-gated download URLs', 'Versioned asset preservation'],
  },
  {
    id: 'audit',
    title: 'Immutable Audit Trail',
    icon: FileText,
    badge: 'Cryptographic Record',
    desc: 'Every milestone approval, price proposal, message, and file upload is logged with cryptographic timestamps.',
    specs: ['Timestamped event logging', 'Non-repudiable transaction history', 'Exportable deal summary'],
  },
  {
    id: 'escrow',
    title: 'Escrow Payment Safeguard',
    icon: CreditCard,
    badge: 'Two-Way Trust',
    desc: 'Client funds are deposited in escrow before final delivery and released instantly upon client approval.',
    specs: ['Pre-funded deal escrow', 'Automated instant payouts', 'Transparent platform processing'],
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
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
              Security Architecture
            </p>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Deal isolation & payment-gated delivery.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Hover or click security nodes to inspect DELT&apos;s contextual access control architecture.
            </p>
          </motion.div>
        </div>

        {/* Security Interactive Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Node Flow (Left) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between font-mono text-xs text-muted-foreground border-b border-border/40 pb-2">
              <span className="font-semibold text-foreground">Creator Side</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">Client Side</span>
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
                      ? 'border-amber-500/80 bg-card/95 shadow-md ring-1 ring-amber-500/20 backdrop-blur-md'
                      : 'border-border/80 bg-card/90 hover:bg-card hover:border-foreground/30 shadow-xs backdrop-blur-md'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-amber-500' : 'text-muted-foreground')} />
                    <span className={cn('text-xs sm:text-sm font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                      {node.title}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/80">
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
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-lg text-foreground">{selected.title}</h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {selected.badge}
                  </span>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                  {selected.desc}
                </p>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Technical Specifications
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
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

            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>DELT Deal Guard Architecture</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
