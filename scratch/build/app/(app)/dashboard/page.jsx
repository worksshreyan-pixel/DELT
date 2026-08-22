'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FolderKanban, Clock, CheckCircle2, HardDrive, ArrowRight, Plus, User, Sparkles, } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DealStatusBadge } from '@/components/deal-status-badge';
import { UsageMeter } from '@/components/usage-meter';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { formatCurrency, formatBytes } from '@/lib/plans';
function formatRelativeTime(iso) {
    var date = new Date(iso);
    var now = new Date();
    var diff = now.getTime() - date.getTime();
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor(diff / (1000 * 60 * 60));
    var mins = Math.floor(diff / (1000 * 60));
    if (days > 0)
        return "".concat(days, "d ago");
    if (hours > 0)
        return "".concat(hours, "h ago");
    if (mins > 0)
        return "".concat(mins, "m ago");
    return 'Just now';
}
export default function DashboardPage() {
    var store = useAppStore();
    var deals = store.deals;
    var activeDeals = deals.filter(function (d) { return ['in_progress', 'negotiating', 'sent', 'viewed', 'agreed'].includes(d.status); });
    var pendingPayments = deals.filter(function (d) { return d.paymentStatus === 'pending' || d.status === 'payment_pending'; });
    var completedDeals = deals.filter(function (d) { return d.status === 'completed'; });
    var pendingPaymentSum = pendingPayments.reduce(function (acc, d) { return acc + d.price; }, 0);
    var storagePercent = store.storage.limitBytes > 0
        ? Math.round((store.storage.totalBytes / store.storage.limitBytes) * 100)
        : 0;
    // Flatten recent events across all deals
    var allEvents = Object.values(store.events).flat().sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); });
    var recentEvents = allEvents.slice(0, 5);
    var stats = [
        {
            label: 'Active Deals',
            value: String(activeDeals.length),
            subtext: "".concat(deals.length, " total deals"),
            icon: FolderKanban,
            color: 'text-primary bg-primary/10',
        },
        {
            label: 'Pending Payments',
            value: formatCurrency(pendingPaymentSum),
            subtext: "".concat(pendingPayments.length, " awaiting payment"),
            icon: Clock,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
        },
        {
            label: 'Completed Deals',
            value: String(completedDeals.length),
            subtext: 'Delivered & paid',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
        },
        {
            label: 'Storage Usage',
            value: "".concat(formatBytes(store.storage.totalBytes)),
            subtext: "".concat(storagePercent, "% of ").concat(formatBytes(store.storage.limitBytes)),
            icon: HardDrive,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your client deals and transaction pipeline." action={<Link href="/deals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4"/>
              Create Deal
            </Button>
          </Link>}/>

      {/* First-time Onboarding Welcome Card (Visible when 0 deals) */}
      {deals.length === 0 && (<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-background">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Sparkles className="h-3.5 w-3.5"/>
                    First Time Setup
                  </div>
                  <h2 className="text-xl font-display font-semibold tracking-tight">
                    Welcome to DELT
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create a private Deal, share it with your client, collaborate, negotiate and deliver everything from one unified workspace.
                  </p>
                </div>
                <div className="shrink-0">
                  <Link href="/deals/new">
                    <Button size="lg" className="w-full sm:w-auto gap-2 shadow-sm">
                      <Plus className="h-4 w-4"/>
                      Create your first Deal
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Step Checklist */}
              <div className="mt-6 pt-6 border-t border-border grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-medium">Create your first Deal</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Set scope, pricing & deliverables</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-medium">Share private link</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Client accesses without creating account</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-medium">Deliver & get paid</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Files unlock automatically upon payment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>)}

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(function (stat, i) { return (<motion.div key={stat.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={"flex h-9 w-9 items-center justify-center rounded-lg ".concat(stat.color)}>
                    <stat.icon className="h-4 w-4"/>
                  </div>
                </div>
                <p className="text-2xl font-display font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtext}</p>
              </CardContent>
            </Card>
          </motion.div>); })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Deals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base">Recent Deals</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deals.length > 0 ? 'Your active and past client workspaces' : 'No Deals yet'}
                </p>
              </div>
              {deals.length > 0 && (<Link href="/deals">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    View all deals
                    <ArrowRight className="h-3.5 w-3.5"/>
                  </Button>
                </Link>)}
            </CardHeader>
            <CardContent className="space-y-2">
              {deals.length === 0 ? (<EmptyState icon={FolderKanban} title="No Deals yet" description="Create your first Deal to start working with a client." actionLabel="Create Deal" actionHref="/deals/new"/>) : (deals.slice(0, 5).map(function (deal) {
            var client = store.clients.find(function (c) { return c.id === deal.clientId; });
            return (<Link key={deal.id} href={"/deals/".concat(deal.id)} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:bg-accent/40 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{deal.title}</p>
                          <DealStatusBadge status={deal.status}/>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <User className="h-3 w-3 text-muted-foreground"/>
                            {(client === null || client === void 0 ? void 0 : client.name) || 'Client'}
                          </span>
                          <span>·</span>
                          <span>{formatCurrency(deal.price, deal.currency)}</span>
                          <span>·</span>
                          <span>Active {formatRelativeTime(deal.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground hidden md:inline">
                          Due {deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground"/>
                      </div>
                    </Link>);
        }))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Activity & Storage */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (<EmptyState icon={Clock} title="No activity yet" description="Your Deal activity will appear here as you create and manage deals."/>) : (<Timeline events={recentEvents}/>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Workspace Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
              <UsageMeter used={store.credits.used} total={store.credits.total} label="Deals Remaining" unit="count"/>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
