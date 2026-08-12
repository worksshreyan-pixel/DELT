'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Check,
  Smartphone,
  Monitor,
  LogOut,
  AlertCircle,
} from 'lucide-react';
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

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

function getInitials(name: string) {
  if (!name) return 'YA';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function SettingsPage() {
  const router = useRouter();
  const store = useAppStore();
  const { user, profile, signOut, refresh } = useUser();

  const [profileName, setProfileName] = useState(profile?.displayName || store.user.displayName || '');
  const [profileEmail, setProfileEmail] = useState(profile?.email || store.user.email || '');
  const [profileCompany, setProfileCompany] = useState(profile?.company || store.user.company || '');
  const [profileProfession, setProfileProfession] = useState(profile?.profession || store.user.profession || '');
  const [profileBio, setProfileBio] = useState(profile?.bio || store.user.bio || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    messages: true,
    proposals: true,
    payments: true,
    fileUpdates: true,
    dealUpdates: true,
  });

  useEffect(() => {
    if (profile) {
      setProfileName(profile.displayName || '');
      setProfileEmail(profile.email || '');
      setProfileCompany(profile.company || '');
      setProfileProfession(profile.profession || '');
      setProfileBio(profile.bio || '');
    } else if (user) {
      setProfileName(user.user_metadata?.displayName || '');
      setProfileEmail(user.email || '');
    }
  }, [profile, user]);

  const plan = PLANS[store.credits.planId] || PLANS.free;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (hasSupabasePublicConfig() && user) {
      const supabase = createClient();
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

  async function handleUpdatePassword(e: React.FormEvent) {
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

    if (hasSupabasePublicConfig()) {
      const supabase = createClient();
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
    clearStoreState();
    await signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account profile and workspace configuration." />

      <Tabs defaultValue="profile">
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <TabsList className="w-auto">
            {sections.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                <s.icon className="h-3.5 w-3.5" />
                <span>{s.label}</span>
              </TabsTrigger>
            ))}
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
                    <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profileEmail} disabled className="opacity-80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Business / Studio name</Label>
                    <Input id="company" placeholder="e.g. Acme Design Studio" value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input id="profession" placeholder="e.g. Freelance Web Developer" value={profileProfession} onChange={(e) => setProfileProfession(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} placeholder="Brief summary of your expertise..." value={profileBio} onChange={(e) => setProfileBio(e.target.value)} />
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
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordMsg && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{passwordMsg}</span>
                    </div>
                  )}

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
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email verified</p>
                    <p className="text-xs text-muted-foreground">{profileEmail || user?.email || 'Active account'}</p>
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
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Active Workspace Session
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'Logged in'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="h-3.5 w-3.5" />
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
                { key: 'messages' as const, label: 'Messages', desc: 'When a client sends you a new message' },
                { key: 'proposals' as const, label: 'Price proposals', desc: 'When a proposal or counter offer is received' },
                { key: 'payments' as const, label: 'Payments', desc: 'When a payment is received or completed' },
                { key: 'fileUpdates' as const, label: 'File updates', desc: 'When deliverables are uploaded or reviewed' },
                { key: 'dealUpdates' as const, label: 'Deal updates', desc: 'When a deal status changes or completes' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                  />
                </div>
              ))}
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
                    <p className="text-lg font-semibold">{plan.price ? `${formatCurrency(plan.price)}/mo` : 'Free'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <UsageMeter used={store.credits.used} total={store.credits.total} label="Deal credits" unit="count" />
                  <UsageMeter used={store.storage.totalBytes} total={store.storage.limitBytes} label="Storage" unit="bytes" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
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
    </div>
  );
}
