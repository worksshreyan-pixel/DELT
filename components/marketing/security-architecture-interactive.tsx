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
  const [activeNodeId, setActiveNodeId] = useState<string>('otp');
  const [activeSignalIndex, setActiveSignalIndex] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  // Continuous signal pulse moving through 01 -> 05
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveSignalIndex((prev) => (prev + 1) % securityNodes.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const activeNode = securityNodes.find((n) => n.id === activeNodeId) || securityNodes[0];

  return (
    <div className="space-y-12">
      {/* Interactive Node Selector & Visual Architecture Pipeline */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider mb-1">
              <Cpu className="h-3.5 w-3.5" />
              Interactive Security Architecture
            </div>
            <h2 className="text-xl font-display font-semibold tracking-tight">
              5-Stage Data Protection Pipeline
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Continuous Signal Loop: Active Stage 0{activeSignalIndex + 1}
          </div>
        </div>

        {/* Pipeline Nodes Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-8 relative"
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          {securityNodes.map((node, idx) => {
            const isSelected = node.id === activeNodeId;
            const isSignalActive = activeSignalIndex === idx;
            const Icon = node.icon;

            return (
              <motion.button
                key={node.id}
                type="button"
                onClick={() => {
                  setActiveNodeId(node.id);
                  setActiveSignalIndex(idx);
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                    : 'bg-muted/30 border-border/60 hover:bg-muted/60 hover:border-border'
                )}
              >
                {/* Continuous Signal Indicator Bar */}
                {isSignalActive && (
                  <motion.div
                    layoutId="signal-bar"
                    className="absolute -top-1 left-3 right-3 h-0.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="flex items-center justify-between w-full mb-3">
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {node.code}
                  </span>
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      isSelected
                        ? 'bg-amber-500 text-black'
                        : 'bg-muted/60 text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
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
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500">
                  <activeNode.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-500 font-bold">
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
                  <Server className="h-3.5 w-3.5 text-amber-500" />
                  Technical Specifications
                </div>
                <div className="space-y-1.5">
                  {activeNode.details.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground bg-card/60 p-2.5 rounded-lg border border-border/40 font-mono"
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-amber-500" />
                  Enforcement Mechanisms
                </div>
                <div className="space-y-1.5">
                  {activeNode.details.mechanisms.map((mech, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground bg-card/60 p-2.5 rounded-lg border border-border/40 font-mono"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
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
