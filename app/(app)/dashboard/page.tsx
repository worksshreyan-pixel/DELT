'use client';

import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  FolderKanban,
  Clock,
  HardDrive,
  ArrowRight,
  Plus,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UsageMeter } from '@/components/usage-meter';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { useUser } from '@/hooks/use-user';
import { formatCurrency } from '@/lib/plans';
import { cn } from '@/lib/utils';

function formatExpiryText(deal: { deadline?: string; createdAt?: string }): string {
  const targetDate = deal.deadline
    ? new Date(deal.deadline)
    : new Date(new Date(deal.createdAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return `Expires in ${diffDays} days`;
  if (diffDays === 1) return `Expires in 1 day`;
  if (diffDays === 0) return `Expires today`;
  const pastDays = Math.abs(diffDays);
  if (pastDays === 1) return `Expired 1 day ago`;
  return `Expired ${pastDays} days ago`;
}

export default function DashboardPage() {
  const store = useAppStore();
  const { user, profile } = useUser();

  const displayName =
    profile?.displayName ||
    user?.user_metadata?.displayName ||
    store.user.displayName ||
    'Creator';

  const deals = store.deals || [];
  const activeDeals = deals.filter((d) =>
    ['in_progress', 'negotiating', 'sent', 'viewed', 'agreed', 'delivered', 'payment_pending'].includes(d.status)
  );

  // Flatten recent events across all deals
  const allEvents = Object.values(store.events || {})
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const recentEvents = allEvents.slice(0, 5);

  const connections = (store as any).connections || [];
  const googleConn = connections.find((c: any) => c.provider === 'google_drive' && c.status === 'connected');

  // Stagger animation container variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Header & Primary CTA */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Good day, <span className="font-semibold text-foreground">{displayName}</span>. Here&apos;s what&apos;s happening across your deal workspaces.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
          <Link href="/deals/new">
            <Button size="lg" className="w-full sm:w-auto gap-2 rounded-xl font-medium shadow-xs bg-accent-brand hover:bg-accent-brand/90 text-accent-brand-foreground">
              <Plus className="h-4 w-4" />
              <span>Create Deal</span>
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* SECTION 1: Active Workspaces (Main Content Focal Point - Primary Surface) */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5">
              <FolderKanban className="h-4 w-4 text-accent-brand" />
              Active Workspaces
            </h2>
          </div>

          {deals.length > 0 && (
            <Link href="/deals">
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground h-7 px-2">
                <span>View all deals</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>

        {activeDeals.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
            <EmptyState
              icon={FolderKanban}
              title="No active deals yet"
              description="Create your first deal workspace to start collaborating with your client."
              actionLabel="Create Deal"
              actionHref="/deals/new"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xs overflow-hidden divide-y divide-border/30 shadow-xs">
            {activeDeals.map((deal) => {
              const client = store.clients.find((c) => c.id === deal.clientId);
              const expiryText = formatExpiryText(deal);

              // Minimal status label & dot
              let statusText = 'In Progress';
              let statusDotColor = 'bg-accent-brand shadow-[0_0_6px_#3B82F6]';
              if (deal.status === 'delivered') {
                statusText = 'Awaiting Review';
                statusDotColor = 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]';
              } else if (deal.status === 'payment_pending' || (deal.paymentStatus === 'pending' && deal.status !== 'completed' && deal.status !== 'paid')) {
                statusText = 'Awaiting Payment';
                statusDotColor = 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]';
              } else if (['sent', 'viewed'].includes(deal.status)) {
                statusText = 'Proposal Sent';
                statusDotColor = 'bg-blue-400';
              } else if (deal.status === 'negotiating') {
                statusText = 'Negotiating';
                statusDotColor = 'bg-amber-400';
              } else if (['completed', 'paid'].includes(deal.status)) {
                statusText = 'Completed';
                statusDotColor = 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]';
              }

              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.dealCode || deal.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-all duration-150 group"
                >
                  {/* Deal Title & Client */}
                  <div className="min-w-0 md:w-1/3">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-accent-brand transition-colors">
                      {deal.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
                      <UserIcon className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                      <span>{client?.name || client?.email || (deal as any).clientName || (deal as any).clientEmail || 'Client'}</span>
                    </p>
                  </div>

                  {/* Amount, Status, Expiry & Open CTA */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 md:w-2/3">
                    <div className="text-left md:text-right">
                      <span className="text-sm font-semibold text-foreground block">
                        {formatCurrency(deal.price, deal.currency)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', statusDotColor)} />
                        <span className="font-medium text-foreground">{statusText}</span>
                      </div>
                    </div>

                    <div className="text-left md:text-right text-xs">
                      <span className="text-muted-foreground block font-medium">
                        {expiryText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-accent-brand font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* SECTION 3 & 4: Recent Activity & Workspace Storage */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-accent-brand" />
            Recent Activity
          </h2>
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xs p-5">
            {recentEvents.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No activity recorded"
                description="Updates will appear here as you and your clients interact in deal workspaces."
              />
            ) : (
              <Timeline events={recentEvents} />
            )}
          </div>
        </div>

        {/* Workspace Storage & Plan Panel */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-accent-brand" />
            Workspace Usage
          </h2>
          <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xs p-5 space-y-4">
            {/* Storage Provider Status Badge */}
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-muted/30 border border-border/40">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                {googleConn ? (
                  <>
                    <HardDrive className="h-3.5 w-3.5 text-accent-brand" />
                    Google Drive Connected
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5 text-accent-brand" />
                    DELT Cloud Storage
                  </>
                )}
              </span>
            </div>

            {/* Usage Meters */}
            <div className="space-y-3 pt-1">
              <UsageMeter
                used={store.storage.totalBytes}
                total={store.storage.limitBytes}
                label="Storage Space"
                unit="bytes"
              />
              <UsageMeter
                used={store.credits.used}
                total={store.credits.total}
                label="Deal Credits Remaining"
                unit="count"
              />
            </div>

            {/* Quick links strip */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
              <Link href="/storage" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Manage Storage →
              </Link>
              <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                Upgrade Plan →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
