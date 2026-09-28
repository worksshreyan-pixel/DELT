'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  KeyRound,
  Lock,
  FileCheck,
  Activity,
  CheckCircle2,
  XCircle,
  Cpu,
  Server,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SecurityNode {
  id: string;
  code: string;
  title: string;
  shortDesc: string;
  icon: React.ElementType;
  tag: string;
  details: {
    overview: string;
    specs: string[];
    mechanisms: string[];
    serverEnforced: boolean;
  };
}

const securityNodes: SecurityNode[] = [
  {
    id: 'otp',
    code: '01',
    title: 'Verified Access Control',
    shortDesc: 'Private deal link paired with 6-digit email OTP verification on access.',
    icon: KeyRound,
    tag: 'AUTHENTICATION',
    details: {
      overview:
        'Clients access deals through a private link plus email verification via 6-digit OTP. No unguessable URL is treated as a security boundary on its own.',
      specs: [
        '6-digit time-sensitive OTP verification',
        'Session expiry & auto-invalidation',
        'No public unauthenticated routes',
      ],
      mechanisms: [
        'Email OTP verification code',
        'Encrypted session token cookie',
        'Rate-limited access attempts',
      ],
      serverEnforced: true,
    },
  },
  {
    id: 'scoped',
    code: '02',
    title: 'Participant-Based Isolation',
    shortDesc: 'Data-layer RLS policies restricting deal access strictly to creator and client.',
    icon: Lock,
    tag: 'AUTHORIZATION',
    details: {
      overview:
        'Only the creator and the invited client can access a deal workspace. Authorization is enforced at the data layer, not by hiding buttons in the UI.',
      specs: [
        'Row-Level Security (RLS) database policies',
        'Participant-isolated deal scopes',
        'Zero cross-tenant data leakage',
      ],
      mechanisms: [
        'Database query scope validation',
        'Participant ID checking',
        'Server-side JWT verification',
      ],
      serverEnforced: true,
    },
  },
  {
    id: 'deliverables',
    code: '03',
    title: 'Private File Storage',
    shortDesc: 'Files housed in private storage buckets, delivered via short-lived signed URLs.',
    icon: FileCheck,
    tag: 'STORAGE',
    details: {
      overview:
        'Deliverables are stored in private buckets, not public URLs. Access is authorized per deal participant and delivered through temporary signed URLs.',
      specs: [
        'Private non-public storage buckets',
        'Time-bounded signed URL generation',
        'Full content disposition protection',
      ],
      mechanisms: [
        'Private storage bucket ACL',
        'Signed URL expiration',
        'Authorized download proxying',
      ],
      serverEnforced: true,
    },
  },
  {
    id: 'audit',
    code: '04',
    title: 'Immutable Audit Trail',
    shortDesc: 'Every action — from creation to file upload to payment — logged sequentially.',
    icon: Activity,
    tag: 'LOGGING',
    details: {
      overview:
        'Every action — from deal creation to file upload to payment — is logged as an immutable event in the deal activity timeline.',
      specs: [
        'Sequential activity event logging',
        'Timestamped participant actions',
        'Tamper-evident audit timeline',
      ],
      mechanisms: [
        'Server-side event dispatching',
        'Structured event metadata',
        'Immutable timeline persistence',
      ],
      serverEnforced: true,
    },
  },
  {
    id: 'payment',
    code: '05',
    title: 'Payment-Aware Delivery',
    shortDesc: 'Deliverables remain locked server-side until payment is confirmed by webhook.',
    icon: Shield,
    tag: 'PAYMENT GATE',
    details: {
      overview:
        'Files remain locked until payment is confirmed server-side. The client cannot unlock deliverables through frontend state alone.',
      specs: [
        'Server-side payment verification',
        'Automated release lock release',
        'Protected asset download gate',
      ],
      mechanisms: [
        'Razorpay webhook validation',
        'Atomic database state update',
        'Signed download link authorization',
      ],
      serverEnforced: true,
    },
  },
];

const negativeConstraints = [
  'We do not rely on hiding buttons for authorization.',
  'We do not trust client-side payment state as confirmation.',
  'We do not expose private files through public URLs.',
  'We do not use predictable IDs as access credentials.',
  'We do not store service-role credentials in the browser.',
];

