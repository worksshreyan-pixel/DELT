'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const previewStages = [
  { code: '01', title: 'Scope & Terms', status: 'completed' },
  { code: '02', title: 'Milestone Delivery', status: 'active' },
  { code: '03', title: 'Client Review', status: 'pending' },
  { code: '04', title: 'Escrow Payout', status: 'locked' },
];

export function AuthProductPreview() {
  const [activeSignalIndex, setActiveSignalIndex] = useState<number>(1);

  // Subtle continuous motion signal pulse through stages 01 -> 04
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignalIndex((prev) => (prev + 1) % previewStages.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-start justify-center p-8 max-w-md w-full">
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 shadow-xl w-full space-y-6">
        {/* Workspace Security Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                Protected Deal Room
              </div>
              <div className="text-xs font-mono font-semibold">#DELT-9204</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE WORKSPACE
          </span>
        </div>

        {/* Active Deal Summary Card */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Website & Brand Redesign</span>
            <span className="text-foreground font-semibold">$3,500 USD</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <FileText className="h-3.5 w-3.5 text-amber-500" />
            <span>2 Deliverables • Escrow Protection Active</span>
          </div>
        </div>

        {/* Deal Lifecycle Stage Progression */}
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Deal Lifecycle State</span>
            <span>Stage 0{activeSignalIndex + 1}</span>
          </div>

          <div className="space-y-2">
            {previewStages.map((stage, idx) => {
              const isSignalActive = activeSignalIndex === idx;
              const isCompleted = idx === 0;

              return (
                <div
                  key={stage.code}
                  className={cn(
                    'relative flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all duration-200',
                    isSignalActive
                      ? 'bg-amber-500/10 border-amber-500/60 text-foreground shadow-sm'
                      : isCompleted
                      ? 'bg-muted/20 border-border/40 text-muted-foreground'
                      : 'bg-muted/10 border-border/30 text-muted-foreground/60'
                  )}
                >
                  {isSignalActive && (
                    <motion.div
                      layoutId="auth-stage-signal"
                      className="absolute -left-1 top-2 bottom-2 w-0.5 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        isSignalActive ? 'text-amber-500' : 'text-muted-foreground/70'
                      )}
                    >
                      {stage.code}
                    </span>
                    <span>{stage.title}</span>
                  </div>

                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : isSignalActive ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="pt-2 border-t border-border/50 text-center">
          <p className="text-[11px] font-mono text-muted-foreground">
            Row-Level Security & Encrypted Session Cookies Enforced
          </p>
        </div>
      </div>
    </div>
  );
}
