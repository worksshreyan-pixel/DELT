'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Receipt, Search } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaymentStatusBadge } from '@/components/deal-status-badge';
import { EmptyState } from '@/components/empty-state';
import { DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { formatCurrency } from '@/lib/plans';
import type { PaymentState } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusFilters: { label: string; value: PaymentState | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Failed', value: 'failed' },
];

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PaymentState | 'all'>('all');

  const filtered = useMemo(() => {
    let result = DEMO_TRANSACTIONS;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.dealTitle.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q)
      );
    }
    if (filter !== 'all') {
      result = result.filter((t) => t.state === filter);
    }
    return result;
  }, [search, filter]);

  const totalRevenue = DEMO_TRANSACTIONS
    .filter((t) => t.state === 'paid')
    .reduce((sum, t) => sum + t.netAmount, 0);
  const totalFees = DEMO_TRANSACTIONS
    .filter((t) => t.state === 'paid')
    .reduce((sum, t) => sum + t.platformFee + t.processingFee, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`${DEMO_TRANSACTIONS.length} transactions`}
      />

      {/* Summary */}
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total received</p>
            <p className="text-lg font-display font-semibold mt-1">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total fees</p>
            <p className="text-lg font-display font-semibold mt-1">{formatCurrency(totalFees)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-lg font-display font-semibold mt-1">{DEMO_TRANSACTIONS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by deal or client..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                filter === s.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="No transactions found"
              description="Your payment history will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Deal</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Client</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Amount</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Fees</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Net</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/deals/${tx.dealId}`} className="text-sm font-medium hover:underline">
                        {tx.dealTitle}
                      </Link>
                      <p className="text-xs text-muted-foreground sm:hidden">{tx.clientName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{tx.clientName}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden md:table-cell">
                      {formatCurrency(tx.platformFee + tx.processingFee, tx.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600 dark:text-emerald-400 hidden md:table-cell">
                      {formatCurrency(tx.netAmount, tx.currency)}
                    </td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={tx.state} /></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
