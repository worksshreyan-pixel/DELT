"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const app_shell_1 = require("@/components/app-shell");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const deal_status_badge_1 = require("@/components/deal-status-badge");
const empty_state_1 = require("@/components/empty-state");
const app_store_1 = require("@/lib/app-store");
const plans_1 = require("@/lib/plans");
const utils_1 = require("@/lib/utils");
const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
    { label: 'Refunded', value: 'refunded' },
];
function TransactionsPage() {
    const store = (0, app_store_1.useAppStore)();
    const transactions = store.transactions;
    const [search, setSearch] = (0, react_1.useState)('');
    const [filter, setFilter] = (0, react_1.useState)('all');
    const [sortBy, setSortBy] = (0, react_1.useState)('date-desc');
    const filtered = (0, react_1.useMemo)(() => {
        let result = [...transactions];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((t) => t.dealTitle.toLowerCase().includes(q) ||
                t.clientName.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q));
        }
        if (filter !== 'all') {
            result = result.filter((t) => t.state === filter);
        }
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'date-desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });
        return result;
    }, [transactions, search, filter, sortBy]);
    return (<div className="space-y-6">
      <app_shell_1.PageHeader title="Transactions" description="Payment history, platform fees, and net revenue payouts."/>

      {transactions.length > 0 && (<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <lucide_react_1.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <input_1.Input placeholder="Search by deal, client or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)}/>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {statusFilters.map((s) => (<button key={s.value} onClick={() => setFilter(s.value)} className={(0, utils_1.cn)('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors', filter === s.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent')}>
                  {s.label}
                </button>))}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
          </div>
        </div>)}

      {filtered.length === 0 ? (<card_1.Card>
          <card_1.CardContent className="py-12">
            <empty_state_1.EmptyState icon={lucide_react_1.Receipt} title={transactions.length === 0 ? "No transactions yet" : "No matching transactions"} description={transactions.length === 0
                ? "Your payment activity will appear here after a client completes a payment."
                : "Try adjusting your search query or status filter."} actionLabel={transactions.length > 0 ? "Clear Filters" : undefined} onAction={transactions.length > 0 ? () => { setSearch(''); setFilter('all'); } : undefined}/>
          </card_1.CardContent>
        </card_1.Card>) : (<card_1.Card>
          <card_1.CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground bg-muted/20">
                    <th className="p-4 font-medium">Transaction ID</th>
                    <th className="p-4 font-medium">Deal</th>
                    <th className="p-4 font-medium">Client</th>
                    <th className="p-4 font-medium text-right">Gross</th>
                    <th className="p-4 font-medium text-right">Fees</th>
                    <th className="p-4 font-medium text-right">Net</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (<tr key={t.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{t.id}</td>
                      <td className="p-4 font-medium">{t.dealTitle}</td>
                      <td className="p-4 text-muted-foreground">{t.clientName}</td>
                      <td className="p-4 text-right font-semibold">{(0, plans_1.formatCurrency)(t.amount, t.currency)}</td>
                      <td className="p-4 text-right text-xs text-muted-foreground">
                        −{(0, plans_1.formatCurrency)((t.platformFee || 0) + (t.processingFee || 0), t.currency)}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {(0, plans_1.formatCurrency)(t.netAmount || t.amount, t.currency)}
                      </td>
                      <td className="p-4">
                        <deal_status_badge_1.PaymentStatusBadge status={t.state}/>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
exports.default = TransactionsPage;
