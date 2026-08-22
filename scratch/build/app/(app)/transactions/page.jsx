'use client';
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useMemo } from 'react';
import { Receipt, Search } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaymentStatusBadge } from '@/components/deal-status-badge';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { formatCurrency } from '@/lib/plans';
import { cn } from '@/lib/utils';
var statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
    { label: 'Refunded', value: 'refunded' },
];
export default function TransactionsPage() {
    var store = useAppStore();
    var transactions = store.transactions;
    var _a = useState(''), search = _a[0], setSearch = _a[1];
    var _b = useState('all'), filter = _b[0], setFilter = _b[1];
    var _c = useState('date-desc'), sortBy = _c[0], setSortBy = _c[1];
    var filtered = useMemo(function () {
        var result = __spreadArray([], transactions, true);
        if (search.trim()) {
            var q_1 = search.toLowerCase();
            result = result.filter(function (t) {
                return t.dealTitle.toLowerCase().includes(q_1) ||
                    t.clientName.toLowerCase().includes(q_1) ||
                    t.id.toLowerCase().includes(q_1);
            });
        }
        if (filter !== 'all') {
            result = result.filter(function (t) { return t.state === filter; });
        }
        result.sort(function (a, b) {
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
      <PageHeader title="Transactions" description="Payment history, platform fees, and net revenue payouts."/>

      {transactions.length > 0 && (<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search by deal, client or ID..." className="pl-9" value={search} onChange={function (e) { return setSearch(e.target.value); }}/>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {statusFilters.map(function (s) { return (<button key={s.value} onClick={function () { return setFilter(s.value); }} className={cn('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors', filter === s.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent')}>
                  {s.label}
                </button>); })}
            </div>
            <select value={sortBy} onChange={function (e) { return setSortBy(e.target.value); }} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
          </div>
        </div>)}

      {filtered.length === 0 ? (<Card>
          <CardContent className="py-12">
            <EmptyState icon={Receipt} title={transactions.length === 0 ? "No transactions yet" : "No matching transactions"} description={transactions.length === 0
                ? "Your payment activity will appear here after a client completes a payment."
                : "Try adjusting your search query or status filter."} actionLabel={transactions.length > 0 ? "Clear Filters" : undefined} onAction={transactions.length > 0 ? function () { setSearch(''); setFilter('all'); } : undefined}/>
          </CardContent>
        </Card>) : (<Card>
          <CardContent className="p-0">
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
                  {filtered.map(function (t) { return (<tr key={t.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                      <td className="p-4 font-mono text-xs text-muted-foreground">{t.id}</td>
                      <td className="p-4 font-medium">{t.dealTitle}</td>
                      <td className="p-4 text-muted-foreground">{t.clientName}</td>
                      <td className="p-4 text-right font-semibold">{formatCurrency(t.amount, t.currency)}</td>
                      <td className="p-4 text-right text-xs text-muted-foreground">
                        −{formatCurrency((t.platformFee || 0) + (t.processingFee || 0), t.currency)}
                      </td>
                      <td className="p-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(t.netAmount || t.amount, t.currency)}
                      </td>
                      <td className="p-4">
                        <PaymentStatusBadge status={t.state}/>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>); })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
