'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Users,
  Zap,
  ArrowRight,
  MessageSquare,
  Mail,
  Folder,
  CreditCard,
  FileText,
  Table,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const fragmentedTools = [
  { name: 'WhatsApp', icon: MessageSquare, category: 'Communication', issue: 'Lost context & agreement drift' },
  { name: 'Email Attachments', icon: Mail, category: 'File Transfer', issue: 'Version confusion & missing files' },
  { name: 'Google Drive', icon: Folder, category: 'Storage', issue: 'Unrestricted link sharing' },
  { name: 'Payment Links', icon: CreditCard, category: 'Payments', issue: 'No delivery guarantee' },
  { name: 'PDF Invoices', icon: FileText, category: 'Billing', issue: 'Manual tracking & late payouts' },
  { name: 'Spreadsheets', icon: Table, category: 'Tracking', issue: 'Fragmented record keeping' },
];

const connectedStages = [
  { code: '01', title: 'Scope & Price', label: 'Clear terms' },
  { code: '02', title: 'Work In Progress', label: 'Milestone tracking' },
  { code: '03', title: 'Deliverable Upload', label: 'Version control' },
  { code: '04', title: 'Client Review', label: 'In-context feedback' },
  { code: '05', title: 'Approval', label: 'Sign-off' },
  { code: '06', title: 'Escrow Payment', label: 'Automated lock release' },
  { code: '07', title: 'Deal Sealed', label: 'Immutable record' },
];

const philosophyPrinciples = [
  {
    id: 'focused',
    icon: Target,
    title: 'Focused',
    shortDesc: 'One core purpose: private transactions between creator and client.',
    quote:
      'We build one thing well: the private transaction between a creator and a client. No bloat, no feature creep.',
    previewTitle: 'Single-Purpose Architecture',
    previewContent: [
      'Dedicated deal room URL per transaction',
      'No noise, no bloated project management suites',
      'Strict creator-to-client isolation',
    ],
  },
  {
    id: 'human',
    icon: Users,
    title: 'Human',
    shortDesc: 'Designed for real creators and real clients managing actual work.',
    quote:
      'DELT is built for real freelancers managing real client work. Every decision starts with the user experience.',
    previewTitle: 'Frictionless Client Onboarding',
    previewContent: [
      'No complex account setup required for clients',
      'Instant access via secure email OTP',
      'Clear, predictable milestone status UI',
    ],
  },
  {
    id: 'efficient',
    icon: Zap,
    title: 'Efficient',
    shortDesc: 'One link replacing 5 disconnected apps. Speed is a primary feature.',
    quote:
      'Less context switching. Fewer tools. One link that does the job of five apps. Speed is a feature.',
    previewTitle: 'Unified Lifecycle Engine',
    previewContent: [
      'Agreement, files, and payment in one place',
      'Instant file preview with watermark overlay',
      'Automated payout release upon client approval',
    ],
  },
];

