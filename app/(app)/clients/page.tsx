'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/empty-state';
import { DEMO_CLIENTS, DEMO_DEALS } from '@/lib/demo-data';
import { formatCurrency } from '@/lib/plans';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ClientsPage() {
  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${DEMO_CLIENTS.length} clients`}
        action={
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />

      {DEMO_CLIENTS.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Clients appear here when you create deals."
              actionLabel="Create your first Deal"
              actionHref="/deals/new"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_CLIENTS.map((client, i) => {
            const deals = DEMO_DEALS.filter((d) => d.clientId === client.id);
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Card className="h-full transition-colors hover:bg-accent/30">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-sm">{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{client.name}</h3>
                        {client.company && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${client.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                        {client.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Deals</p>
                          <p className="text-sm font-semibold">{client.dealCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total value</p>
                          <p className="text-sm font-semibold">{formatCurrency(client.totalValue, client.currency)}</p>
                        </div>
                      </div>
                    </div>
                    {deals.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {deals.slice(0, 2).map((d) => (
                          <Link
                            key={d.id}
                            href={`/deals/${d.id}`}
                            className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
                          >
                            <span className="truncate">{d.title}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">{formatCurrency(d.price, d.currency)}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
