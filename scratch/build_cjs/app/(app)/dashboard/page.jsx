"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("next/link"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const app_shell_1 = require("@/components/app-shell");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const deal_status_badge_1 = require("@/components/deal-status-badge");
const usage_meter_1 = require("@/components/usage-meter");
const timeline_event_1 = require("@/components/timeline-event");
const empty_state_1 = require("@/components/empty-state");
const app_store_1 = require("@/lib/app-store");
const plans_1 = require("@/lib/plans");
function formatRelativeTime(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));
    if (days > 0)
        return `${days}d ago`;
    if (hours > 0)
        return `${hours}h ago`;
    if (mins > 0)
        return `${mins}m ago`;
    return 'Just now';
}
function DashboardPage() {
    const store = (0, app_store_1.useAppStore)();
    const deals = store.deals;
    const activeDeals = deals.filter((d) => ['in_progress', 'negotiating', 'sent', 'viewed', 'agreed'].includes(d.status));
    const pendingPayments = deals.filter((d) => d.paymentStatus === 'pending' || d.status === 'payment_pending');
    const completedDeals = deals.filter((d) => d.status === 'completed');
    const pendingPaymentSum = pendingPayments.reduce((acc, d) => acc + d.price, 0);
    const storagePercent = store.storage.limitBytes > 0
        ? Math.round((store.storage.totalBytes / store.storage.limitBytes) * 100)
        : 0;
    // Flatten recent events across all deals
    const allEvents = Object.values(store.events).flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentEvents = allEvents.slice(0, 5);
    const stats = [
        {
            label: 'Active Deals',
            value: String(activeDeals.length),
            subtext: `${deals.length} total deals`,
            icon: lucide_react_1.FolderKanban,
            color: 'text-primary bg-primary/10',
        },
        {
            label: 'Pending Payments',
            value: (0, plans_1.formatCurrency)(pendingPaymentSum),
            subtext: `${pendingPayments.length} awaiting payment`,
            icon: lucide_react_1.Clock,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
        },
        {
            label: 'Completed Deals',
            value: String(completedDeals.length),
            subtext: 'Delivered & paid',
            icon: lucide_react_1.CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
        },
        {
            label: 'Storage Usage',
            value: `${(0, plans_1.formatBytes)(store.storage.totalBytes)}`,
            subtext: `${storagePercent}% of ${(0, plans_1.formatBytes)(store.storage.limitBytes)}`,
            icon: lucide_react_1.HardDrive,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
        },
    ];
    return (<div className="space-y-6">
      <app_shell_1.PageHeader title="Dashboard" description="Overview of your client deals and transaction pipeline." action={<link_1.default href="/deals/new">
            <button_1.Button className="gap-2">
              <lucide_react_1.Plus className="h-4 w-4"/>
              Create Deal
            </button_1.Button>
          </link_1.default>}/>

      {/* First-time Onboarding Welcome Card (Visible when 0 deals) */}
      {deals.length === 0 && (<framer_motion_1.motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <card_1.Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-background">
            <card_1.CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <lucide_react_1.Sparkles className="h-3.5 w-3.5"/>
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
                  <link_1.default href="/deals/new">
                    <button_1.Button size="lg" className="w-full sm:w-auto gap-2 shadow-sm">
                      <lucide_react_1.Plus className="h-4 w-4"/>
                      Create your first Deal
                    </button_1.Button>
                  </link_1.default>
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
            </card_1.CardContent>
          </card_1.Card>
        </framer_motion_1.motion.div>)}

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (<framer_motion_1.motion.div key={stat.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
            <card_1.Card>
              <card_1.CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4"/>
                  </div>
                </div>
                <p className="text-2xl font-display font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtext}</p>
              </card_1.CardContent>
            </card_1.Card>
          </framer_motion_1.motion.div>))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Deals */}
        <div className="lg:col-span-2">
          <card_1.Card>
            <card_1.CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <card_1.CardTitle className="text-base">Recent Deals</card_1.CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deals.length > 0 ? 'Your active and past client workspaces' : 'No Deals yet'}
                </p>
              </div>
              {deals.length > 0 && (<link_1.default href="/deals">
                  <button_1.Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    View all deals
                    <lucide_react_1.ArrowRight className="h-3.5 w-3.5"/>
                  </button_1.Button>
                </link_1.default>)}
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-2">
              {deals.length === 0 ? (<empty_state_1.EmptyState icon={lucide_react_1.FolderKanban} title="No Deals yet" description="Create your first Deal to start working with a client." actionLabel="Create Deal" actionHref="/deals/new"/>) : (deals.slice(0, 5).map((deal) => {
            const client = store.clients.find((c) => c.id === deal.clientId);
            return (<link_1.default key={deal.id} href={`/deals/${deal.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border p-3.5 transition-colors hover:bg-accent/40 gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{deal.title}</p>
                          <deal_status_badge_1.DealStatusBadge status={deal.status}/>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <lucide_react_1.User className="h-3 w-3 text-muted-foreground"/>
                            {client?.name || 'Client'}
                          </span>
                          <span>·</span>
                          <span>{(0, plans_1.formatCurrency)(deal.price, deal.currency)}</span>
                          <span>·</span>
                          <span>Active {formatRelativeTime(deal.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground hidden md:inline">
                          Due {deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </span>
                        <lucide_react_1.ArrowRight className="h-4 w-4 text-muted-foreground"/>
                      </div>
                    </link_1.default>);
        }))}
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Sidebar: Activity & Storage */}
        <div className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader className="pb-3">
              <card_1.CardTitle className="text-base">Recent Activity</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              {recentEvents.length === 0 ? (<empty_state_1.EmptyState icon={lucide_react_1.Clock} title="No activity yet" description="Your Deal activity will appear here as you create and manage deals."/>) : (<timeline_event_1.Timeline events={recentEvents}/>)}
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardHeader className="pb-3">
              <card_1.CardTitle className="text-base">Workspace Status</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-3">
              <usage_meter_1.UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
              <usage_meter_1.UsageMeter used={store.credits.used} total={store.credits.total} label="Deals Remaining" unit="count"/>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
exports.default = DashboardPage;
