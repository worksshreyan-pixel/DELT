'use client';

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
} from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UsageMeter } from '@/components/usage-meter';
import { EmptyState } from '@/components/empty-state';
import { useAppStore } from '@/lib/app-store';
import { formatBytes, PLANS, STORAGE_ADDONS, formatCurrency } from '@/lib/plans';

export default function StoragePage() {
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
                {allFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <File className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
