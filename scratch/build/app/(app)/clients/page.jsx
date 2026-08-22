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
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Building2, Search, Clock } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { formatCurrency } from '@/lib/plans';
import { cn } from '@/lib/utils';
function getInitials(name) {
    if (!name)
        return 'CL';
    return name.split(' ').map(function (n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
}
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
export default function ClientsPage() {
    var store = useAppStore();
    var clients = store.clients;
    var deals = store.deals;
    var _a = useState(''), search = _a[0], setSearch = _a[1];
    var _b = useState('all'), statusFilter = _b[0], setStatusFilter = _b[1];
    var _c = useState('activity'), sortBy = _c[0], setSortBy = _c[1];
    var filteredAndSorted = useMemo(function () {
        var result = __spreadArray([], clients, true);
        if (search.trim()) {
            var q_1 = search.toLowerCase();
            result = result.filter(function (c) {
                return c.name.toLowerCase().includes(q_1) ||
                    c.email.toLowerCase().includes(q_1) ||
                    (c.company && c.company.toLowerCase().includes(q_1));
            });
        }
        if (statusFilter !== 'all') {
            result = result.filter(function (c) { return c.status === statusFilter; });
        }
        result.sort(function (a, b) {
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
      <PageHeader title="Clients" description="Clients are automatically recorded as you create and manage Deals." action={<Link href="/deals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4"/>
              Create Deal
            </Button>
          </Link>}/>

      {clients.length > 0 && (<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search by client name, email or company..." className="pl-9" value={search} onChange={function (e) { return setSearch(e.target.value); }}/>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              {['all', 'active', 'inactive'].map(function (s) { return (<button key={s} onClick={function () { return setStatusFilter(s); }} className={cn('whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors', statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent')}>
                  {s}
                </button>); })}
            </div>
            <select value={sortBy} onChange={function (e) { return setSortBy(e.target.value); }} className="h-9 rounded-md border border-input bg-background px-3 text-xs">
              <option value="activity">Recent Activity</option>
              <option value="value">Total Value</option>
              <option value="deals">Deals Count</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>)}

      {filteredAndSorted.length === 0 ? (<Card>
          <CardContent className="py-12">
            <EmptyState icon={Users} title={clients.length === 0 ? "No clients yet" : "No matching clients"} description={clients.length === 0
                ? "Clients will appear automatically when you create Deals."
                : "Try adjusting your search query or filters."} actionLabel={clients.length === 0 ? "Create Deal" : "Clear Search"} actionHref={clients.length === 0 ? "/deals/new" : undefined} onAction={clients.length > 0 ? function () { setSearch(''); setStatusFilter('all'); } : undefined}/>
          </CardContent>
        </Card>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map(function (client, i) {
                var clientDeals = deals.filter(function (d) { return d.clientId === client.id; });
                return (<motion.div key={client.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                <Card className="h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                            {client.company && (<p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3"/>
                                {client.company}
                              </p>)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0"/>
                          <span>{client.email}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0"/>
                          <span>Active {formatRelativeTime(client.lastActivityAt || client.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground">Total Value: </span>
                        <span className="font-semibold text-foreground">{formatCurrency(client.totalValue, client.currency)}</span>
                      </div>
                      <span className="text-muted-foreground">{clientDeals.length} deals</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>);
            })}
        </div>)}
    </div>);
}
