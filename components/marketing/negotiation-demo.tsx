'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, DollarSign, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/lib/plans';
import { cn } from '@/lib/utils';

export function NegotiationDemo() {
  const [offerValue, setOfferValue] = useState<number>(22000);
  const [activePreset, setActivePreset] = useState<'client' | 'counter' | 'agreed'>('agreed');

  const presets = [
    { id: 'client', label: 'Client Proposal', price: 20000, reason: 'Requesting budget adjustment by removing non-essential revisions' },
    { id: 'counter', label: 'Creator Counter', price: 25000, reason: 'Including full production design & high-res vector source files' },
    { id: 'agreed', label: 'Accepted Agreement', price: 22000, reason: 'Agreed on 2 core deliverables with 1 revision cycle included' },
  ];

  const currentPreset = presets.find((p) => p.id === activePreset) || presets[2];

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
          <DollarSign className="h-4 w-4 text-amber-500" />
          <span>Interactive Price Proposal Engine</span>
        </div>
        <span className="rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 font-mono text-[10px] font-bold border border-amber-500/20">
          DEMO SIMULATION
        </span>
      </div>

      {/* Preset Selector */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40">
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
                'rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium transition-all text-center',
                isActive
                  ? 'bg-card text-foreground font-bold shadow-xs border border-border/60'
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
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase">
              {currentPreset.label}
            </span>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-mono font-bold',
                currentPreset.id === 'agreed'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              )}
            >
              {currentPreset.id === 'agreed' ? 'ACCEPTED & LOCKED' : 'PENDING REVIEW'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-border/60 bg-card p-3 font-mono">
              <p className="text-[10px] text-muted-foreground">Original Quote</p>
              <p className="text-xs font-semibold line-through text-muted-foreground">
                {formatCurrency(25000)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 font-mono">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Proposed Price
              </p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(offerValue)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border/60">
            <MessageSquare className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="italic">&ldquo;{currentPreset.reason}&rdquo;</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Final agreed banner */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          DELT authoritative contract price: {formatCurrency(22000)}
        </span>
      </div>
    </div>
  );
}
