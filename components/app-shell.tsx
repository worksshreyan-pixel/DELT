'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  HardDrive,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeftRight,
  FileCheck,
  Flag,
  CreditCard,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UsageMeter } from '@/components/usage-meter';
import { cn } from '@/lib/utils';
import { PLANS } from '@/lib/plans';
import { useAppStore, clearStoreState } from '@/lib/app-store';
import { useUser } from '@/hooks/use-user';
import type { AppNotification } from '@/lib/types';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/deals', label: 'Deals', icon: FolderKanban },
  { href: '/clients', label: 'Clients', icon: UserIcon },
  { href: '/storage', label: 'Storage', icon: HardDrive },
  { href: '/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const notifTypeConfig: Record<AppNotification['type'], { icon: typeof Bell; color: string }> = {
  new_message: { icon: Bell, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
  new_proposal: { icon: ArrowLeftRight, color: 'text-primary bg-primary/10' },
  counter_offer: { icon: ArrowLeftRight, color: 'text-primary bg-primary/10' },
  payment_received: { icon: CreditCard, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
  file_uploaded: { icon: FileCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
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

function getInitials(name?: string) {
  if (!name) return 'YA';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useAppStore();
  const { user, profile, signOut } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const unreadCount = store.notifications.filter((n) => !n.read).length;
  const displayName = profile?.displayName || user?.user_metadata?.displayName || store.user.displayName || 'Creator';
  const displayEmail = profile?.email || user?.email || store.user.email || '';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      clearStoreState();
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom indicators & User Account Section */}
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between">
            <Link href="/settings" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{PLANS[store.credits.planId]?.name || 'Free'} plan</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <UsageMeter
            used={store.storage.totalBytes}
            total={store.storage.limitBytes}
            label="Storage"
            unit="bytes"
          />
          <UsageMeter
            used={store.credits.used}
            total={store.credits.total}
            label="Deal credits"
            unit="count"
          />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between">
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{PLANS[store.credits.planId]?.name || 'Free'} plan</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes" />
              <UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count" />
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden flex-1 sm:block">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search deals, clients..." className="h-9 pl-9" />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setNotifOpen(!notifOpen)}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />}
              </Button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-border p-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-primary hover:underline">
                        View all
                      </Link>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {store.notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No notifications yet
                        </div>
                      ) : (
                        store.notifications.slice(0, 5).map((n) => {
                          const cfg = notifTypeConfig[n.type];
                          return (
                            <Link
                              key={n.id}
                              href={n.dealId ? `/deals/${n.dealId}` : '/notifications'}
                              onClick={() => setNotifOpen(false)}
                              className={cn('flex items-start gap-3 border-b border-border p-3 last:border-0 hover:bg-accent/30 transition-colors', !n.read && 'bg-primary/[0.02]')}
                            >
                              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', cfg.color)}>
                                <cfg.icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.description}</p>
                                <p className="text-xs text-muted-foreground/50 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                              </div>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Topbar User dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors"
              >
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-lg p-1.5 space-y-1">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings & Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      ))}
    </nav>
  );
}
