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
const input_1 = require("@/components/ui/input");
const avatar_1 = require("@/components/ui/avatar");
const empty_state_1 = require("@/components/empty-state");
const app_store_1 = require("@/lib/app-store");
const plans_1 = require("@/lib/plans");
const utils_1 = require("@/lib/utils");
function getInitials(name) {
    if (!name)
        return 'CL';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
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
function ClientsPage() {
    const store = (0, app_store_1.useAppStore)();
    const clients = store.clients;
    const deals = store.deals;
    const [search, setSearch] = (0, react_1.useState)('');
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('all');
    const [sortBy, setSortBy] = (0, react_1.useState)('activity');
    const filteredAndSorted = (0, react_1.useMemo)(() => {
        let result = [...clients];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((c) => c.name.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                (c.company && c.company.toLowerCase().includes(q)));
        }
        if (statusFilter !== 'all') {
            result = result.filter((c) => c.status === statusFilter);
        }
        result.sort((a, b) => {
            if (sortBy === 'value')
                return b.totalValue - a.totalValue;
            if (sortBy === 'deals')
                return b.dealCount - a.dealCount;
            if (sortBy === 'name')
                return a.name.localeCompare(b.name);
            return new Date(b.lastActivityAt || b.createdAt).getTime() - new Date(a.lastActivityAt || a.createdAt).getTime();
        });
        return result;
    }, [clients, search, statusFilter, sortBy]);
    return (<div className="space-y-6">
      <app_shell_1.PageHeader title="Clients" description="Clients are automatically recorded as you create and manage Deals." action={<link_1.default href="/deals/new">
            <button_1.Button className="gap-2">
              <lucide_react_1.Plus className="h-4 w-4"/>
              Create Deal
            </button_1.Button>
          </link_1.default>}/>

      {clients.length > 0 && (<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <lucide_react_1.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <input_1.Input placeholder="Search by client name, email or company..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {['all', 'active', 'inactive'].map((s) => (<button key={s} onClick={() => setStatusFilter(s)} className={(0, utils_1.cn)('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors', statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent')}>
                  {s}
                </button>))}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="activity">Recent Activity</option>
              <option value="value">Total Value</option>
              <option value="deals">Deals Count</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>)}

      {filteredAndSorted.length === 0 ? (<card_1.Card>
          <card_1.CardContent className="py-12">
            <empty_state_1.EmptyState icon={lucide_react_1.Users} title={clients.length === 0 ? "No clients yet" : "No matching clients"} description={clients.length === 0
                ? "Clients will appear automatically when you create Deals."
                : "Try adjusting your search query or filters."} actionLabel={clients.length === 0 ? "Create Deal" : "Clear Search"} actionHref={clients.length === 0 ? "/deals/new" : undefined} onAction={clients.length > 0 ? () => { setSearch(''); setStatusFilter('all'); } : undefined}/>
          </card_1.CardContent>
        </card_1.Card>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((client, i) => {
                const clientDeals = deals.filter((d) => d.clientId === client.id);
                return (<framer_motion_1.motion.div key={client.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                <card_1.Card className="h-full hover:border-primary/30 transition-colors">
                  <card_1.CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <avatar_1.Avatar className="h-10 w-10">
                            <avatar_1.AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(client.name)}
                            </avatar_1.AvatarFallback>
                          </avatar_1.Avatar>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                            {client.company && (<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <lucide_react_1.Building2 className="h-3 w-3"/>
                                {client.company}
                              </p>)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5 truncate">
                          <lucide_react_1.Mail className="h-3.5 w-3.5 shrink-0"/>
                          <span>{client.email}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <lucide_react_1.Clock className="h-3.5 w-3.5 shrink-0"/>
                          <span>Active {formatRelativeTime(client.lastActivityAt || client.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground">Total Value: </span>
                        <span className="font-semibold text-foreground">{(0, plans_1.formatCurrency)(client.totalValue, client.currency)}</span>
                      </div>
                      <span className="text-muted-foreground">{clientDeals.length} deals</span>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </framer_motion_1.motion.div>);
            })}
        </div>)}
    </div>);
}
exports.default = ClientsPage;
