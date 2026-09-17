'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  MessageSquare,
  FileCheck,
  ArrowLeftRight,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { DealStatusBadge } from '@/components/deal-status-badge';
import { formatCurrency } from '@/lib/plans';
import { cn } from '@/lib/utils';

const SIDEBAR_ITEMS = [
  'Dashboard',
  'Deals',
  'Clients',
  'Storage',
  'Transactions',
  'Settings',
];

type Tab = 'scope' | 'chat' | 'files' | 'negotiation';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'scope', label: 'Scope', icon: Layers },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'files', label: 'Files', icon: FileCheck },
  { id: 'negotiation', label: 'Negotiation', icon: ArrowLeftRight },
];

function ScopeTab() {
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <span className="font-semibold text-foreground">Project Scope Milestones</span>
        <span className="text-[10px] text-muted-foreground">3 / 3 Items</span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between rounded border border-border/60 bg-muted/40 p-2">
          <span className="text-foreground font-medium">1. Brand Identity & Logo Kit</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Approved</span>
        </div>
        <div className="flex items-center justify-between rounded border border-border/60 bg-muted/40 p-2">
          <span className="text-foreground font-medium">2. Next.js Web App Prototype</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">In Progress</span>
        </div>
        <div className="flex items-center justify-between rounded border border-border/60 bg-muted/40 p-2 text-muted-foreground">
          <span>3. Deployment & Domain Handover</span>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}

function ChatTab() {
  return (
    <div className="space-y-2 text-xs">
      <div className="flex gap-2">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-mono font-medium shrink-0">
          PN
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-medium text-foreground">Priya Nair (Client)</p>
          <div className="mt-0.5 rounded-lg rounded-tl-sm bg-muted/60 px-2.5 py-1.5 text-xs text-foreground/90">
            Can we verify dark mode logo variations before approving Milestone 2?
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-row-reverse">
        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-mono font-medium text-primary-foreground shrink-0">
          AM
        </div>
        <div className="flex-1 flex flex-col items-end">
          <p className="text-[11px] font-medium text-foreground">Alex Morgan (Creator)</p>
          <div className="mt-0.5 rounded-lg rounded-tr-sm bg-primary px-2.5 py-1.5 text-xs text-primary-foreground">
            Yes — updated SVG vectors are uploaded to the Files tab now.
          </div>
        </div>
      </div>
    </div>
  );
}

function FilesTab() {
  const files = [
    { name: 'brand-guidelines-v2.pdf', size: '4.2 MB', status: 'Approved', locked: false },
    { name: 'logo-concepts-final.zip', size: '12.8 MB', status: 'In Review', locked: true },
    { name: 'identity-applications.fig', size: '8.1 MB', status: 'Payment Locked', locked: true },
  ];
  return (
    <div className="space-y-1.5">
      {files.map((file) => (
        <div key={file.name} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-2 text-xs">
          <FileCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0 font-mono">
            <p className="font-semibold text-foreground truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{file.size}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {file.locked && <Lock className="h-3 w-3 text-amber-500" />}
            <span className={cn(
              'text-[10px] font-mono font-medium rounded px-1.5 py-0.5',
              file.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
              file.status === 'In Review' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
              'bg-muted text-muted-foreground'
            )}>
              {file.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NegotiationTab() {
  return (
    <div className="space-y-2 text-xs">
      <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wide">
            Proposal Record
          </span>
          <span className="rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-mono font-bold">
            ACCEPTED AT ₹40,000
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded bg-muted/40 p-2 font-mono">
            <p className="text-[10px] text-muted-foreground">Original Offer</p>
            <p className="text-xs font-semibold line-through text-muted-foreground">{formatCurrency(45000)}</p>
          </div>
          <span className="text-muted-foreground/60 text-xs">→</span>
          <div className="flex-1 rounded bg-emerald-500/10 border border-emerald-500/20 p-2 font-mono">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Agreed Price</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(40000)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const TAB_CONTENT: Record<Tab, React.ReactNode> = {
  scope: <ScopeTab />,
  chat: <ChatTab />,
  files: <FilesTab />,
  negotiation: <NegotiationTab />,
};

export function WorkspaceDemo() {
  const [activeTab, setActiveTab] = useState<Tab>('scope');

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-xl max-w-4xl mx-auto">
      {/* Browser bar */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3.5 py-2">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3 text-emerald-500" />
          <span>https://www.delt.website/deals/DLT-8V26RW75</span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
          SECURE ESCROW
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr]">
        {/* Sidebar */}
        <div className="hidden border-r border-border/60 bg-muted/20 py-2.5 px-2 lg:block">
          <div className="space-y-0.5">
            {SIDEBAR_ITEMS.map((item) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs font-mono font-medium ${
                  item === 'Deals'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                <div className="h-2 w-2 rounded-sm bg-current opacity-60" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main Workspace Frame */}
        <div className="p-3 sm:p-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">Brand Identity & Web Application</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">Client: Priya Nair · Studio: Apex Studio</p>
            </div>
            <DealStatusBadge status="in_progress" />
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-4 font-mono text-xs">
            {[
              { label: 'Agreed Price', value: formatCurrency(40000) },
              { label: 'Milestones', value: '2 / 3 Complete' },
              { label: 'Deadline', value: 'Sep 20' },
              { label: 'Escrow Status', value: 'Secured', valueClass: 'text-emerald-600 dark:text-emerald-400 font-bold' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/60 bg-muted/30 p-2">
                <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
                <p className={cn('font-semibold text-xs mt-0.5', stat.valueClass)}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1 mb-2.5 border border-border/40">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-xs font-mono font-medium transition-colors',
                    isActive ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="workspace-tab"
                      className="absolute inset-0 rounded-lg bg-card shadow-xs border border-border/80"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon className="relative z-10 h-3 w-3" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content panel */}
          <div className="rounded-xl border border-border/60 bg-card p-3 min-h-[130px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {TAB_CONTENT[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
