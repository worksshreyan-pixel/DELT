"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const app_shell_1 = require("@/components/app-shell");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const empty_state_1 = require("@/components/empty-state");
const app_store_1 = require("@/lib/app-store");
const utils_1 = require("@/lib/utils");
const typeConfig = {
    new_message: { icon: lucide_react_1.MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    new_proposal: { icon: lucide_react_1.ArrowLeftRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    counter_offer: { icon: lucide_react_1.ArrowLeftRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
    payment_received: { icon: lucide_react_1.CreditCard, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    file_uploaded: { icon: lucide_react_1.Upload, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
    deliverable_approved: { icon: lucide_react_1.FileCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    change_request: { icon: lucide_react_1.Flag, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950' },
    deal_completed: { icon: lucide_react_1.CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
};
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
function NotificationsPage() {
    const store = (0, app_store_1.useAppStore)();
    const [filter, setFilter] = (0, react_1.useState)('all');
    const notifications = store.notifications;
    const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
    const unreadCount = notifications.filter((n) => !n.read).length;
    return (<div className="space-y-6">
      <app_shell_1.PageHeader title="Notifications" description="Stay updated on messages, proposals, payments and deliveries." action={unreadCount > 0 ? (<button_1.Button variant="outline" size="sm" className="gap-1.5">
              <lucide_react_1.Check className="h-3.5 w-3.5"/>
              Mark all as read
            </button_1.Button>) : undefined}/>

      {notifications.length > 0 && (<div className="flex gap-2">
          <button_1.Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            All ({notifications.length})
          </button_1.Button>
          <button_1.Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>
            Unread ({unreadCount})
          </button_1.Button>
        </div>)}

      {filtered.length === 0 ? (<card_1.Card>
          <card_1.CardContent className="py-12">
            <empty_state_1.EmptyState icon={lucide_react_1.Bell} title="You're all caught up" description="Notifications about messages, price proposals, payments and file updates will appear here."/>
          </card_1.CardContent>
        </card_1.Card>) : (<div className="space-y-2">
          {filtered.map((n, i) => {
                const cfg = typeConfig[n.type];
                return (<framer_motion_1.motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                <card_1.Card className={(0, utils_1.cn)('transition-colors', !n.read && 'border-primary/20 bg-primary/[0.01]')}>
                  <card_1.CardContent className="flex items-start gap-4 p-4">
                    <div className={(0, utils_1.cn)('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', cfg.color)}>
                      <cfg.icon className="h-4 w-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && (<span className="h-2 w-2 rounded-full bg-primary shrink-0"/>)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {n.dealId && (<link_1.default href={`/deals/${n.dealId}`}>
                        <button_1.Button variant="ghost" size="sm" className="text-xs">
                          View Deal
                        </button_1.Button>
                      </link_1.default>)}
                  </card_1.CardContent>
                </card_1.Card>
              </framer_motion_1.motion.div>);
            })}
        </div>)}
    </div>);
}
exports.default = NotificationsPage;
