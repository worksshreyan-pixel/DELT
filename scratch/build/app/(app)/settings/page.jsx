'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Bell, CreditCard, Check, Monitor, LogOut, AlertCircle, } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UsageMeter } from '@/components/usage-meter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore, clearStoreState } from '@/lib/app-store';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { PLANS, formatCurrency } from '@/lib/plans';
var sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
];
function getInitials(name) {
    if (!name)
        return 'YA';
    return name.split(' ').map(function (n) { return n[0]; }).slice(0, 2).join('').toUpperCase();
}
export default function SettingsPage() {
    var router = useRouter();
    var store = useAppStore();
    var _a = useUser(), user = _a.user, profile = _a.profile, signOut = _a.signOut, refresh = _a.refresh;
    var _b = useState((profile === null || profile === void 0 ? void 0 : profile.displayName) || store.user.displayName || ''), profileName = _b[0], setProfileName = _b[1];
    var _c = useState((profile === null || profile === void 0 ? void 0 : profile.email) || store.user.email || ''), profileEmail = _c[0], setProfileEmail = _c[1];
    var _d = useState((profile === null || profile === void 0 ? void 0 : profile.company) || store.user.company || ''), profileCompany = _d[0], setProfileCompany = _d[1];
    var _e = useState((profile === null || profile === void 0 ? void 0 : profile.profession) || store.user.profession || ''), profileProfession = _e[0], setProfileProfession = _e[1];
    var _f = useState((profile === null || profile === void 0 ? void 0 : profile.bio) || store.user.bio || ''), profileBio = _f[0], setProfileBio = _f[1];
    var _g = useState(false), saved = _g[0], setSaved = _g[1];
    var _h = useState(false), saving = _h[0], setSaving = _h[1];
    // Password update state
    var _j = useState(''), newPassword = _j[0], setNewPassword = _j[1];
    var _k = useState(''), confirmPassword = _k[0], setConfirmPassword = _k[1];
    var _l = useState(''), passwordMsg = _l[0], setPasswordMsg = _l[1];
    var _m = useState(''), passwordError = _m[0], setPasswordError = _m[1];
    var _o = useState(false), updatingPassword = _o[0], setUpdatingPassword = _o[1];
    var _p = useState({
        messages: true,
        proposals: true,
        payments: true,
        fileUpdates: true,
        dealUpdates: true,
    }), notifications = _p[0], setNotifications = _p[1];
    useEffect(function () {
        var _a;
        if (profile) {
            setProfileName(profile.displayName || '');
            setProfileEmail(profile.email || '');
            setProfileCompany(profile.company || '');
            setProfileProfession(profile.profession || '');
            setProfileBio(profile.bio || '');
        }
        else if (user) {
            setProfileName(((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.displayName) || '');
            setProfileEmail(user.email || '');
        }
    }, [profile, user]);
    var plan = PLANS[store.credits.planId] || PLANS.free;
    function handleSaveProfile(e) {
        return __awaiter(this, void 0, void 0, function () {
            var supabase;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        setSaving(true);
                        if (!(hasSupabasePublicConfig() && user)) return [3 /*break*/, 3];
                        supabase = createClient();
                        return [4 /*yield*/, supabase
                                .from('profiles')
                                .upsert({
                                id: user.id,
                                email: profileEmail,
                                display_name: profileName,
                                company: profileCompany,
                                profession: profileProfession,
                                bio: profileBio,
                                updated_at: new Date().toISOString(),
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, refresh()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        setSaved(true);
                        setSaving(false);
                        setTimeout(function () { return setSaved(false); }, 2500);
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleUpdatePassword(e) {
        return __awaiter(this, void 0, void 0, function () {
            var supabase, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        e.preventDefault();
                        setPasswordMsg('');
                        setPasswordError('');
                        if (newPassword.length < 8) {
                            setPasswordError('Password must be at least 8 characters long.');
                            return [2 /*return*/];
                        }
                        if (newPassword !== confirmPassword) {
                            setPasswordError('Passwords do not match.');
                            return [2 /*return*/];
                        }
                        setUpdatingPassword(true);
                        if (!hasSupabasePublicConfig()) return [3 /*break*/, 2];
                        supabase = createClient();
                        return [4 /*yield*/, supabase.auth.updateUser({ password: newPassword })];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            setPasswordError(error.message);
                            setUpdatingPassword(false);
                            return [2 /*return*/];
                        }
                        _a.label = 2;
                    case 2:
                        setPasswordMsg('Password updated successfully.');
                        setNewPassword('');
                        setConfirmPassword('');
                        setUpdatingPassword(false);
                        setTimeout(function () { return setPasswordMsg(''); }, 3000);
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleLogout() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clearStoreState();
                        return [4 /*yield*/, signOut()];
                    case 1:
                        _a.sent();
                        router.push('/login');
                        router.refresh();
                        return [2 /*return*/];
                }
            });
        });
    }
    return (<div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account profile and workspace configuration."/>

      <Tabs defaultValue="profile">
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <TabsList className="w-auto">
            {sections.map(function (s) { return (<TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                <s.icon className="h-3.5 w-3.5"/>
                <span>{s.label}</span>
              </TabsTrigger>); })}
          </TabsList>
        </div>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Profile Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(profileName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button type="button" variant="outline" size="sm">Change avatar</Button>
                    <p className="text-xs text-muted-foreground mt-1.5">JPG or PNG. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={profileName} onChange={function (e) { return setProfileName(e.target.value); }} required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profileEmail} disabled className="opacity-80"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Business / Studio name</Label>
                    <Input id="company" placeholder="e.g. Acme Design Studio" value={profileCompany} onChange={function (e) { return setProfileCompany(e.target.value); }}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" placeholder="e.g. Freelance Web Developer" value={profileProfession} onChange={function (e) { return setProfileProfession(e.target.value); }}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} placeholder="Brief summary of your expertise..." value={profileBio} onChange={function (e) { return setProfileBio(e.target.value); }}/>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {saved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Changes saved</span>}
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader><CardTitle className="text-base">Password & Authentication</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New password</Label>
                      <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={function (e) { return setNewPassword(e.target.value); }} required/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={function (e) { return setConfirmPassword(e.target.value); }} required/>
                    </div>
                  </div>

                  {passwordError && (<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0"/>
                      <span>{passwordError}</span>
                    </div>)}

                  {passwordMsg && (<div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <Check className="h-4 w-4 shrink-0"/>
                      <span>{passwordMsg}</span>
                    </div>)}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updatingPassword || !newPassword}>
                      {updatingPassword ? 'Updating...' : 'Update password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Email Verification</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400"/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email verified</p>
                    <p className="text-xs text-muted-foreground">{profileEmail || (user === null || user === void 0 ? void 0 : user.email) || 'Active account'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sign Out & Sessions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Monitor className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Active Workspace Session
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{(user === null || user === void 0 ? void 0 : user.email) || 'Logged in'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="h-3.5 w-3.5"/>
                    Sign out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {[
            { key: 'messages', label: 'Messages', desc: 'When a client sends you a new message' },
            { key: 'proposals', label: 'Price proposals', desc: 'When a proposal or counter offer is received' },
            { key: 'payments', label: 'Payments', desc: 'When a payment is received or completed' },
            { key: 'fileUpdates', label: 'File updates', desc: 'When deliverables are uploaded or reviewed' },
            { key: 'dealUpdates', label: 'Deal updates', desc: 'When a deal status changes or completes' },
        ].map(function (item) { return (<div key={item.key} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={function (checked) {
            var _a;
            return setNotifications(__assign(__assign({}, notifications), (_a = {}, _a[item.key] = checked, _a)));
        }}/>
                </div>); })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader><CardTitle className="text-base">Current Subscription</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-display font-semibold">{plan.name} Plan</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{plan.price ? "".concat(formatCurrency(plan.price), "/mo") : 'Free'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count"/>
                  <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-2"/>
                  <p className="text-sm text-muted-foreground">No payment method on file</p>
                  <Button variant="outline" size="sm" className="mt-3">Add payment method</Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Subscription billing is ready for payment gateway integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>);
}