export function SecurityArchitectureInteractive() {
  const [userSelectedIndex, setUserSelectedIndex] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const DURATION = 12000; // 12 seconds total one-time sequence (~2.4s per stage)

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // One-time sequence loop (Stage 01 -> Stage 02 -> Stage 03 -> Stage 04 -> Stage 05 -> STOP)
  useEffect(() => {
    if (reducedMotion) return;

    let animationFrameId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / DURATION);

      setAnimProgress(progress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [reducedMotion]);

  // SINGLE AUTHORITATIVE SOURCE OF TRUTH FOR ACTIVE STAGE (0 to 4)
  const activeStageIndex =
    userSelectedIndex !== null
      ? userSelectedIndex
      : reducedMotion
      ? 4
      : Math.min(4, Math.floor(animProgress * 5));

  // Signal position percentage along horizontal track (10% center of dot 1 -> 90% center of dot 5)
  const signalProgress =
    userSelectedIndex !== null
      ? 10 + (userSelectedIndex / 4) * 80
      : reducedMotion
      ? 90
      : 10 + animProgress * 80;

  // DERIVED ACTIVE NODE CONTENT — 100% SYNCHRONIZED WITH ACTIVE STAGE
  const activeNode = securityNodes[activeStageIndex];

  const handleCardClick = (idx: number) => {
    setUserSelectedIndex(idx);
  };

  return (
    <div className="space-y-12">
      {/* Interactive Node Selector & Visual Architecture Pipeline */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-accent-brand uppercase tracking-wider mb-1">
              <Cpu className="h-3.5 w-3.5" />
              Interactive Security Architecture
            </div>
            <h2 className="text-xl font-display font-semibold tracking-tight">
              5-Stage Data Protection Pipeline
            </h2>
          </div>
        </div>

        {/* Continuous Horizontal Signal Track */}
        <div className="relative w-full mb-6">
          <div className="h-1.5 w-full bg-border/40 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-brand/10 via-accent-brand/25 to-accent-brand/10" />
            {!reducedMotion && (
              <div
                className="absolute top-0 bottom-0 rounded-full bg-accent-brand shadow-[0_0_12px_#3B82F6,0_0_24px_#3B82F6] transition-none"
                style={{
                  left: `${signalProgress}%`,
                  width: '48px',
                  transform: 'translateX(-50%)',
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.3) 30%, #3B82F6 100%)',
                }}
              />
            )}
          </div>

          {/* Node dots positioned over center of each column (10%, 30%, 50%, 70%, 90%) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-[10%] pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  activeStageIndex === i
                    ? 'bg-accent-brand ring-4 ring-accent-brand/30 scale-125 shadow-[0_0_12px_#3B82F6]'
                    : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>
        </div>

        {/* Pipeline Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 relative">
          {securityNodes.map((node, idx) => {
            const isActive = activeStageIndex === idx;
            const Icon = node.icon;

            return (
              <motion.button
                key={node.id}
                type="button"
                onClick={() => handleCardClick(idx)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-brand',
                  isActive
                    ? 'bg-accent-brand/15 border-accent-brand/70 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'bg-muted/30 border-border/60 hover:bg-muted/60 hover:border-border'
                )}
              >
                {/* Active Stage Indicator Bar */}
                {isActive && (
                  <motion.div
                    layoutId="signal-bar"
                    className="absolute -top-1 left-3 right-3 h-0.5 bg-accent-brand rounded-full shadow-[0_0_10px_rgba(59,130,246,0.9)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="flex items-center justify-between w-full mb-3">
                  <span
                    className={cn(
                      'text-xs font-mono font-bold transition-colors',
                      isActive ? 'text-accent-brand' : 'text-muted-foreground'
                    )}
                  >
                    {node.code}
                  </span>
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-accent-brand text-accent-brand-foreground shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                        : 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'animate-pulse')} />
                  </div>
                </div>

                <div className="font-semibold text-xs mb-1 line-clamp-1">{node.title}</div>
                <div className="text-[11px] font-mono text-muted-foreground tracking-tight">
                  {node.tag}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Node Technical Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border/80 bg-muted/20 p-5 sm:p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-brand/15 border border-accent-brand/30 text-accent-brand">
                  <activeNode.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-accent-brand font-bold">
                      STAGE {activeNode.code}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">/</span>
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {activeNode.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-semibold">{activeNode.title}</h3>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium self-start lg:self-auto">
                <CheckCircle2 className="h-3.5 w-3.5" />
                SERVER ENFORCED
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {activeNode.details.overview}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-accent-brand" />
                  Technical Specifications
                </div>
                <div className="space-y-1.5">
                  {activeNode.details.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground bg-card/60 p-2.5 rounded-lg border border-border/40 font-mono"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-accent-brand shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-accent-brand" />
                  Enforcement Mechanisms
                </div>
                <div className="space-y-1.5">
                  {activeNode.details.mechanisms.map((mech, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground bg-card/60 p-2.5 rounded-lg border border-border/40 font-mono"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-brand shrink-0 mt-1.5" />
                      <span>{mech}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Negative Constraints Matrix ("What We Do Not Do") */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-destructive uppercase tracking-wider mb-1">
            <XCircle className="h-3.5 w-3.5" />
            Security Invariants
          </div>
          <h2 className="text-xl font-display font-semibold tracking-tight">What We Do Not Do</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Security policies enforced strictly at the database and application boundary.
          </p>
        </div>

        <div className="space-y-3">
          {negativeConstraints.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ x: 4 }}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3.5 transition-colors hover:bg-muted/40"
            >
              <div className="p-1 rounded-full bg-destructive/10 text-destructive shrink-0">
                <XCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-mono text-muted-foreground">{item}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
          <p className="text-xs font-mono text-muted-foreground">
            DELT is designed for clean integration with Supabase Auth, Row-Level Security (RLS), private storage buckets, and signed URLs. Backend enforcement is built directly into the data access layer.
          </p>
        </div>
      </div>

      {/* Minimal CTA Surface */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-8 sm:p-10 text-center shadow-xl">
        <h2 className="text-2xl font-display font-semibold tracking-tight sm:text-3xl mb-3">
          Your work deserves a secure workspace.
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Experience participant-isolated deal execution built for creators and clients.
        </p>
        <Link href="/signup">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
            <Button size="lg" className="rounded-full gap-2 font-mono">
              Get started
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
