'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  DollarSign,
  FolderLock,
  CheckCircle2,
  Lock,
  Clock,
  Activity,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Download,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DealWorkspaceHero() {
  const [activeTab, setActiveTab] = useState<'scope' | 'negotiation' | 'files' | 'review' | 'payment' | 'activity'>('scope');

  // Interactive negotiation state for live demo
  const [proposedPrice, setProposedPrice] = useState<number>(22500);
  const [isAccepted, setIsAccepted] = useState<boolean>(true);

  // File preview interactive selection
  const [selectedFileVer, setSelectedFileVer] = useState<'v1' | 'v2' | 'final'>('final');

  // Ambient live ticker event index
  const [tickerIdx, setTickerIdx] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport IntersectionObserver to pause offscreen continuous animation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ambient activity ticker cycle (only runs when visible in viewport)
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTickerIdx((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const tickerEvents = [
    { text: 'Stark Corp deposited ₹22,500 in Escrow Safeguard', status: 'Secured' },
    { text: 'Apex Studio uploaded app-production-final.zip (v3.0)', status: 'Payment Locked' },
    { text: 'OTP Authentication verified for client access session', status: 'Verified' },
  ];

  const currentTicker = tickerEvents[tickerIdx];

  return (
    <motion.div
      ref={containerRef}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative w-full rounded-2xl border border-border/80 bg-card/90 p-3 sm:p-5 shadow-2xl backdrop-blur-xl transition-all duration-300"
    >
      {/* Visual Window Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
              DLT-8V26RW75
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              LIVE WORKSPACE
            </span>
          </div>
        </div>

        {/* Continuous Live Activity Ticker */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-mono text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="truncate max-w-[280px]"
            >
              {currentTicker.text}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Navigation Sidebar / Tabs */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
          {[
            { id: 'scope', label: '1. Scope & Plan', icon: Layers, badge: '3 items' },
            { id: 'negotiation', label: '2. Negotiation', icon: DollarSign, badge: isAccepted ? 'Agreed' : 'Pending' },
            { id: 'files', label: '3. Deliverables', icon: FolderLock, badge: 'v3 Final' },
            { id: 'review', label: '4. Client Review', icon: CheckCircle2, badge: 'Approved' },
            { id: 'payment', label: '5. Escrow Payment', icon: Lock, badge: 'Secured' },
            { id: 'activity', label: '6. Audit Trail', icon: Activity, badge: 'Live' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'relative flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-left whitespace-nowrap shrink-0 lg:shrink cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-mono font-medium',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted-foreground/15 text-muted-foreground'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Tab Interactive Panel */}
        <div className="lg:col-span-9 rounded-xl border border-border/60 bg-card p-4 sm:p-5 min-h-[340px] flex flex-col justify-between shadow-xs">
          <AnimatePresence mode="wait">
            {/* 1. SCOPE TAB */}
            {activeTab === 'scope' && (
              <motion.div
                key="scope"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">
                      E-Commerce Web Application & Brand Identity
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Structured scope agreed by Apex Studio and Stark Corp
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground bg-muted/40 border border-border px-2.5 py-1 rounded-md">
                    Total: ₹22,500
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { title: 'Milestone 1: Wireframes & Brand Kit', amount: '₹7,500', status: 'Completed', date: 'Sep 12' },
                    { title: 'Milestone 2: Next.js Frontend & Product Catalog', amount: '₹10,000', status: 'In Review', date: 'Sep 16' },
                    { title: 'Milestone 3: Stripe Payment Integration & Launch', amount: '₹5,000', status: 'Pending', date: 'Sep 20' },
                  ].map((m, idx) => (
                    <div
                      key={m.title}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3 text-xs transition-all hover:border-amber-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{m.title}</p>
                          <p className="text-[11px] text-muted-foreground">Due {m.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-foreground">{m.amount}</span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium font-mono',
                            m.status === 'Completed'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : m.status === 'In Review'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. NEGOTIATION TAB */}
            {activeTab === 'negotiation' && (
              <motion.div
                key="negotiation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-border/40 pb-3">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Interactive Price Offer & Negotiation
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Try adjusting the proposal slider to simulate real-time price counter-offers.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Client Budget Proposal:</span>
                    <span className="font-mono text-sm font-bold text-foreground">₹20,000</span>
                  </div>

                  {/* Interactive Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-mono">
                      <span>₹20,000</span>
                      <span className="font-bold text-foreground text-sm">
                        Selected Counter: ₹{proposedPrice.toLocaleString('en-IN')}
                      </span>
                      <span>₹30,000</span>
                    </div>
                    <input
                      type="range"
                      min={20000}
                      max={30000}
                      step={500}
                      value={proposedPrice}
                      onChange={(e) => {
                        setProposedPrice(Number(e.target.value));
                        setIsAccepted(Number(e.target.value) === 22500);
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-muted-foreground font-mono">
                      Status:{' '}
                      {isAccepted ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ACCEPTED & LOCKED AT ₹22,500
                        </span>
                      ) : (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          PROPOSAL PENDING APPROVAL
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setProposedPrice(22500);
                        setIsAccepted(true);
                      }}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-transform active:scale-95"
                    >
                      {isAccepted ? 'Price Accepted' : 'Accept ₹22,500'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground italic font-mono">
                  Note: In DELT workspaces, every price offer is recorded with reasoning and creates an immutable contract audit record.
                </p>
              </motion.div>
            )}

            {/* 3. FILES TAB */}
            {activeTab === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-border/40 pb-3">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Payment-Gated Deliverables & Revision History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Files are protected until payment clears. Click versions to inspect.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { ver: 'v1', name: 'app-wireframes-v1.zip', size: '14.2 MB', status: 'Feedback Given', time: 'Sep 12' },
                    { ver: 'v2', name: 'nextjs-build-v2.zip', size: '48.6 MB', status: 'Reviewed', time: 'Sep 15' },
                    { ver: 'final', name: 'app-production-final.zip', size: '82.1 MB', status: 'Payment Locked', time: 'Just now' },
                  ].map((f) => {
                    const isSelected = selectedFileVer === f.ver;
                    return (
                      <button
                        key={f.ver}
                        onClick={() => setSelectedFileVer(f.ver as any)}
                        className={cn(
                          'rounded-xl border p-3 text-left transition-all',
                          isSelected
                            ? 'border-foreground/40 bg-muted/40 shadow-xs'
                            : 'border-border/60 bg-muted/20 hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-foreground uppercase">{f.ver}</span>
                          <span className="text-[10px] text-muted-foreground">{f.time}</span>
                        </div>
                        <p className="font-mono text-xs font-semibold text-foreground truncate">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{f.size}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium font-mono">
                          {f.ver === 'final' ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                              <Lock className="h-3 w-3" /> Locked until payment
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{f.status}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Selected: <strong>app-production-final.zip</strong> (Payment Escrow Protection Active)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                    SHA-256 Verified
                  </span>
                </div>
              </motion.div>
            )}

            {/* 4. REVIEW TAB */}
            {activeTab === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-border/40 pb-3">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Structured Approval & Sign-Off
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Client reviews deliverables and issues cryptographic sign-off.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-semibold text-xs sm:text-sm">Client Approval State: Approved</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">Timestamp: 2026-09-17 14:22 UTC</span>
                  </div>

                  <p className="text-xs text-muted-foreground bg-card p-3 rounded-md border border-border/40">
                    "All responsive layouts and checkout payment flows tested cleanly. Approved for escrow payout release."
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
                    <span>Approved by: Stark Corp (OTP Verified)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Signature: 0x8f...4c19</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. PAYMENT TAB */}
            {activeTab === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-border/40 pb-3">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Escrow Protection & Automated Payout
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Funds are held safely in escrow until the client approves the work.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono font-medium">
                      Escrow Deposit Status
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-foreground">₹22,500</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">FUNDS SECURED</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Client deposited funds before creator commenced final delivery.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono font-medium">
                      Creator Payout Release
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">READY</span>
                      <span className="text-xs text-muted-foreground font-mono">(Instant transfer)</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Upon approval, files unlock for client and funds release to creator instantly.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-border/40 pb-3">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    Immutable Audit Trail Log
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Every proposal, file version, review, and payment event is permanently logged.
                  </p>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  {[
                    { time: '14:22:04', event: 'Client Stark Corp approved final milestone (0x8f...4c19)', type: 'success' },
                    { time: '14:20:10', event: 'Creator uploaded app-production-final.zip (82.1 MB)', type: 'info' },
                    { time: '12:05:44', event: 'Counter proposal accepted: Agreed price ₹22,500', type: 'warning' },
                    { time: '10:00:00', event: 'Deal workspace created: DLT-8V26RW75', type: 'default' },
                  ].map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded border border-border/40 bg-muted/40 px-3 py-2 text-foreground/90"
                    >
                      <span className="text-muted-foreground text-[10px]">{log.time}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{log.event}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Interactive Bar */}
          <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Click tabs above to simulate actual DELT workspace interactions</span>
            </div>
            <div>
              DELT Deal Engine v2.4
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
