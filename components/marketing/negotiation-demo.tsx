'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, DollarSign, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/lib/plans';
import { cn } from '@/lib/utils';

export function NegotiationDemo() {
  const [offerValue, setOfferValue] = useState<number>(56000);
  const [activePreset, setActivePreset] = useState<'creator' | 'client' | 'counter' | 'agreed'>('agreed');

  const presets = [
    { id: 'creator', label: 'Creator Initial', price: 60000, reason: 'Initial proposal for full e-commerce design, development & launch' },
    { id: 'client', label: 'Client Offer', price: 52000, reason: 'Requesting budget adjustment for initial phase delivery' },
    { id: 'counter', label: 'Creator Counter', price: 56000, reason: 'Compromise including core features with 1 revision round' },
    { id: 'agreed', label: 'Agreed Contract', price: 56000, reason: 'Agreed on ₹56,000 with clear milestone deliverables' },
  ];

  const currentPreset = presets.find((p) => p.id === activePreset) || presets[3];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <DollarSign className="h-4 w-4 text-accent-brand" />
          <span>Structured Negotiation Engine</span>
        </div>
        <span className="rounded bg-accent-brand/10 text-accent-brand px-2.5 py-0.5 text-xs font-semibold border border-accent-brand/20">
          Interactive Demo
        </span>
      </div>

      {/* Preset Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setActivePreset(p.id as any);
                setOfferValue(p.price);
              }}
              className={cn(
                'rounded-lg px-2 py-1.5 text-xs font-medium transition-all text-center cursor-pointer',
                isActive
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Proposal Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPreset.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {currentPreset.label}
            </span>
            <span
              className={cn(
                'rounded px-2.5 py-0.5 text-xs font-semibold',
                currentPreset.id === 'agreed'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              )}
            >
              {currentPreset.id === 'agreed' ? 'Agreed & Locked' : 'Pending Review'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-border/60 bg-card p-3">
              <p className="text-[11px] text-muted-foreground font-medium">Initial Quote</p>
              <p className="text-xs font-semibold line-through text-muted-foreground">
                {formatCurrency(60000)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Proposed Price
              </p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(offerValue)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border/60">
            <MessageSquare className="h-3.5 w-3.5 text-accent-brand shrink-0 mt-0.5" />
            <p className="italic font-normal">&ldquo;{currentPreset.reason}&rdquo;</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Final agreed banner */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          DELT authoritative deal price locked at {formatCurrency(56000)}
        </span>
      </div>
    </div>
  );
}