export function AboutWorkflowConvergence() {
  const [viewMode, setViewMode] = useState<'fragmented' | 'connected'>('connected');
  const [activePrincipleId, setActivePrincipleId] = useState<string>('focused');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Continuous loop through deal lifecycle stages
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % connectedStages.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const activePrinciple =
    philosophyPrinciples.find((p) => p.id === activePrincipleId) || philosophyPrinciples[0];

  return (
    <div className="space-y-12">
      {/* Visual Narrative: Fragmented Tools -> Single DELT Deal */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-accent-brand uppercase tracking-wider mb-1">
              <Layers className="h-3.5 w-3.5" />
              Workflow Architecture
            </div>
            <h2 className="text-xl font-display font-semibold tracking-tight">
              From Scattered Chaos to One Connected Workspace
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-full bg-muted/50 border border-border/60 text-xs font-mono">
            <button
              onClick={() => setViewMode('fragmented')}
              className={cn(
                'px-3.5 py-1.5 rounded-full transition-all duration-200',
                viewMode === 'fragmented'
                  ? 'bg-destructive/15 text-destructive font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Fragmented Tools
            </button>
            <button
              onClick={() => setViewMode('connected')}
              className={cn(
                'px-3.5 py-1.5 rounded-full transition-all duration-200',
                viewMode === 'connected'
                  ? 'bg-accent-brand text-accent-brand-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              With DELT
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'fragmented' ? (
            <motion.div
              key="fragmented"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span>The Traditional Problem: 6 Disconnected Apps, No Unified State</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {fragmentedTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <motion.div
                      key={tool.name}
                      whileHover={{ y: -2 }}
                      className="p-4 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-card text-muted-foreground border border-border/40">
                          <ToolIcon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {tool.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{tool.name}</h4>
                      <p className="text-xs font-mono text-destructive/90">{tool.issue}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl bg-accent-brand/10 border border-accent-brand/30 text-accent-brand text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent-brand" />
                  <span>The DELT System: Single Connected Deal Room</span>
                </div>
                <span className="hidden sm:inline-block">Stage 0{activeStageIndex + 1} Active</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {connectedStages.map((stage, idx) => {
                  const isActive = activeStageIndex === idx;
                  return (
                    <motion.div
                      key={stage.code}
                      whileHover={{ y: -2 }}
                      className={cn(
                        'relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200',
                        isActive
                          ? 'bg-accent-brand/10 border-accent-brand/60 shadow-md'
                          : 'bg-muted/20 border-border/50'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="about-stage-bar"
                          className="absolute -top-1 left-2 right-2 h-0.5 bg-accent-brand rounded-full shadow-[0_0_6px_rgba(59,130,246,0.8)]"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="text-[10px] font-mono font-bold text-accent-brand mb-1">
                        {stage.code}
                      </span>
                      <h4 className="font-semibold text-xs mb-1 line-clamp-1">{stage.title}</h4>
                      <p className="text-[10px] font-mono text-muted-foreground line-clamp-1">
                        {stage.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Philosophy Interactive Nodes */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-accent-brand uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Product Philosophy
          </div>
          <h2 className="text-xl font-display font-semibold tracking-tight">
            Engineered Principles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            How we design every interaction, protocol, and boundary inside DELT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {philosophyPrinciples.map((principle) => {
            const isSelected = principle.id === activePrincipleId;
            const Icon = principle.icon;

            return (
              <motion.button
                key={principle.id}
                type="button"
                onClick={() => setActivePrincipleId(principle.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex flex-col items-start p-5 rounded-xl border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-brand',
                  isSelected
                    ? 'bg-accent-brand/10 border-accent-brand/60 shadow-md'
                    : 'bg-muted/30 border-border/60 hover:bg-muted/60'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg mb-3 transition-colors',
                    isSelected ? 'bg-accent-brand text-accent-brand-foreground' : 'bg-muted/60 text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-base mb-1">{principle.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{principle.shortDesc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Principle Live Spec Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePrinciple.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-border/80 bg-muted/20 p-6"
          >
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
              <div className="p-2 rounded-lg bg-accent-brand/15 border border-accent-brand/30 text-accent-brand">
                <activePrinciple.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-base">{activePrinciple.previewTitle}</h4>
                <p className="text-xs font-mono text-muted-foreground">Philosophy Implementation</p>
              </div>
            </div>

            <blockquote className="text-sm italic text-foreground mb-6 font-serif border-l-2 border-accent-brand pl-4 py-1">
              "{activePrinciple.quote}"
            </blockquote>

            <div className="space-y-2">
              {activePrinciple.previewContent.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded-lg border border-border/40"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Minimal CTA Surface */}
      <div className="bg-card/85 backdrop-blur-md rounded-2xl border border-border/80 p-8 sm:p-10 text-center shadow-xl">
        <h2 className="text-2xl font-display font-semibold tracking-tight sm:text-3xl mb-3">
          Join the freelancers building with DELT.
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          One private workspace for your deals, deliverables, and payments.
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
