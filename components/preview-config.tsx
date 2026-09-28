'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Sparkles,
  Upload,
  ExternalLink,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type PreviewModeType = 'AUTO' | 'MANUAL' | 'EXTERNAL' | 'NONE';

export interface PreviewConfigProps {
  storageProvider: 'supabase' | 'google_drive' | string;
  previewEnabled: boolean;
  onPreviewEnabledChange: (enabled: boolean) => void;
  previewMode: PreviewModeType;
  onPreviewModeChange: (mode: PreviewModeType) => void;
  manualPreviewFile?: File | null;
  onManualPreviewFileChange?: (file: File | null) => void;
  manualPreviewError?: string;
  disabled?: boolean;
  className?: string;
}

export function PreviewConfig({
  storageProvider,
  previewEnabled,
  onPreviewEnabledChange,
  previewMode,
  onPreviewModeChange,
  manualPreviewFile,
  onManualPreviewFileChange,
  manualPreviewError,
  disabled = false,
  className = '',
}: PreviewConfigProps) {
  const isGoogleDrive = storageProvider === 'google_drive';

  // Toggle Master Switch
  const handleToggle = (enabled: boolean) => {
    if (disabled) return;
    onPreviewEnabledChange(enabled);
    if (!enabled) {
      onPreviewModeChange('NONE');
    } else {
      // Default option when turning ON if current mode is invalid
      if (isGoogleDrive) {
        if (previewMode !== 'EXTERNAL' && previewMode !== 'MANUAL') {
          onPreviewModeChange('EXTERNAL');
        }
      } else {
        if (previewMode !== 'NONE' && previewMode !== 'AUTO' && previewMode !== 'MANUAL') {
          onPreviewModeChange('NONE');
        }
      }
    }
  };

  return (
    <div className={cn('space-y-4 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-5 shadow-sm', className)}>
      {/* Header & Master Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent-brand" />
              Client Deliverable Preview
            </Label>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {previewEnabled
              ? 'Preview is ON. Choose how your client reviews deliverable files.'
              : 'Preview is OFF. Clients will not view files prior to payment.'}
          </p>
        </div>

        {/* Master ON / OFF Switch */}
        <div className="flex items-center rounded-xl bg-muted/30 p-1 border border-border/60 shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(false)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 outline-none select-none',
              !previewEnabled
                ? 'bg-card text-foreground shadow-xs border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <EyeOff className="h-3.5 w-3.5 opacity-70" />
            <span>OFF</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 outline-none select-none',
              previewEnabled
                ? 'bg-accent-brand text-accent-brand-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>ON</span>
          </button>
        </div>
      </div>

      {/* Provider-Aware Preview Options */}
      <AnimatePresence mode="wait">
        {previewEnabled && (
          <motion.div
            key="preview-options"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3 pt-3 border-t border-border/60 overflow-hidden"
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Preview Strategy ({isGoogleDrive ? 'Google Drive' : 'DELT Storage'})</span>
              <span className="text-[10px] text-accent-brand font-mono font-semibold">
                {isGoogleDrive ? 'STORAGE: GOOGLE DRIVE' : 'STORAGE: DELT'}
              </span>
            </div>

            {/* Storage Option List */}
            {isGoogleDrive ? (
              /* GOOGLE DRIVE OPTIONS (EXACT ORDER) */
              <div className="space-y-2.5">
                {/* 1. Open Original File (Google Drive) */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPreviewModeChange('EXTERNAL')}
                  className={cn(
                    'flex items-start gap-3 w-full p-3.5 rounded-xl border text-left transition-all duration-200 relative outline-none',
                    previewMode === 'EXTERNAL'
                      ? 'bg-accent-brand/10 border-accent-brand/70 shadow-xs ring-1 ring-accent-brand/20'
                      : 'bg-muted/15 border-border/60 hover:bg-muted/30 hover:border-border'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                      previewMode === 'EXTERNAL'
                        ? 'border-accent-brand bg-accent-brand text-accent-brand-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {previewMode === 'EXTERNAL' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        Open Original File
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          Direct Access
                        </span>
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Open the original file directly in Google Drive without a DELT preview watermark.
                    </p>
                  </div>
                </button>

                {/* 2. Upload Preview Manually (Google Drive) */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPreviewModeChange('MANUAL')}
                  className={cn(
                    'flex items-start gap-3 w-full p-3.5 rounded-xl border text-left transition-all duration-200 outline-none',
                    previewMode === 'MANUAL'
                      ? 'bg-accent-brand/10 border-accent-brand/70 shadow-xs ring-1 ring-accent-brand/20'
                      : 'bg-muted/15 border-border/60 hover:bg-muted/30 hover:border-border'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                      previewMode === 'MANUAL'
                        ? 'border-accent-brand bg-accent-brand text-accent-brand-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {previewMode === 'MANUAL' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">Upload Preview Manually</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Upload a separate preview file for client review while keeping original file in Google Drive.
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              /* DELT STORAGE / SUPABASE OPTIONS (EXACT ORDER) */
              <div className="space-y-2.5">
                {/* 1. Open Original File (Supabase) */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPreviewModeChange('NONE')}
                  className={cn(
                    'flex items-start gap-3 w-full p-3.5 rounded-xl border text-left transition-all duration-200 relative outline-none',
                    previewMode === 'NONE'
                      ? 'bg-accent-brand/10 border-accent-brand/70 shadow-xs ring-1 ring-accent-brand/20'
                      : 'bg-muted/15 border-border/60 hover:bg-muted/30 hover:border-border'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                      previewMode === 'NONE'
                        ? 'border-accent-brand bg-accent-brand text-accent-brand-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {previewMode === 'NONE' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        Open Original File
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          Direct Access
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Open the original file directly without a DELT preview watermark.
                    </p>
                  </div>
                </button>

                {/* 2. Auto-Generate Preview (Supabase) */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPreviewModeChange('AUTO')}
                  className={cn(
                    'flex items-start gap-3 w-full p-3.5 rounded-xl border text-left transition-all duration-200 outline-none',
                    previewMode === 'AUTO'
                      ? 'bg-accent-brand/10 border-accent-brand/70 shadow-xs ring-1 ring-accent-brand/20'
                      : 'bg-muted/15 border-border/60 hover:bg-muted/30 hover:border-border'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                      previewMode === 'AUTO'
                        ? 'border-accent-brand bg-accent-brand text-accent-brand-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {previewMode === 'AUTO' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      Auto-Generate Preview
                      <Sparkles className="h-3 w-3 text-accent-brand" />
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      DELT creates a preview automatically for image, video & PDF files.
                    </p>
                  </div>
                </button>

                {/* 3. Upload Preview Manually (Supabase) */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPreviewModeChange('MANUAL')}
                  className={cn(
                    'flex items-start gap-3 w-full p-3.5 rounded-xl border text-left transition-all duration-200 outline-none',
                    previewMode === 'MANUAL'
                      ? 'bg-accent-brand/10 border-accent-brand/70 shadow-xs ring-1 ring-accent-brand/20'
                      : 'bg-muted/15 border-border/60 hover:bg-muted/30 hover:border-border'
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                      previewMode === 'MANUAL'
                        ? 'border-accent-brand bg-accent-brand text-accent-brand-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {previewMode === 'MANUAL' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">Upload Preview Manually</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Upload a separate preview file for client review.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* File Upload Box for MANUAL mode if handler is provided */}
            {previewMode === 'MANUAL' && onManualPreviewFileChange && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3.5 rounded-xl border border-dashed border-accent-brand/40 bg-accent-brand/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-accent-brand" />
                    Select Manual Preview File
                  </span>
                  {manualPreviewFile && (
                    <span className="text-[10px] text-emerald-400 font-medium">Selected ✓</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      disabled={disabled}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        onManualPreviewFileChange(file);
                      }}
                    />
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span className="truncate max-w-[220px]">
                        {manualPreviewFile ? manualPreviewFile.name : 'Choose image, video or PDF preview file...'}
                      </span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono font-medium text-foreground">
                        Browse
                      </span>
                    </div>
                  </label>
                  {manualPreviewFile && (
                    <button
                      type="button"
                      onClick={() => onManualPreviewFileChange(null)}
                      className="text-xs text-muted-foreground hover:text-destructive p-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {manualPreviewError && (
                  <p className="text-[11px] text-destructive font-medium">{manualPreviewError}</p>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
