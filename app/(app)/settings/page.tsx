'use client';

import { useState } from 'react';
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Settings as SettingsIcon,
  Mail,
  Check,
  Smartphone,
  Monitor,
  Globe,
  HardDrive,
  Zap,
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
import { CURRENT_USER, DEMO_CREDITS, DEMO_STORAGE } from '@/lib/demo-data';
import { PLANS, formatBytes, formatCurrency } from '@/lib/plans';

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'preferences', label: 'Deal Preferences', icon: SettingsIcon },
];

const sessions = [
  { device: 'MacBook Pro', browser: 'Chrome', location: 'Bengaluru, IN', current: true, icon: Monitor },
  { device: 'iPhone 14', browser: 'Safari', location: 'Bengaluru, IN', current: false, icon: Smartphone },
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    messages: true,
    proposals: true,
    payments: true,
    fileUpdates: true,
    dealUpdates: true,
  });
  const [preferences, setPreferences] = useState({
    defaultCurrency: 'INR',
    defaultDeadlineDays: '14',
    notifyOnMessage: true,
    notifyOnProposal: true,
  });

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <Tabs defaultValue="profile">
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <TabsList className="w-auto">
            {sections.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">{getInitials(CURRENT_USER.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Change avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1.5">JPG or PNG. Max 2MB.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" defaultValue={CURRENT_USER.displayName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={CURRENT_USER.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Business name</Label>
                  <Input id="company" defaultValue={CURRENT_USER.company || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input id="profession" defaultValue={CURRENT_USER.profession || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={3} defaultValue={CURRENT_USER.bio || ''} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <div className="space-y-4 max-w-2xl">
            <Card>
              <CardHeader><CardTitle className="text-base">Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" placeholder="••••••••" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>Update password</Button>
                </div>
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
                    <p className="text-xs text-muted-foreground">{CURRENT_USER.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Active Sessions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.device} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <session.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {session.device}
                        {session.current && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Current</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{session.browser} · {session.location}</p>
                    </div>
                    {!session.current && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground">Revoke</Button>
                    )}
                  </div>
                ))}
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
                { key: 'payments' as const, label: 'Payments', desc: 'When a payment is received or fails' },
                { key: 'fileUpdates' as const, label: 'File updates', desc: 'When files are uploaded or approved' },
                { key: 'dealUpdates' as const, label: 'Deal updates', desc: 'When a deal status changes or is completed' },
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
              <CardHeader><CardTitle className="text-base">Current Plan</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-lg font-display font-semibold">{PLANS[DEMO_CREDITS.planId].name}</p>
                    <p className="text-sm text-muted-foreground">{PLANS[DEMO_CREDITS.planId].description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(PLANS[DEMO_CREDITS.planId].price || 0)}/mo</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <UsageMeter used={DEMO_CREDITS.used} total={DEMO_CREDITS.total} label="Deal credits" unit="count" />
                  <UsageMeter used={DEMO_STORAGE.totalBytes} total={DEMO_STORAGE.limitBytes} label="Storage" unit="bytes" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline">Change plan</Button>
                  <Button variant="ghost" className="text-muted-foreground">Cancel subscription</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Billing Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingName">Billing name</Label>
                    <Input id="billingName" defaultValue={CURRENT_USER.displayName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail">Billing email</Label>
                    <Input id="billingEmail" type="email" defaultValue={CURRENT_USER.email} />
                  </div>
                </div>
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No payment method on file</p>
                  <Button variant="outline" size="sm" className="mt-2">Add payment method</Button>
                </div>
                <p className="text-xs text-muted-foreground/60 text-center">
                  Billing is not yet active. This is a demo view of your billing settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deal Preferences */}
        <TabsContent value="preferences" className="mt-4">
          <Card className="max-w-2xl">
            <CardHeader><CardTitle className="text-base">Deal Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default currency</Label>
                  <select
                    id="defaultCurrency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={preferences.defaultCurrency}
                    onChange={(e) => setPreferences({ ...preferences, defaultCurrency: e.target.value })}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultDeadline">Default deadline (days)</Label>
                  <Input
                    id="defaultDeadline"
                    type="number"
                    value={preferences.defaultDeadlineDays}
                    onChange={(e) => setPreferences({ ...preferences, defaultDeadlineDays: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="flex items-center justify-between rounded-lg px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">Notify on new message</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Send a notification when a client messages on a deal</p>
                  </div>
                  <Switch
                    checked={preferences.notifyOnMessage}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, notifyOnMessage: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg px-3 py-3">
                  <div>
                    <p className="text-sm font-medium">Notify on price proposal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Send a notification when a proposal is received</p>
                  </div>
                  <Switch
                    checked={preferences.notifyOnProposal}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, notifyOnProposal: checked })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline">Reset</Button>
                <Button>Save preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
