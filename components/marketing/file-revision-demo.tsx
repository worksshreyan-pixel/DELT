'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, Lock, CheckCircle2, AlertCircle, ArrowDown, Download, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const VERSIONS = [
  {
    ver: 'website-v1.zip',
    num: 'v1.0',
    date: 'Sep 12, 2026',
    size: '24.5 MB',
    status: 'Changes Requested',
    feedback: 'Mobile navigation menu needs smooth spring physics and dark mode contrast adjustment.',
    statusColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    locked: false,
  },
  {
    ver: 'website-v2.zip',
    num: 'v2.0',
    date: 'Sep 15, 2026',
    size: '31.2 MB',
    status: 'Reviewed',
    feedback: 'Mobile navigation looks great! Final polish requested on payment checkout buttons.',
    statusColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    locked: false,
  },
  {
    ver: 'website-final.zip',
    num: 'v3.0 Final',
    date: 'Sep 17, 2026',
    size: '48.9 MB',
    status: 'Approved & Payment Gated',
    feedback: 'All deliverables approved by Stark Corp. File download locked until escrow payout releases.',
    statusColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    locked: true,
  },
];

export function FileRevisionDemo() {
  const [selectedVer, setSelectedVer] = useState<number>(2); // Default to v3 Final

  const active = VERSIONS[selectedVer];

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
              Deliverables & Revisions
            </p>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Version history that protects your work.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              No more lost files or unverified revisions. Every upload is versioned, feedback is logged, and final deliverables stay payment-gated until funds clear.
            </p>
          </motion.div>
        </div>

        {/* Interactive Version Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Version Stack (Left) */}
          <div className="lg:col-span-5 space-y-3">
            {VERSIONS.map((v, idx) => {
              const isSelected = selectedVer === idx;
              return (
                <div key={v.ver} className="space-y-2">
                  <button
                    onClick={() => setSelectedVer(idx)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer',
                      isSelected
                        ? 'border-foreground/50 bg-card shadow-md ring-1 ring-border'
                        : 'border-border/60 bg-card/50 hover:bg-card hover:border-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className={cn('h-5 w-5', isSelected ? 'text-amber-500' : 'text-muted-foreground')} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">{v.ver}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">({v.num})</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{v.date} • {v.size}</p>
                      </div>
                    </div>
                    <span className={cn('font-mono text-[10px] font-bold px-2 py-0.5 rounded border', v.statusColor)}>
                      {v.status}
                    </span>
                  </button>

                  {idx < VERSIONS.length - 1 && (
                    <div className="flex justify-center my-1">
                      <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Version Detail Card (Right) */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card p-6 shadow-xl min-h-[320px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.ver}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-mono font-bold text-base text-foreground">{active.ver}</h3>
                    <p className="text-xs text-muted-foreground">Uploaded by Apex Studio on {active.date}</p>
                  </div>
                  <span className={cn('font-mono text-xs font-bold px-2.5 py-1 rounded border', active.statusColor)}>
                    {active.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase">Client Feedback Record</span>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs text-foreground/90 leading-relaxed italic">
                      &ldquo;{active.feedback}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>SHA-256 Checksum: e3b0c44298fc1c149afbf4c8996fb924...</span>
                  </div>
                  {active.locked ? (
                    <span className="flex items-center gap-1 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      <Lock className="h-3.5 w-3.5" /> PAYMENT LOCKED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> UNLOCKED
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-3 border-t border-border/40 text-xs text-muted-foreground font-mono">
              Click any version on the left to inspect file relationship and lock status.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
