"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const app_shell_1 = require("@/components/app-shell");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const usage_meter_1 = require("@/components/usage-meter");
const empty_state_1 = require("@/components/empty-state");
const app_store_1 = require("@/lib/app-store");
const plans_1 = require("@/lib/plans");
function StoragePage() {
    const store = (0, app_store_1.useAppStore)();
    const { totalBytes, limitBytes, breakdown } = store.storage;
    const usagePercent = limitBytes > 0 ? Math.round((totalBytes / limitBytes) * 100) : 0;
    const remaining = Math.max(0, limitBytes - totalBytes);
    const planName = plans_1.PLANS[store.credits.planId]?.name || 'Free';
    const planStorage = plans_1.PLANS[store.credits.planId]?.storageBytes || limitBytes;
    const isWarning = usagePercent >= 80 && usagePercent < 100;
    const isFull = usagePercent >= 100;
    const breakdownItems = [
        { label: 'Deliverable files', bytes: breakdown.files, icon: lucide_react_1.FileCheck, color: 'text-blue-500' },
        { label: 'File versions', bytes: breakdown.versions, icon: lucide_react_1.GitBranch, color: 'text-amber-500' },
        { label: 'Chat attachments', bytes: breakdown.attachments, icon: lucide_react_1.Paperclip, color: 'text-emerald-500' },
    ];
    // Extract all file versions across deals
    const allVersions = Object.values(store.fileVersions).flat();
    const allFiles = allVersions.flatMap((v) => v.files || []);
    return (<div className="space-y-6">
      <app_shell_1.PageHeader title="Storage" description={`${(0, plans_1.formatBytes)(totalBytes)} of ${(0, plans_1.formatBytes)(limitBytes)} used`}/>

      {/* Warning banners */}
      {isWarning && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <lucide_react_1.AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                You are approaching your storage limit.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {usagePercent}% used. Consider upgrading your plan or adding storage to avoid interruptions.
              </p>
            </div>
          </div>
        </framer_motion_1.motion.div>)}
      {isFull && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <lucide_react_1.Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-medium text-destructive">
                Storage limit reached. New uploads are temporarily unavailable.
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your existing files are safe. Upgrade your plan or add storage to resume uploading.
              </p>
            </div>
          </div>
        </framer_motion_1.motion.div>)}

      {/* Main storage meter */}
      <card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isFull ? 'bg-destructive/10' : isWarning ? 'bg-amber-100 dark:bg-amber-950' : 'bg-primary/5'}`}>
              <lucide_react_1.HardDrive className={`h-7 w-7 ${isFull ? 'text-destructive' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}/>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-display font-semibold tabular-nums">
                {(0, plans_1.formatBytes)(totalBytes)}
                <span className="text-base font-normal text-muted-foreground"> / {(0, plans_1.formatBytes)(limitBytes)}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {usagePercent}% used · {(0, plans_1.formatBytes)(remaining)} remaining
              </p>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <framer_motion_1.motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(usagePercent, totalBytes > 0 ? 2 : 0)}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className={`h-full rounded-full ${isFull ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}`}/>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-sm font-semibold mt-0.5">{(0, plans_1.formatBytes)(totalBytes)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-semibold mt-0.5">{(0, plans_1.formatBytes)(remaining)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Included in plan</p>
              <p className="text-sm font-semibold mt-0.5">{(0, plans_1.formatBytes)(planStorage)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="text-sm font-semibold mt-0.5">{planName}</p>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Breakdown */}
        <card_1.Card>
          <card_1.CardHeader><card_1.CardTitle className="text-base">Storage Breakdown</card_1.CardTitle></card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            {breakdownItems.map((item) => {
            const pct = totalBytes > 0 ? Math.round((item.bytes / totalBytes) * 100) : 0;
            return (<div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`}/>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">{(0, plans_1.formatBytes)(item.bytes)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${item.color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }}/>
                  </div>
                </div>);
        })}
            <div className="pt-2 border-t border-border">
              <usage_meter_1.UsageMeter used={totalBytes} total={limitBytes} label="Total usage" unit="bytes"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Uploaded Files */}
        <card_1.Card>
          <card_1.CardHeader><card_1.CardTitle className="text-base">Files & Deliverables</card_1.CardTitle></card_1.CardHeader>
          <card_1.CardContent>
            {allFiles.length === 0 ? (<empty_state_1.EmptyState icon={lucide_react_1.FileCheck} title="No files uploaded yet" description="Deliverables and files uploaded to your Deal workspaces will appear here."/>) : (<div className="space-y-2">
                {allFiles.map((file) => (<div key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <lucide_react_1.File className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(0, plans_1.formatBytes)(file.size)}</p>
                    </div>
                  </div>))}
              </div>)}
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Upgrade CTA */}
      <card_1.Card className="border-primary/20">
        <card_1.CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Need more storage?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Add storage to your workspace or upgrade for higher file limits.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plans_1.STORAGE_ADDONS.map((addon) => (<div key={addon.id} className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-center">
                <span className="text-sm font-semibold">{addon.label}</span>
                <span className="text-xs text-muted-foreground">{(0, plans_1.formatCurrency)(addon.price)}/mo</span>
                <button_1.Button size="sm" variant="outline" className="mt-1 gap-1 text-xs">
                  Add
                  <lucide_react_1.ArrowRight className="h-3 w-3"/>
                </button_1.Button>
              </div>))}
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = StoragePage;
