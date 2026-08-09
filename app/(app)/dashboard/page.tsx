'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Clock,
  IndianRupee,
  HardDrive,
  Zap,
  ArrowRight,
  TrendingUp,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DealStatusBadge, PaymentStatusBadge } from '@/components/deal-status-badge';
import { UsageMeter } from '@/components/usage-meter';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { DEMO_DEALS, DEMO_PAYMENTS, DEMO_EVENTS, DEMO_STORAGE, DEMO_CREDITS, DEMO_NOTIFICATIONS, CURRENT_USER } from '@/lib/demo-data';
import { formatCurrency, formatBytes, PLANS } from '@/lib/plans';

const stats = [
  {
    label: 'Active Deals',
    value: '8',
    icon: FolderKanban,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950',
  },
  {
    label: 'Awaiting Payment',
    value: '3',
    icon: Clock,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
  },
  {
    label: 'Revenue',
    value: formatCurrency(124500),
    icon: IndianRupee,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
  },
  {
    label: 'Deal Credits',
    value: String(DEMO_CREDITS.remaining),
    icon: Zap,
    color: 'text-primary bg-primary/5',
  },
];

const upcomingActions = [
  { title: 'Upload Version 3', deal: 'Clinic Website Redesign', due: 'Aug 12', urgent: true },
  { title: 'Respond to change request', deal: 'Clinic Website Redesign', due: 'Aug 10', urgent: true },
  { title: 'Send payment reminder', deal: 'Product Landing Page', due: 'Aug 14', urgent: false },
  { title: 'Review proposal from Priya', deal: 'Product Landing Page', due: 'Aug 11', urgent: false },
];

export default function DashboardPage() {
  const activeDeals = DEMO_DEALS.filter((d) => !['completed', 'cancelled', 'draft'].includes(d.status));
  const recentEvents = DEMO_EVENTS.slice(-6).reverse();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${CURRENT_USER.displayName.split(' ')[0]}`}
        description="Here is what is happening across your deals."
        action={
          <Link href="/deals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </Link>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-display font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Active Deals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Active Deals</CardTitle>
              <Link href="/deals">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeDeals.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No active deals"
                  description="Create your first deal to get started."
                  actionLabel="Create Deal"
                  actionHref="/deals/new"
                />
              ) : (
                activeDeals.slice(0, 4).map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(deal.price, deal.currency)} · Due {new Date(deal.deadline || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <div className="hidden sm:block w-24">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${deal.progress}%` }} />
                        </div>
                      </div>
                      <DealStatusBadge status={deal.status} />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Upcoming Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingActions.map((action) => (
                <div key={action.title} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  {action.urgent ? (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.deal}</p>
                  </div>
                  <span className={`text-xs font-medium ${action.urgent ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {action.due}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Usage + Activity */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageMeter
                used={DEMO_STORAGE.totalBytes}
                total={DEMO_STORAGE.limitBytes}
                label="Storage"
                unit="bytes"
              />
              <UsageMeter
                used={DEMO_CREDITS.used}
                total={DEMO_CREDITS.total}
                label="Deal credits"
                unit="count"
              />
              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>Plan: <span className="font-medium text-foreground">{PLANS[DEMO_CREDITS.planId].name}</span></p>
                <p className="mt-1">Storage breakdown: {formatBytes(DEMO_STORAGE.breakdown.files)} files, {formatBytes(DEMO_STORAGE.breakdown.versions)} versions</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 max-h-80 overflow-y-auto scrollbar-thin">
                <Timeline events={recentEvents} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
