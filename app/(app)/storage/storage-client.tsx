'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HardDrive,
  AlertTriangle,
  FileCheck,
  GitBranch,
  Paperclip,
  File,
  Upload,
  ArrowRight,
  Lock,
  Cloud,
  Server,
  Box,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsageMeter } from '@/components/usage-meter';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { formatBytes, PLANS, STORAGE_ADDONS, formatCurrency } from '@/lib/plans';
import { disconnectStorageConnection } from './actions';

export default function StorageClient({ initialConnections = [] }: { initialConnections: any[] }) {
  const [connections, setConnections] = useState<any[]>(initialConnections);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  const handleDisconnect = async (id: string) => {
    setIsDisconnecting(id);
    try {
      await disconnectStorageConnection(id);
      setConnections(connections.map(c => c.id === id ? { ...c, status: 'disconnected', disconnected_at: new Date().toISOString() } : c));
    } catch (e) {
      alert('Failed to disconnect. Please try again.');
    } finally {
      setIsDisconnecting(null);
    }
  };

  const googleDriveConn = connections.find(c => c.provider === 'google_drive' && c.status === 'connected');
  const store = useAppStore();
  const { totalBytes, limitBytes, breakdown } = store.storage;
  const usagePercent = limitBytes > 0 ? Math.round((totalBytes / limitBytes) * 100) : 0;
  const remaining = Math.max(0, limitBytes - totalBytes);
  const planName = PLANS[store.credits.planId]?.name || 'Free';
  const planStorage = PLANS[store.credits.planId]?.storageBytes || limitBytes;

  const isWarning = usagePercent >= 80 && usagePercent < 100;
  const isFull = usagePercent >= 100;

  const breakdownItems = [
    { label: 'Deliverable files', bytes: breakdown.files, icon: FileCheck, color: 'text-blue-500' },
    { label: 'File versions', bytes: breakdown.versions, icon: GitBranch, color: 'text-amber-500' },
    { label: 'Chat attachments', bytes: breakdown.attachments, icon: Paperclip, color: 'text-emerald-500' },
  ];

  // Extract all file versions across deals
  const allVersions = Object.values(store.fileVersions).flat();
  const allFiles = allVersions.flatMap((v) => v.files || []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storage"
        description={`${formatBytes(totalBytes)} of ${formatBytes(limitBytes)} used`}
      />

      {/* Warning banners */}
      {isWarning && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                You are approaching your storage limit.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {usagePercent}% used. Consider upgrading your plan or adding storage to avoid interruptions.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      {isFull && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Storage limit reached. New uploads are temporarily unavailable.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your existing files are safe. Upgrade your plan or add storage to resume uploading.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main storage meter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isFull ? 'bg-destructive/10' : isWarning ? 'bg-amber-100 dark:bg-amber-950' : 'bg-primary/5'}`}>
              <HardDrive className={`h-7 w-7 ${isFull ? 'text-destructive' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-display font-semibold tabular-nums">
                {formatBytes(totalBytes)}
                <span className="text-base font-normal text-muted-foreground"> / {formatBytes(limitBytes)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {usagePercent}% used · {formatBytes(remaining)} remaining
              </p>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(usagePercent, totalBytes > 0 ? 2 : 0)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${isFull ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}`}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-sm font-semibold mt-0.5">{formatBytes(totalBytes)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-semibold mt-0.5">{formatBytes(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Included in plan</p>
              <p className="text-sm font-semibold mt-0.5">{formatBytes(planStorage)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="text-sm font-semibold mt-0.5">{planName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Storage Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {breakdownItems.map((item) => {
              const pct = totalBytes > 0 ? Math.round((item.bytes / totalBytes) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">{formatBytes(item.bytes)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-border">
              <UsageMeter used={totalBytes} total={limitBytes} label="Total usage" unit="bytes" />
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        <Card>
          <CardHeader><CardTitle className="text-base">Files & Deliverables</CardTitle></CardHeader>
          <CardContent>
            {allFiles.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="No files uploaded yet"
                description="Deliverables and files uploaded to your Deal workspaces will appear here."
              />
            ) : (
              <div className="space-y-2">
                {allFiles.map((file: any) => {
                  const isExternal = file.ownershipType === 'CUSTOMER_MANAGED' || (file.provider && file.provider !== 'supabase');
                  const providerName = isExternal ? (file.provider || 'External Storage') : 'Supabase';
                  
                  return (
                    <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                        <File className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate flex items-center gap-2">
                          {file.name}
                          {isExternal ? (
                             <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm dark:bg-blue-900/30 dark:text-blue-400">External ({providerName})</span>
                          ) : (
                             <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-sm dark:bg-gray-800 dark:text-gray-400">DELT Storage</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isExternal ? 'Referenced file' : formatBytes(file.size || 0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage Providers */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Storage Providers</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose where DELT stores your files.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* DELT Storage */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  DELT Storage
                </CardTitle>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </div>
              </div>
              <CardDescription>
                Default cloud storage managed securely by DELT.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Google Drive */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  Google Drive
                </CardTitle>
                {googleDriveConn ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Not connected
                  </div>
                )}
              </div>
              <CardDescription>
                Creators can connect their own Google Drive for customer-managed storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {googleDriveConn ? (
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{googleDriveConn.displayName || 'Google Account'}</p>
                    <p className="text-xs text-muted-foreground">Status: Active</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => alert('Manage UI coming soon.')}>
                      Manage
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="gap-2"
                      disabled={isDisconnecting === googleDriveConn.id}
                      onClick={() => handleDisconnect(googleDriveConn.id)}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border pt-4">
                  <Button 
                    className="w-full sm:w-auto"
                    onClick={() => alert('Google Drive connection setup coming next')}
                  >
                    Connect Google Drive
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dropbox */}
          <Card className="opacity-60 grayscale">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Dropbox
                </CardTitle>
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming soon
                </div>
              </div>
              <CardDescription>
                Store your deal deliverables directly in Dropbox.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* OneDrive */}
          <Card className="opacity-60 grayscale">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  OneDrive
                </CardTitle>
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming soon
                </div>
              </div>
              <CardDescription>
                Store your deal deliverables directly in OneDrive.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Amazon S3 */}
          <Card className="opacity-60 grayscale md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Amazon S3
                </CardTitle>
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming soon
                </div>
              </div>
              <CardDescription>
                Connect your own AWS S3 bucket for enterprise-grade custom storage routing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Upgrade CTA */}
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Need more storage?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add storage to your workspace or upgrade for higher file limits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STORAGE_ADDONS.map((addon) => (
              <div key={addon.id} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-center">
                <span className="text-sm font-semibold">{addon.label}</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(addon.price)}/mo</span>
                <Button size="sm" variant="outline" className="mt-1 gap-1 text-xs">
                  Add
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
