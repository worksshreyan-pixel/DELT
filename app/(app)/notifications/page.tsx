'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ArrowLeftRight,
  CreditCard,
  Upload,
  FileCheck,
  Flag,
  CheckCircle2,
  Check,
  Bell,
} from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import type { NotificationType } from '@/lib/types';
import { cn } from '@/lib/utils';

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  new_message: { icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
  new_proposal: { icon: ArrowLeftRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
  counter_offer: { icon: ArrowLeftRight, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
  payment_received: { icon: CreditCard, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
  file_uploaded: { icon: Upload, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
  deliverable_approved: { icon: FileCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
  change_request: { icon: Flag, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950' },
  deal_completed: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor(diff / (1000 * 60));
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function NotificationsPage() {
  const store = useAppStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notifications = store.notifications;

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay updated on messages, proposals, payments and deliveries."
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="Notifications about messages, price proposals, payments and file updates will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const cfg = typeConfig[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Card className={cn('transition-colors', !n.read && 'border-primary/20 bg-primary/[0.01]')}>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', cfg.color)}>
                      <cfg.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {n.dealId && (
                      <Link href={`/deals/${n.dealId}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Deal
                        </Button>
                      </Link>
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
