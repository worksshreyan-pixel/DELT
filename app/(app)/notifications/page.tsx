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
import { DEMO_NOTIFICATIONS } from '@/lib/demo-data';
import type { AppNotification, NotificationType } from '@/lib/types';
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
  const [notifications, setNotifications] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllAsRead() {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        action={
          <Button variant="outline" className="gap-2" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      {/* Filter */}
      <div className="mb-4 flex items-center gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Bell}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              description={filter === 'unread' ? 'You are all caught up.' : 'Notifications will appear here.'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => {
            const config = typeConfig[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              >
                <Card className={cn('transition-colors', !n.read && 'border-primary/20 bg-primary/[0.02]')}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', config.color)}>
                      <config.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{n.title}</p>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
                      {n.dealTitle && (
                        <Link
                          href={n.dealId ? `/deals/${n.dealId}` : '/deals'}
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          {n.dealTitle}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark read
                      </Button>
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
