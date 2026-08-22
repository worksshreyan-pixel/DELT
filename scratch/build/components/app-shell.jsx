'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, HardDrive, Settings, Bell, Search, Menu, X, ChevronRight, CheckCircle2, ArrowLeftRight, FileCheck, Flag, CreditCard, LogOut, User as UserIcon, } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UsageMeter } from '@/components/usage-meter';
import { cn } from '@/lib/utils';
import { PLANS } from '@/lib/plans';
import { useAppStore, clearStoreState } from '@/lib/app-store';
import { useUser } from '@/hooks/use-user';
var navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/deals', label: 'Deals', icon: FolderKanban },
    { href: '/clients', label: 'Clients', icon: UserIcon },
    { href: '/storage', label: 'Storage', icon: HardDrive },
    { href: '/transactions', label: 'Transactions', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings },
];
var notifTypeConfig = {
    new_message: { icon: Bell, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    new_proposal: { icon: ArrowLeftRight, color: 'text-primary bg-primary/10' },
    counter_offer: { icon: ArrowLeftRight, color: 'text-primary bg-primary/10' },
    payment_received: { icon: CreditCard, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    file_uploaded: { icon: FileCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
    deliverable_approved: { icon: FileCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
    change_request: { icon: Flag, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950' },
    deal_completed: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950' },
};
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
function getInitials(name) {
    if (!name)
        return 'YA';
    return name.split(' ').map(function (n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
}
export function AppShell(_a) {
    var _b, _c, _d;
    var children = _a.children;
    var pathname = usePathname();
    var router = useRouter();
    var store = useAppStore();
    var _e = useUser(), user = _e.user, profile = _e.profile, signOut = _e.signOut;
    var _f = useState(false), mobileOpen = _f[0], setMobileOpen = _f[1];
    var _g = useState(false), notifOpen = _g[0], setNotifOpen = _g[1];
    var _h = useState(false), userMenuOpen = _h[0], setUserMenuOpen = _h[1];
    var _j = useState(false), loggingOut = _j[0], setLoggingOut = _j[1];
    var unreadCount = store.notifications.filter(function (n) { return !n.read; }).length;
    var displayName = (profile === null || profile === void 0 ? void 0 : profile.displayName) || ((_b = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _b === void 0 ? void 0 : _b.displayName) || store.user.displayName || 'Creator';
    var displayEmail = (profile === null || profile === void 0 ? void 0 : profile.email) || (user === null || user === void 0 ? void 0 : user.email) || store.user.email || '';
    function handleLogout() {
        return __awaiter(this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoggingOut(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        clearStoreState();
                        return [4 /*yield*/, signOut()];
                    case 2:
                        _a.sent();
                        router.push('/login');
                        router.refresh();
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _a.sent();
                        console.error('Logout error:', err_1);
                        router.push('/login');
                        return [3 /*break*/, 5];
                    case 4:
                        setLoggingOut(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo size="sm"/>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map(function (item) {
            var active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (<Link key={item.href} href={item.href} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors', active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                <item.icon className="h-4 w-4 shrink-0"/>
                {item.label}
              </Link>);
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
                <p className="truncate text-xs text-muted-foreground">{((_c = PLANS[store.credits.planId]) === null || _c === void 0 ? void 0 : _c.name) || 'Free'} plan</p>
              </div>
            </Link>
            <button onClick={handleLogout} disabled={loggingOut} title="Sign out" className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-4 w-4"/>
            </button>
          </div>

          <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
          <UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count"/>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (<div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={function () { return setMobileOpen(false); }}/>
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Logo size="sm"/>
              <button onClick={function () { return setMobileOpen(false); }} className="text-muted-foreground">
                <X className="h-5 w-5"/>
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {navItems.map(function (item) {
                var active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (<Link key={item.href} href={item.href} onClick={function () { return setMobileOpen(false); }} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors', active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                    <item.icon className="h-4 w-4 shrink-0"/>
                    {item.label}
                  </Link>);
            })}
            </nav>
            <div className="space-y-3 border-t border-border p-4">
              <div className="flex items-center justify-between">
                <Link href="/settings" onClick={function () { return setMobileOpen(false); }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 flex-1">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{((_d = PLANS[store.credits.planId]) === null || _d === void 0 ? void 0 : _d.name) || 'Free'} plan</p>
                  </div>
                </Link>
                <button onClick={handleLogout} disabled={loggingOut} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="h-4 w-4"/>
                </button>
              </div>
              <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
              <UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count"/>
            </div>
          </aside>
        </div>)}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button onClick={function () { return setMobileOpen(true); }} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground lg:hidden">
            <Menu className="h-5 w-5"/>
          </button>
          <div className="hidden flex-1 sm:block">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input placeholder="Search deals, clients..." className="h-9 pl-9"/>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={function () { return setNotifOpen(!notifOpen); }}>
                <Bell className="h-4 w-4"/>
                {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive"/>}
              </Button>
              {notifOpen && (<>
                  <div className="fixed inset-0 z-40" onClick={function () { return setNotifOpen(false); }}/>
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card shadow-lg">
                    <div className="flex items-center justify-between border-b border-border p-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <Link href="/notifications" onClick={function () { return setNotifOpen(false); }} className="text-xs text-primary hover:underline">
                        View all
                      </Link>
                    </div>
                    <div className="max-h-80 overflow-y-auto scrollbar-thin">
                      {store.notifications.length === 0 ? (<div className="p-4 text-center text-xs text-muted-foreground">
                          No notifications yet
                        </div>) : (store.notifications.slice(0, 5).map(function (n) {
                var cfg = notifTypeConfig[n.type];
                return (<Link key={n.id} href={n.dealId ? "/deals/".concat(n.dealId) : '/notifications'} onClick={function () { return setNotifOpen(false); }} className={cn('flex items-start gap-3 border-b border-border p-3 last:border-0 hover:bg-accent/30 transition-colors', !n.read && 'bg-primary/[0.02]')}>
                              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', cfg.color)}>
                                <cfg.icon className="h-3.5 w-3.5"/>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.description}</p>
                                <p className="text-xs text-muted-foreground/50 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                              </div>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1"/>}
                            </Link>);
            }))}
                    </div>
                  </div>
                </>)}
            </div>

            {/* Topbar User dropdown */}
            <div className="relative">
              <button onClick={function () { return setUserMenuOpen(!userMenuOpen); }} className="flex items-center gap-2 rounded-full p-1 hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </button>

              {userMenuOpen && (<>
                  <div className="fixed inset-0 z-40" onClick={function () { return setUserMenuOpen(false); }}/>
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-lg p-1.5 space-y-1">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                    </div>
                    <Link href="/settings" onClick={function () { return setUserMenuOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                      <Settings className="h-3.5 w-3.5"/>
                      Settings & Profile
                    </Link>
                    <button onClick={function () {
                setUserMenuOpen(false);
                handleLogout();
            }} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut className="h-3.5 w-3.5"/>
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
export function PageHeader(_a) {
    var title = _a.title, description = _a.description, action = _a.action;
    return (<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>);
}
export function Breadcrumb(_a) {
    var items = _a.items;
    return (<nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map(function (item, i) { return (<div key={i} className="flex items-center gap-1.5">
          {item.href ? (<Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>) : (<span className="text-foreground font-medium">{item.label}</span>)}
          {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5"/>}
        </div>); })}
    </nav>);
}
