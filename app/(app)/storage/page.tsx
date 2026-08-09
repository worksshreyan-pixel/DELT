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
import { DEMO_STORAGE, DEMO_FILE_VERSIONS, CURRENT_USER } from '@/lib/demo-data';
import { formatBytes, PLANS, STORAGE_ADDONS, formatCurrency } from '@/lib/plans';

const recentUploads = [
  { name: 'booking-flow-v2.fig', size: 31_800_000, deal: 'Clinic Website Redesign', date: '2025-08-05' },
  { name: 'homepage-v1.fig', size: 24_500_000, deal: 'Clinic Website Redesign', date: '2025-08-01' },
  { name: 'dark-mode-preview.png', size: 2_800_000, deal: 'Clinic Website Redesign', date: '2025-08-05' },
  { name: 'homepage-v1-preview.png', size: 3_200_000, deal: 'Clinic Website Redesign', date: '2025-08-01' },
  { name: 'mobile-views.png', size: 1_900_000, deal: 'Clinic Website Redesign', date: '2025-08-05' },
];

export default function StoragePage() {
  const { totalBytes, limitBytes, breakdown } = DEMO_STORAGE;
  const usagePercent = Math.round((totalBytes / limitBytes) * 100);
  const remaining = limitBytes - totalBytes;
  const planStorage = PLANS.creator.storageBytes;

  const isWarning = usagePercent >= 80 && usagePercent < 100;
  const isFull = usagePercent >= 100;

  const breakdownItems = [
    { label: 'Deliverable files', bytes: breakdown.files, icon: FileCheck, color: 'text-blue-500' },
    { label: 'File versions', bytes: breakdown.versions, icon: GitBranch, color: 'text-amber-500' },
    { label: 'Chat attachments', bytes: breakdown.attachments, icon: Paperclip, color: 'text-emerald-500' },
  ];

  return (
    <div>
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
      <Card className="mb-4">
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
              animate={{ width: `${usagePercent}%` }}
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
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm font-semibold mt-0.5">{PLANS.creator.name}</p>
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
              const pct = Math.round((item.bytes / totalBytes) * 100);
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

        {/* Largest files */}
        <Card>
          <CardHeader><CardTitle className="text-base">Largest Files</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...recentUploads].sort((a, b) => b.size - a.size).slice(0, 5).map((file) => (
              <div key={file.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                  <File className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.deal}</p>
                </div>
                <span className="text-sm text-muted-foreground tabular-nums shrink-0">{formatBytes(file.size)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent uploads */}
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Recent Uploads</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentUploads.map((file) => (
            <div key={file.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.deal} · {new Date(file.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums shrink-0">{formatBytes(file.size)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card className="mt-4 border-primary/20">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Need more storage?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add storage to your plan or upgrade for higher limits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STORAGE_ADDONS.map((addon) => (
              <div key={addon.id} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-center">
                <span className="text-sm font-semibold">{addon.label}</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(addon.price)}/mo</span>
                <Button size="sm" variant="outline" className="mt-1 gap-1">
                  Add
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground/60">
        Storage billing is not yet active. This is a demo view of your storage usage.
      </p>
    </div>
  );
}
