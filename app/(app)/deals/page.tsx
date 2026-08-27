'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, FolderKanban, ArrowUpDown } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DealStatusBadge } from '@/components/deal-status-badge';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { formatCurrency } from '@/lib/plans';
import type { DealStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusFilters: { label: string; value: DealStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Negotiating', value: 'negotiating' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Payment Pending', value: 'payment_pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Completed', value: 'completed' },
  { label: 'Closed', value: 'closed' },
];

type SortKey = 'updated' | 'price' | 'deadline';

export default function DealsPage() {
  const store = useAppStore();
  const deals = store.deals;
  const clients = store.clients;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DealStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('updated');

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          clients.find((c) => c.id === d.clientId)?.name.toLowerCase().includes(q)
      );
    }
    if (filter !== 'all') {
      result = result.filter((d) => d.status === filter);
    }
    result = [...result].sort((a, b) => {
      if (sort === 'price') return b.price - a.price;
      if (sort === 'deadline') return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return result;
  }, [deals, clients, search, filter, sort]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Manage your private client Deals."
        action={
          <Link href="/deals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Deal
            </Button>
          </Link>
        }
      />

      {deals.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by deal title or client..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="updated">Last updated</option>
              <option value="price">Price</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
        </div>
      )}

      {/* Deal list */}
      {filteredDeals.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FolderKanban}
              title={deals.length === 0 ? "No Deals yet" : "No matching Deals"}
              description={deals.length === 0 ? "Create a private Deal to start working with a client." : "Try adjusting your search or filter settings."}
              actionLabel={deals.length === 0 ? "Create your first Deal" : "Clear Filters"}
              actionHref={deals.length === 0 ? "/deals/new" : undefined}
              onAction={deals.length > 0 ? () => { setSearch(''); setFilter('all'); } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDeals.map((deal, i) => {
            const client = clients.find((c) => c.id === deal.clientId);
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Link href={`/deals/${deal.dealCode || deal.id}`}>
                  <Card className="transition-colors hover:bg-accent/30 cursor-pointer">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{deal.title}</h3>
                          <DealStatusBadge status={deal.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {client?.name || 'Client'} {client?.company ? `· ${client.company}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(deal.price, deal.currency)}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </p>
                        </div>
                        <div className="hidden md:block w-20">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${deal.progress}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground text-right">{deal.progress}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
