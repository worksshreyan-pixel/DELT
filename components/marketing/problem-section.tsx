'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { MessageSquare, FolderCheck, DollarSign, FileSpreadsheet, FileText, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOLS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp DMs',
    deltCapability: 'DELT Deal Chat',
    icon: MessageSquare,
    desc: 'Structured, timestamped deal messages in one workspace',
    baseAngle: 0,
    radius: 140,
  },
  {
    id: 'drive',
    label: 'Google Drive',
    deltCapability: 'DELT Payment-Gated Files',
    icon: FolderCheck,
    desc: 'Versioned deliverables locked until client payment clears',
    baseAngle: 60,
    radius: 140,
  },
  {
    id: 'payments',
    label: 'Payment Links',
    deltCapability: 'DELT Escrow Safeguard',
    icon: DollarSign,
    desc: 'Transparent deposit holding and instant automated payouts',
    baseAngle: 120,
    radius: 140,
  },
  {
    id: 'sheets',
    label: 'Spreadsheets',
    deltCapability: 'DELT Structured Scope',
    icon: FileSpreadsheet,
    desc: 'Interactive milestones and agreed scope tracking',
    baseAngle: 180,
    radius: 140,
  },
  {
    id: 'invoices',
    label: 'Manual Invoices',
    deltCapability: 'DELT One-Click Signoff',
    icon: FileText,
    desc: 'Automated receipts and cryptographic transaction trail',
    baseAngle: 240,
    radius: 140,
  },
  {
    id: 'email',
    label: 'Email Threads',
    deltCapability: 'DELT Audit History',
    icon: Mail,
    desc: 'Never lose a price change or approval in buried threads',
    baseAngle: 300,
    radius: 140,
  },
];

export function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReducedMotion = useReducedMotion();

  const [activeTool, setActiveTool] = useState<string | null>('drive');
  const [rotationOffset, setRotationOffset] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Slow continuous orbital rotation
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    let animationFrameId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      setRotationOffset(elapsed * 8); // 8 deg / sec
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, prefersReducedMotion]);

  const selected = TOOLS.find((t) => t.id === activeTool) || TOOLS[1];

  return (
    <section className="border-t border-border/80 py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 rounded-2xl bg-card/85 border border-border/80 p-6 sm:p-7 backdrop-blur-md shadow-xs"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
              The Fragmentation Problem
            </p>
            <h2 className="text-balance text-3xl font-display font-semibold tracking-tight sm:text-4xl">
              Your client work lives in six tools. It belongs in one.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
              Proposals on email, updates on WhatsApp, files on Drive, payments via random links. Nothing connects, leaving you exposed to missed approvals and unpaid work.
            </p>

            {/* Capability Card */}
            <div className="mt-6 rounded-xl border border-amber-500/30 bg-card p-4 shadow-sm transition-all">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                <span>{selected.label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
                <span>{selected.deltCapability}</span>
              </div>
              <p className="mt-2 text-xs text-foreground/90 font-medium">
                {selected.desc}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground italic font-mono">
                Hover any orbital node on the right to pause movement and inspect capabilities.
              </p>
            </div>
          </motion.div>

          {/* Orbital Visualization side */}
          <div
            ref={ref}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="lg:col-span-7 relative flex items-center justify-center min-h-[360px] sm:min-h-[400px] overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4"
          >
            {/* Central DEAL hub */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-primary bg-primary text-primary-foreground shadow-2xl"
            >
              <span className="font-mono font-bold text-xl tracking-tight leading-none">DELT</span>
              <span className="text-[10px] font-mono text-primary-foreground/70 mt-1 uppercase tracking-wider">Workspace</span>
            </motion.div>

            {/* Orbit Ring */}
            <div className="absolute h-[280px] w-[280px] rounded-full border border-dashed border-border/60 pointer-events-none" />

            {/* Tool nodes */}
            {TOOLS.map((tool) => {
              const isHovered = activeTool === tool.id;
              const Icon = tool.icon;

              const angleRad = ((tool.baseAngle + rotationOffset) * Math.PI) / 180;
              const posX = Math.cos(angleRad) * tool.radius;
              const posY = Math.sin(angleRad) * tool.radius;

              return (
                <div
                  key={tool.id}
                  className="absolute z-10 transition-transform duration-75"
                  style={{
                    left: `calc(50% + ${posX}px)`,
                    top: `calc(50% + ${posY}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <button
                    onMouseEnter={() => setActiveTool(tool.id)}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      'group flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-mono font-medium shadow-sm transition-all cursor-pointer whitespace-nowrap',
                      isHovered
                        ? 'border-amber-500 bg-card text-foreground shadow-md scale-110 ring-2 ring-amber-500/20 font-bold'
                        : 'border-border/80 bg-card/80 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', isHovered ? 'text-amber-500' : 'text-muted-foreground')} />
                    <span>{tool.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
