"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const app_shell_1 = require("@/components/app-shell");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const switch_1 = require("@/components/ui/switch");
const avatar_1 = require("@/components/ui/avatar");
const usage_meter_1 = require("@/components/usage-meter");
const tabs_1 = require("@/components/ui/tabs");
const app_store_1 = require("@/lib/app-store");
const use_user_1 = require("@/hooks/use-user");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
const plans_1 = require("@/lib/plans");
const sections = [
    { id: 'profile', label: 'Profile', icon: lucide_react_1.User },
    { id: 'security', label: 'Security', icon: lucide_react_1.Shield },
    { id: 'notifications', label: 'Notifications', icon: lucide_react_1.Bell },
    { id: 'billing', label: 'Billing', icon: lucide_react_1.CreditCard },
];
function getInitials(name) {
    if (!name)
        return 'YA';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
function SettingsPage() {
    const router = (0, navigation_1.useRouter)();
    const store = (0, app_store_1.useAppStore)();
    const { user, profile, signOut, refresh } = (0, use_user_1.useUser)();
    const [profileName, setProfileName] = (0, react_1.useState)(profile?.displayName || store.user.displayName || '');
    const [profileEmail, setProfileEmail] = (0, react_1.useState)(profile?.email || store.user.email || '');
    const [profileCompany, setProfileCompany] = (0, react_1.useState)(profile?.company || store.user.company || '');
    const [profileProfession, setProfileProfession] = (0, react_1.useState)(profile?.profession || store.user.profession || '');
    const [profileBio, setProfileBio] = (0, react_1.useState)(profile?.bio || store.user.bio || '');
    const [saved, setSaved] = (0, react_1.useState)(false);
    const [saving, setSaving] = (0, react_1.useState)(false);
    // Password update state
    const [newPassword, setNewPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [passwordMsg, setPasswordMsg] = (0, react_1.useState)('');
    const [passwordError, setPasswordError] = (0, react_1.useState)('');
    const [updatingPassword, setUpdatingPassword] = (0, react_1.useState)(false);
    const [notifications, setNotifications] = (0, react_1.useState)({
        messages: true,
        proposals: true,
        payments: true,
        fileUpdates: true,
        dealUpdates: true,
    });
    (0, react_1.useEffect)(() => {
        if (profile) {
            setProfileName(profile.displayName || '');
            setProfileEmail(profile.email || '');
            setProfileCompany(profile.company || '');
            setProfileProfession(profile.profession || '');
            setProfileBio(profile.bio || '');
        }
        else if (user) {
            setProfileName(user.user_metadata?.displayName || '');
            setProfileEmail(user.email || '');
        }
    }, [profile, user]);
    const plan = plans_1.PLANS[store.credits.planId] || plans_1.PLANS.free;
    async function handleSaveProfile(e) {
        e.preventDefault();
        setSaving(true);
        if ((0, env_1.hasSupabasePublicConfig)() && user) {
            const supabase = (0, client_1.createClient)();
            await supabase
                .from('profiles')
                .upsert({
                id: user.id,
                email: profileEmail,
                display_name: profileName,
                company: profileCompany,
                profession: profileProfession,
                bio: profileBio,
                updated_at: new Date().toISOString(),
            });
            await refresh();
        }
        setSaved(true);
        setSaving(false);
        setTimeout(() => setSaved(false), 2500);
    }
    async function handleUpdatePassword(e) {
        e.preventDefault();
        setPasswordMsg('');
        setPasswordError('');
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }
        setUpdatingPassword(true);
        if ((0, env_1.hasSupabasePublicConfig)()) {
            const supabase = (0, client_1.createClient)();
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                setPasswordError(error.message);
                setUpdatingPassword(false);
                return;
            }
        }
        setPasswordMsg('Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
        setUpdatingPassword(false);
        setTimeout(() => setPasswordMsg(''), 3000);
    }
    async function handleLogout() {
        (0, app_store_1.clearStoreState)();
        await signOut();
        router.push('/login');
        router.refresh();
    }
    return (<div className="space-y-6">
      <app_shell_1.PageHeader title="Settings" description="Manage your account profile and workspace configuration."/>

      <tabs_1.Tabs defaultValue="profile">
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <tabs_1.TabsList className="w-auto">
            {sections.map((s) => (<tabs_1.TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                <s.icon className="h-3.5 w-3.5"/>
                <span>{s.label}</span>
              </tabs_1.TabsTrigger>))}
          </tabs_1.TabsList>
        </div>

        {/* Profile */}
        <tabs_1.TabsContent value="profile" className="mt-4">
          <card_1.Card className="max-w-2xl">
            <card_1.CardHeader><card_1.CardTitle className="text-base">Profile Details</card_1.CardTitle></card_1.CardHeader>
            <card_1.CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <avatar_1.Avatar className="h-16 w-16">
                    <avatar_1.AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(profileName)}
                    </avatar_1.AvatarFallback>
                  </avatar_1.Avatar>
                  <div>
                    <button_1.Button type="button" variant="outline" size="sm">Change avatar</button_1.Button>
                    <p className="text-xs text-muted-foreground mt-1.5">JPG or PNG. Max 2MB.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="name">Full name</label_1.Label>
                    <input_1.Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="email">Email</label_1.Label>
                    <input_1.Input id="email" type="email" value={profileEmail} disabled className="opacity-80"/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="company">Business / Studio name</label_1.Label>
                    <input_1.Input id="company" placeholder="e.g. Acme Design Studio" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)}/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="profession">Profession</label_1.Label>
                    <input_1.Input id="profession" placeholder="e.g. Freelance Web Developer" value={profileProfession} onChange={(e) => setProfileProfession(e.target.value)}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <label_1.Label htmlFor="bio">Bio</label_1.Label>
                  <textarea_1.Textarea id="bio" rows={3} placeholder="Brief summary of your expertise..." value={profileBio} onChange={(e) => setProfileBio(e.target.value)}/>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  {saved && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Changes saved</span>}
                  <button_1.Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button_1.Button>
                </div>
              </form>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Security */}
        <tabs_1.TabsContent value="security" className="mt-4">
          <div className="space-y-4 max-w-2xl">
            <card_1.Card>
              <card_1.CardHeader><card_1.CardTitle className="text-base">Password & Authentication</card_1.CardTitle></card_1.CardHeader>
              <card_1.CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label_1.Label htmlFor="newPassword">New password</label_1.Label>
                      <input_1.Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
                    </div>
                    <div className="space-y-2">
                      <label_1.Label htmlFor="confirmPassword">Confirm password</label_1.Label>
                      <input_1.Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
                    </div>
                  </div>

                  {passwordError && (<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                      <lucide_react_1.AlertCircle className="h-4 w-4 shrink-0"/>
                      <span>{passwordError}</span>
                    </div>)}

                  {passwordMsg && (<div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <lucide_react_1.Check className="h-4 w-4 shrink-0"/>
                      <span>{passwordMsg}</span>
                    </div>)}

                  <div className="flex justify-end">
                    <button_1.Button type="submit" disabled={updatingPassword || !newPassword}>
                      {updatingPassword ? 'Updating...' : 'Update password'}
                    </button_1.Button>
                  </div>
                </form>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader><card_1.CardTitle className="text-base">Email Verification</card_1.CardTitle></card_1.CardHeader>
              <card_1.CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <lucide_react_1.Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400"/>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email verified</p>
                    <p className="text-xs text-muted-foreground">{profileEmail || user?.email || 'Active account'}</p>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader><card_1.CardTitle className="text-base">Sign Out & Sessions</card_1.CardTitle></card_1.CardHeader>
              <card_1.CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <lucide_react_1.Monitor className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Active Workspace Session
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'Logged in'}</p>
                    </div>
                  </div>
                  <button_1.Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <lucide_react_1.LogOut className="h-3.5 w-3.5"/>
                    Sign out
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>

        {/* Notifications */}
        <tabs_1.TabsContent value="notifications" className="mt-4">
          <card_1.Card className="max-w-2xl">
            <card_1.CardHeader><card_1.CardTitle className="text-base">Notification Preferences</card_1.CardTitle></card_1.CardHeader>
            <card_1.CardContent className="space-y-1">
              {[
            { key: 'messages', label: 'Messages', desc: 'When a client sends you a new message' },
            { key: 'proposals', label: 'Price proposals', desc: 'When a proposal or counter offer is received' },
            { key: 'payments', label: 'Payments', desc: 'When a payment is received or completed' },
            { key: 'fileUpdates', label: 'File updates', desc: 'When deliverables are uploaded or reviewed' },
            { key: 'dealUpdates', label: 'Deal updates', desc: 'When a deal status changes or completes' },
        ].map((item) => (<div key={item.key} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <switch_1.Switch checked={notifications[item.key]} onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}/>
                </div>))}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Billing */}
        <tabs_1.TabsContent value="billing" className="mt-4">
          <div className="space-y-4 max-w-2xl">
            <card_1.Card>
              <card_1.CardHeader><card_1.CardTitle className="text-base">Current Subscription</card_1.CardTitle></card_1.CardHeader>
              <card_1.CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-display font-semibold">{plan.name} Plan</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{plan.price ? `${(0, plans_1.formatCurrency)(plan.price)}/mo` : 'Free'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <usage_meter_1.UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count"/>
                  <usage_meter_1.UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes"/>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardHeader><card_1.CardTitle className="text-base">Payment Method</card_1.CardTitle></card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <lucide_react_1.CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-2"/>
                  <p className="text-sm text-muted-foreground">No payment method on file</p>
                  <button_1.Button variant="outline" size="sm" className="mt-3">Add payment method</button_1.Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Subscription billing is ready for payment gateway integration.
                </p>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
exports.default = SettingsPage;
