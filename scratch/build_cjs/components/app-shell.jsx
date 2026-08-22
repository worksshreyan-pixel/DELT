"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Breadcrumb = exports.PageHeader = exports.AppShell = void 0;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const logo_1 = require("@/components/logo");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const avatar_1 = require("@/components/ui/avatar");
const usage_meter_1 = require("@/components/usage-meter");
const utils_1 = require("@/lib/utils");
const plans_1 = require("@/lib/plans");
const app_store_1 = require("@/lib/app-store");
const use_user_1 = require("@/hooks/use-user");
const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: lucide_react_1.LayoutDashboard },
    { href: '/deals', label: 'Deals', icon: lucide_react_1.FolderKanban },
    { href: '/clients', label: 'Clients', icon: lucide_react_1.User },
    { href: '/storage', label: 'Storage', icon: lucide_react_1.HardDrive },
    { href: '/transactions', label: 'Transactions', icon: lucide_react_1.CreditCard },
    { href: '/settings', label: 'Settings', icon: lucide_react_1.Settings },
];
const notifTypeConfig = {
    new_message: { icon: lucide_react_1.Bell, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    new_proposal: { icon: lucide_react_1.ArrowLeftRight, color: 'text-primary bg-primary/10' },
    counter_offer: { icon: lucide_react_1.ArrowLeftRight, color: 'text-primary bg-primary/10' },
    payment_received: { icon: lucide_react_1.CreditCard, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    file_uploaded: { icon: lucide_react_1.FileCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    deliverable_approved: { icon: lucide_react_1.FileCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    change_request: { icon: lucide_react_1.Flag, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950' },
    deal_completed: { icon: lucide_react_1.CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
};
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
function getInitials(name) {
    if (!name)
        return 'YA';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
function AppShell({ children }) {
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const store = (0, app_store_1.useAppStore)();
    const { user, profile, signOut } = (0, use_user_1.useUser)();
    const [mobileOpen, setMobileOpen] = (0, react_1.useState)(false);
    const [notifOpen, setNotifOpen] = (0, react_1.useState)(false);
    const [userMenuOpen, setUserMenuOpen] = (0, react_1.useState)(false);
    const [loggingOut, setLoggingOut] = (0, react_1.useState)(false);
    const unreadCount = store.notifications.filter((n) => !n.read).length;
    const displayName = profile?.displayName || user?.user_metadata?.displayName || store.user.displayName || 'Creator';
    const displayEmail = profile?.email || user?.email || store.user.email || '';
    async function handleLogout() {
        setLoggingOut(true);
        try {
            (0, app_store_1.clearStoreState)();
            await signOut();
            router.push('/login');
            router.refresh();
        }
        catch (err) {
            console.error('Logout error:', err);
            router.push('/login');
        }
        finally {
            setLoggingOut(false);
        }
    }
    return (<div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <logo_1.Logo size="sm"/>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (<link_1.default key={item.href} href={item.href} className={(0, utils_1.cn)('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors', active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                <item.icon className="h-4 w-4 shrink-0"/>
                {item.label}
              </link_1.default>);
        })}
        </nav>

        {/* Bottom indicators & User Account Section */}
        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center justify-between">
            <link_1.default href="/settings" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
              <avatar_1.Avatar className="h-8 w-8 shrink-0">
                <avatar_1.AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(displayName)}
                </avatar_1.AvatarFallback>
              </avatar_1.Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{plans_1.PLANS[store.credits.planId]?.name || 'Free'} plan</p>
              </div>
            </link_1.default>
            <button onClick={handleLogout} disabled={loggingOut} title="Sign out" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <lucide_react_1.LogOut className="h-4 w-4"/>
            </button>
          </div>

          <usage_meter_1.UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
          <usage_meter_1.UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count"/>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (<div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)}/>
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <logo_1.Logo size="sm"/>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground">
                <lucide_react_1.X className="h-5 w-5"/>
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (<link_1.default key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={(0, utils_1.cn)('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors', active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                    <item.icon className="h-4 w-4 shrink-0"/>
                    {item.label}
                  </link_1.default>);
            })}
            </nav>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between">
                <link_1.default href="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
                  <avatar_1.Avatar className="h-8 w-8 shrink-0">
                    <avatar_1.AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(displayName)}
                    </avatar_1.AvatarFallback>
                  </avatar_1.Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{plans_1.PLANS[store.credits.planId]?.name || 'Free'} plan</p>
                  </div>
                </link_1.default>
                <button onClick={handleLogout} disabled={loggingOut} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <lucide_react_1.LogOut className="h-4 w-4"/>
                </button>
              </div>
              <usage_meter_1.UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
              <usage_meter_1.UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count"/>
            </div>
          </aside>
        </div>)}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground lg:hidden">
            <lucide_react_1.Menu className="h-5 w-5"/>
          </button>
          <div className="hidden flex-1 sm:block">
            <div className="relative max-w-sm">
              <lucide_react_1.Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <input_1.Input placeholder="Search deals, clients..." className="h-9 pl-9"/>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative">
              <button_1.Button variant="ghost" size="icon" className="relative" onClick={() => setNotifOpen(!notifOpen)}>
                <lucide_react_1.Bell className="h-4 w-4"/>
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive"/>}
              </button_1.Button>
              {notifOpen && (<>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)}/>
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-border p-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <link_1.default href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-primary hover:underline">
                        View all
                      </link_1.default>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {store.notifications.length === 0 ? (<div className="p-4 text-center text-xs text-muted-foreground">
                          No notifications yet
                        </div>) : (store.notifications.slice(0, 5).map((n) => {
                const cfg = notifTypeConfig[n.type];
                return (<link_1.default key={n.id} href={n.dealId ? `/deals/${n.dealId}` : '/notifications'} onClick={() => setNotifOpen(false)} className={(0, utils_1.cn)('flex items-start gap-3 border-b border-border p-3 last:border-0 hover:bg-accent/30 transition-colors', !n.read && 'bg-primary/[0.02]')}>
                              <div className={(0, utils_1.cn)('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', cfg.color)}>
                                <cfg.icon className="h-3.5 w-3.5"/>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.description}</p>
                                <p className="text-xs text-muted-foreground/50 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                              </div>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"/>}
                            </link_1.default>);
            }))}
                    </div>
                  </div>
                </>)}
            </div>

            {/* Topbar User dropdown */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors">
                <avatar_1.Avatar className="h-8 w-8 cursor-pointer">
                  <avatar_1.AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(displayName)}
                  </avatar_1.AvatarFallback>
                </avatar_1.Avatar>
              </button>

              {userMenuOpen && (<>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}/>
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-lg p-1.5 space-y-1">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                    </div>
                    <link_1.default href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                      <lucide_react_1.Settings className="h-3.5 w-3.5"/>
                      Settings & Profile
                    </link_1.default>
                    <button onClick={() => {
                setUserMenuOpen(false);
                handleLogout();
            }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                      <lucide_react_1.LogOut className="h-3.5 w-3.5"/>
                      Log out
                    </button>
                  </div>
                </>)}
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
    </div>);
}
exports.AppShell = AppShell;
function PageHeader({ title, description, action, }) {
    return (<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>);
}
exports.PageHeader = PageHeader;
function Breadcrumb({ items }) {
    return (<nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => (<div key={i} className="flex items-center gap-1.5">
          {item.href ? (<link_1.default href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </link_1.default>) : (<span className="text-foreground font-medium">{item.label}</span>)}
          {i < items.length - 1 && <lucide_react_1.ChevronRight className="h-3.5 w-3.5"/>}
        </div>))}
    </nav>);
}
exports.Breadcrumb = Breadcrumb;
