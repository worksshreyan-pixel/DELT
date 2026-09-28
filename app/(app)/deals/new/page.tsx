'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  FileCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Upload,
  FileText,
  Sparkles,
  HardDrive,
  Shield,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Receipt,
  Milestone as MilestoneIcon,
} from 'lucide-react';
import { Breadcrumb } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatCurrency, formatBytes } from '@/lib/plans';
import { STANDARD_TEMPLATES, createDealInStore, useAppStore } from '@/lib/app-store';
import { uploadQueue } from '@/lib/upload-queue';
import { createClient } from '@/lib/supabase/client';
import { PreviewConfig, type PreviewModeType } from '@/components/preview-config';

interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface DealFormData {
  title: string;
  clientEmail: string;
  clientName: string;
  clientCompany: string;
  description: string;
  scope: string[];
  price: string;
  currency: string;
  deadline: string;
  deliverables: string[];
  storageProvider: string;
  storageConnectionId: string | null;
  createAgreement: boolean;
  createInvoice: boolean;
  milestones: MilestoneItem[];
}

export type StepType = 'details' | 'files';

export default function CreateDealPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm font-mono text-muted-foreground">Loading deal creator...</div>}>
      <CreateDealForm />
    </Suspense>
  );
}

function CreateDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template');
  const store = useAppStore();

  const [activeStep, setActiveStep] = useState<StepType>('details');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdParam || '');
  const [validationError, setValidationError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<DealFormData>({
    title: '',
    clientEmail: '',
    clientName: '',
    clientCompany: '',
    description: '',
    scope: [],
    price: '',
    currency: 'INR',
    deadline: '',
    deliverables: [],
    storageProvider: 'supabase',
    storageConnectionId: null,
    createAgreement: false,
    createInvoice: false,
    milestones: [],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manualPreviewFile, setManualPreviewFile] = useState<File | null>(null);
  const [manualPreviewError, setManualPreviewError] = useState<string>('');
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewModeType>('NONE');
  const [scopeInput, setScopeInput] = useState('');
  
  // New Milestone input state
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDueDate, setMsDueDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [isFetchingConnections, setIsFetchingConnections] = useState(true);

  function handleManualPreviewSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setManualPreviewError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isAllowedType =
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        file.type === 'application/pdf' ||
        ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'pdf'].includes(ext);

      if (!isAllowedType) {
        setManualPreviewError('Preview file must be an image, video, or PDF document.');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setManualPreviewError('Manual preview file size must not exceed 50MB.');
        return;
      }

      setManualPreviewFile(file);
    }
  }

  // Fetch active storage connections for creator
  useEffect(() => {
    async function fetchConnections() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userConnections } = await supabase
          .from('storage_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'connected');

        const activeConns = userConnections || [];
        setConnections(activeConns);

        const { data: profile } = await supabase
          .from('profiles')
          .select('default_storage_provider')
          .eq('id', user.id)
          .single();

        if (
          profile?.default_storage_provider === 'google_drive' &&
          activeConns.some((c) => c.provider === 'google_drive')
        ) {
          const googleConn = activeConns.find((c) => c.provider === 'google_drive');
          if (googleConn) {
            setData((d) => ({
              ...d,
              storageProvider: 'google_drive',
              storageConnectionId: googleConn.id,
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching storage connections:', err);
      } finally {
        setIsFetchingConnections(false);
      }
    }
    fetchConnections();
  }, []);

  // Prefill from template if provided
  useEffect(() => {
    if (templateIdParam) {
      const tpl = STANDARD_TEMPLATES.find((t) => t.id === templateIdParam);
      if (tpl) {
        setData((prev) => ({
          ...prev,
          title: tpl.name,
          description: tpl.description,
          scope: [...tpl.scope],
          price: tpl.defaultPrice.toString(),
          currency: tpl.currency,
          deliverables: [...tpl.deliverables],
        }));
        setSelectedTemplateId(tpl.id);
      }
    }
  }, [templateIdParam]);

  function applyTemplate(tplId: string) {
    const tpl = STANDARD_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setData((prev) => ({
      ...prev,
      title: tpl.name,
      description: tpl.description,
      scope: [...tpl.scope],
      price: tpl.defaultPrice.toString(),
      currency: tpl.currency,
      deliverables: [...tpl.deliverables],
    }));
    setSelectedTemplateId(tpl.id);
    setFieldErrors({});
    setValidationError('');
  }

  function applyClient(clientId: string) {
    const cl = store.clients.find((c) => c.id === clientId);
    if (!cl) return;
    setData((prev) => ({
      ...prev,
      clientName: cl.name,
      clientEmail: cl.email,
      clientCompany: cl.company || '',
    }));
    setFieldErrors((prev) => ({ ...prev, clientEmail: '', clientName: '' }));
  }

  function update(field: keyof DealFormData, value: any) {
    setData((prev) => ({ ...prev, [field]: value }));
    setValidationError('');
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function addScope() {
    if (scopeInput.trim()) {
      update('scope', [...data.scope, scopeInput.trim()]);
      setScopeInput('');
    }
  }

  function removeScope(idx: number) {
    update(
      'scope',
      data.scope.filter((_, i) => i !== idx)
    );
  }

  function addMilestone() {
    if (msTitle.trim()) {
      const newMs: MilestoneItem = {
        id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: msTitle.trim(),
        description: msDesc.trim(),
        dueDate: msDueDate,
      };
      update('milestones', [...data.milestones, newMs]);
      setMsTitle('');
      setMsDesc('');
      setMsDueDate('');
    }
  }

  function removeMilestone(id: string) {
    update(
      'milestones',
      data.milestones.filter((m) => m.id !== id)
    );
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }

  function removeFile(idx: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateBasicFields(): boolean {
    const errors: Record<string, string> = {};

    if (!data.title.trim()) {
      errors.title = 'Deal name is required.';
    }

    if (!data.clientEmail.trim()) {
      errors.clientEmail = 'Client email is required.';
    } else if (!isValidEmail(data.clientEmail.trim())) {
      errors.clientEmail = 'Please enter a valid email address.';
    }

    const priceNum = Number(data.price);
    if (!data.price || isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Enter a valid positive deal price.';
    }

    if (!data.description.trim() && data.scope.length === 0) {
      errors.description = 'Provide a description of deal requirements.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setValidationError('Please fix the highlighted fields to continue.');
      return false;
    }

    setValidationError('');
    return true;
  }

  function handleProceedToFiles() {
    if (validateBasicFields()) {
      setActiveStep('files');
    }
  }

  // Final Deal Creation Handler
  async function handleCreateDeal() {
    if (loading) return;

    if (!validateBasicFields()) {
      setActiveStep('details');
      return;
    }

    const priceNum = Number(data.price);
    const resolvedClientName = data.clientName.trim() || data.clientEmail.split('@')[0] || 'Client';

    setLoading(true);
    setValidationError('');

    try {
      const resolvedPreviewMode = data.storageProvider === 'google_drive'
        ? (previewMode === 'NONE' ? 'NONE' : previewMode === 'MANUAL' ? 'MANUAL' : 'EXTERNAL')
        : previewMode;

      const res = await fetch('/api/deals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: resolvedClientName,
          clientEmail: data.clientEmail.trim().toLowerCase(),
          clientCompany: data.clientCompany.trim(),
          title: data.title.trim(),
          description: data.description.trim(),
          price: priceNum,
          currency: data.currency,
          deadline: data.deadline,
          scope: data.scope,
          deliverables: data.deliverables.length > 0 ? data.deliverables : data.scope,
          previewEnabled: resolvedPreviewMode !== 'NONE',
          previewMode: resolvedPreviewMode,
          createAgreement: data.createAgreement,
          createInvoice: data.createInvoice,
          milestones: data.milestones,
          projectStructure: 'scope_and_milestones',
          storageProvider: data.storageProvider,
          storageConnectionId: data.storageConnectionId,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create deal.');
      }

      const json = await res.json();
      if (!json.success || !json.deal) {
        throw new Error('Deal creation returned an invalid response.');
      }

      const deal = json.deal;
      const deliverableId = json.deliverableId;

      // Sync local reactive store
      createDealInStore({
        clientName: resolvedClientName,
        clientEmail: data.clientEmail.trim(),
        clientCompany: data.clientCompany.trim() || undefined,
        title: data.title.trim(),
        description: data.description.trim(),
        scope: data.scope,
        price: priceNum,
        currency: data.currency,
        deadline: data.deadline,
        deliverables: data.deliverables.length > 0 ? data.deliverables : data.scope,
      });

      // Enqueue background file uploads with autoStart=false so Create Deal navigates immediately
      if (selectedFiles.length > 0 && deliverableId) {
        uploadQueue.addUploads(
          deal.id,
          deliverableId,
          selectedFiles,
          'Initial project deliverable files',
          resolvedPreviewMode === 'AUTO',
          (resolvedPreviewMode === 'MANUAL' && manualPreviewFile) ? manualPreviewFile : undefined,
          false
        );
      }

      router.push(`/deals/${deal.deal_code || deal.id}`);
    } catch (err: any) {
      console.error('Error creating deal:', err);
      setValidationError(err.message || 'Deal creation failed. Please try again.');
      setLoading(false);
    }
  }

  const activeGoogleConn = connections.find((c) => c.provider === 'google_drive');
  const isGoogleDriveSelected = data.storageProvider === 'google_drive';

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16">
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: 'Create Deal' }]} />

      {/* Main Form Surface */}
      <Card className="border border-border/80 bg-card/90 backdrop-blur-md shadow-xl rounded-2xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-brand mb-1">
              <FolderKanban className="h-3.5 w-3.5" />
              Deal Workspace Creator
            </div>
            <h1 className="text-xl font-display font-semibold tracking-tight">
              Create a new deal workspace
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {activeStep === 'details'
                ? 'Enter basic deal details below. Optional advanced deal configuration is expandable below.'
                : 'Configure storage & deliverable file preview options, then attach files for your deal workspace.'}
            </p>
          </div>

          {/* Stepper Header (Exactly 2 Steps: Details -> Files Upload) */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted/20 border border-border/60 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveStep('details')}
              className={cn(
                'flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200',
                activeStep === 'details'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-[11px]',
                  activeStep === 'details'
                    ? 'bg-accent-brand text-accent-brand-foreground font-bold'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                1
              </div>
              <span className="truncate">STEP 1 — DETAILS</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateBasicFields()) setActiveStep('files');
              }}
              className={cn(
                'flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200',
                activeStep === 'files'
                  ? 'bg-card text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-[11px]',
                  activeStep === 'files'
                    ? 'bg-accent-brand text-accent-brand-foreground font-bold'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                2
              </div>
              <span className="truncate flex items-center gap-1.5">
                <span>STEP 2 — FILES UPLOAD</span>
                {selectedFiles.length > 0 && (
                  <span className="h-4 px-1.5 rounded-full bg-accent-brand/20 text-accent-brand text-[10px] font-bold">
                    {selectedFiles.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-medium text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </motion.div>
          )}

          {/* STEP 1: DETAILS */}
          {activeStep === 'details' && (
            <motion.div
              key="step-details"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Quick Action Loaders */}
              <div className="space-y-3">
                {/* Template Selector Quick Action */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent-brand" />
                      Optional: Load from template
                    </Label>
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateId('')}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline"
                      >
                        Clear template
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STANDARD_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t.id)}
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-xs border transition-all duration-200',
                          selectedTemplateId === t.id
                            ? 'bg-accent-brand/15 border-accent-brand/50 text-accent-brand font-semibold'
                            : 'bg-card border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Existing Client Picker */}
                {store.clients.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Choose existing client (optional)
                    </Label>
                    <select
                      className="flex h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-xs focus:border-accent-brand/70"
                      onChange={(e) => {
                        if (e.target.value) applyClient(e.target.value);
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Select from your clients --</option>
                      {store.clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.company || c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* BASIC DETAILS SECTION */}
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                  Basic Details
                </h2>

                {/* Deal Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs sm:text-sm font-semibold text-foreground">
                    Deal title <span className="text-accent-brand">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Brand Identity & Website Redesign"
                    className={cn(
                      'h-10 rounded-xl bg-muted/20 text-sm focus:border-accent-brand/70',
                      fieldErrors.title && 'border-destructive'
                    )}
                    value={data.title}
                    onChange={(e) => update('title', e.target.value)}
                    required
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-destructive">{fieldErrors.title}</p>
                  )}
                </div>

                {/* Client Email & Client Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="clientEmail" className="text-xs sm:text-sm font-semibold text-foreground">
                      Client email <span className="text-accent-brand">*</span>
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="client@company.com"
                      className={cn(
                        'h-10 rounded-xl bg-muted/20 text-sm focus:border-accent-brand/70',
                        fieldErrors.clientEmail && 'border-destructive'
                      )}
                      value={data.clientEmail}
                      onChange={(e) => update('clientEmail', e.target.value)}
                      required
                    />
                    {fieldErrors.clientEmail && (
                      <p className="text-xs text-destructive">{fieldErrors.clientEmail}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="clientName" className="text-xs sm:text-sm font-medium">
                      Client name (optional)
                    </Label>
                    <Input
                      id="clientName"
                      placeholder="e.g. Alex Mercer"
                      className="h-10 rounded-xl bg-muted/20 text-sm focus:border-accent-brand/70"
                      value={data.clientName}
                      onChange={(e) => update('clientName', e.target.value)}
                    />
                  </div>
                </div>

                {/* Price & Currency */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="price" className="text-xs sm:text-sm font-semibold text-foreground">
                      Price <span className="text-accent-brand">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="25000"
                      className={cn(
                        'h-10 rounded-xl bg-muted/20 text-sm focus:border-accent-brand/70',
                        fieldErrors.price && 'border-destructive'
                      )}
                      value={data.price}
                      onChange={(e) => update('price', e.target.value)}
                      required
                    />
                    {fieldErrors.price && (
                      <p className="text-xs text-destructive">{fieldErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="currency" className="text-xs sm:text-sm font-medium">
                      Currency
                    </Label>
                    <select
                      id="currency"
                      className="flex h-10 w-full rounded-xl border border-border/80 bg-muted/20 px-3 text-sm focus:border-accent-brand/70"
                      value={data.currency}
                      onChange={(e) => update('currency', e.target.value)}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {/* Total Amount Preview Callout */}
                {Number(data.price) > 0 && (
                  <div className="rounded-xl bg-accent-brand/10 border border-accent-brand/20 p-4">
                    <div className="text-xs font-semibold text-accent-brand">
                      Total Deal Amount
                    </div>
                    <div className="text-2xl font-display font-semibold mt-0.5 text-foreground">
                      {formatCurrency(Number(data.price), data.currency as 'INR' | 'USD' | 'EUR' | 'GBP')}
                    </div>
                  </div>
                )}

                {/* Scope / Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs sm:text-sm font-semibold text-foreground">
                    Description <span className="text-accent-brand">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you will deliver for this client deal..."
                    rows={3}
                    className={cn(
                      'rounded-xl bg-muted/20 text-sm focus:border-accent-brand/70',
                      fieldErrors.description && 'border-destructive'
                    )}
                    value={data.description}
                    onChange={(e) => update('description', e.target.value)}
                  />
                  {fieldErrors.description && (
                    <p className="text-[11px] text-destructive">{fieldErrors.description}</p>
                  )}
                </div>

                {/* Optional Fields: Company & Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="clientCompany" className="text-xs text-muted-foreground">
                      Company (optional)
                    </Label>
                    <Input
                      id="clientCompany"
                      placeholder="e.g. Acme Studio"
                      className="h-9 rounded-xl bg-muted/20 text-xs"
                      value={data.clientCompany}
                      onChange={(e) => update('clientCompany', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deadline" className="text-xs text-muted-foreground">
                      Target deadline (optional)
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      className="h-9 rounded-xl bg-muted/20 text-xs"
                      value={data.deadline}
                      onChange={(e) => update('deadline', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ADVANCED OPTIONS (Expandable Section Inside Step 1 — Details) */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((prev) => !prev)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold transition-all duration-200 group',
                    showAdvancedOptions
                      ? 'bg-accent-brand/10 border-accent-brand/50 text-foreground shadow-xs'
                      : 'bg-muted/20 border-border/80 text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      showAdvancedOptions ? 'bg-accent-brand text-accent-brand-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                    )}>
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                        <span>Advanced Options</span>
                        {showAdvancedOptions ? <ChevronUp className="h-3.5 w-3.5 text-accent-brand" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-normal mt-0.5">
                        Configure scope/deliverables, agreement, milestones, and invoice settings.
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-accent-brand font-medium">
                    {showAdvancedOptions ? 'Collapse ▴' : 'Expand ▾'}
                  </div>
                </button>

                {/* EXPANDABLE ADVANCED OPTIONS PANEL */}
                {showAdvancedOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 pt-1"
                  >
                    {/* SECTION 1: SCOPE / DELIVERABLES */}
                    <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border/40 pb-3">
                        <FileCheck className="h-4 w-4 text-accent-brand" />
                        <span>Scope / Deliverables</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Define explicit scope & deliverable checklist items for client review and verification.
                      </p>

                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a deliverable item (e.g. Master 4K Video Export)..."
                            className="h-9 rounded-xl bg-background text-xs"
                            value={scopeInput}
                            onChange={(e) => setScopeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addScope();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" size="sm" onClick={addScope} className="rounded-xl text-xs font-medium">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {data.scope.length > 0 && (
                          <div className="space-y-1.5 mt-2">
                            {data.scope.map((s, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-xs border border-border/40"
                              >
                                <span>{s}</span>
                                <button
                                  type="button"
                                  onClick={() => removeScope(i)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: SERVICE AGREEMENT */}
                    <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border/40 pb-3">
                        <FileText className="h-4 w-4 text-accent-brand" />
                        <span>Service Agreement Options</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Initializes a draft service agreement snapshot for review in your workspace before sending to the client.
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => update('createAgreement', true)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all duration-200 text-left',
                            data.createAgreement
                              ? 'bg-accent-brand/15 border-accent-brand/60 text-foreground shadow-xs font-semibold'
                              : 'bg-card border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('h-4 w-4', data.createAgreement ? 'text-accent-brand' : 'text-muted-foreground/40')} />
                            <span>Create agreement draft</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => update('createAgreement', false)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all duration-200 text-left',
                            !data.createAgreement
                              ? 'bg-card border-border text-foreground shadow-xs font-semibold'
                              : 'bg-card/50 border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <X className={cn('h-4 w-4', !data.createAgreement ? 'text-zinc-400' : 'text-muted-foreground/40')} />
                            <span>Not now</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: MILESTONES */}
                    <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border/40 pb-3">
                        <MilestoneIcon className="h-4 w-4 text-accent-brand" />
                        <span>Project Milestones (Optional)</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Set up key progress milestones to help track progress in your deal workspace.
                      </p>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            placeholder="Milestone title (e.g. Design Wireframes)..."
                            className="h-9 rounded-xl bg-background text-xs"
                            value={msTitle}
                            onChange={(e) => setMsTitle(e.target.value)}
                          />
                          <Input
                            type="date"
                            className="h-9 rounded-xl bg-background text-xs"
                            value={msDueDate}
                            onChange={(e) => setMsDueDate(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Description (optional)..."
                            className="h-9 rounded-xl bg-background text-xs flex-1"
                            value={msDesc}
                            onChange={(e) => setMsDesc(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addMilestone();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMilestone}
                            className="rounded-xl text-xs font-medium gap-1 shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Milestone</span>
                          </Button>
                        </div>

                        {data.milestones.length > 0 && (
                          <div className="space-y-2 pt-2">
                            {data.milestones.map((ms, idx) => (
                              <div
                                key={ms.id}
                                className="flex items-center justify-between rounded-xl bg-card p-3 text-xs border border-border/60"
                              >
                                <div>
                                  <div className="font-semibold text-foreground flex items-center gap-2">
                                    <span className="h-5 w-5 rounded-full bg-accent-brand/10 text-accent-brand text-[10px] flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    <span>{ms.title}</span>
                                    {ms.dueDate && (
                                      <span className="text-[10px] text-muted-foreground font-normal">
                                        Due: {ms.dueDate}
                                      </span>
                                    )}
                                  </div>
                                  {ms.description && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 ml-7">
                                      {ms.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMilestone(ms.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 4: INVOICE CONFIGURATION */}
                    <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border/40 pb-3">
                        <Receipt className="h-4 w-4 text-accent-brand" />
                        <span>Invoice Options</span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Create an initial draft invoice for this deal amount ({formatCurrency(Number(data.price || 0), data.currency as any)}).
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => update('createInvoice', true)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all duration-200 text-left',
                            data.createInvoice
                              ? 'bg-accent-brand/15 border-accent-brand/60 text-foreground shadow-xs font-semibold'
                              : 'bg-card border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={cn('h-4 w-4', data.createInvoice ? 'text-accent-brand' : 'text-muted-foreground/40')} />
                            <span>Create draft invoice</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => update('createInvoice', false)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all duration-200 text-left',
                            !data.createInvoice
                              ? 'bg-card border-border text-foreground shadow-xs font-semibold'
                              : 'bg-card/50 border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <X className={cn('h-4 w-4', !data.createInvoice ? 'text-zinc-400' : 'text-muted-foreground/40')} />
                            <span>Not now</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: FILES UPLOAD */}
          {activeStep === 'files' && (
            <motion.div
              key="step-files"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {/* ① UPLOAD FILES (PRIMARY - TOP OF FILES PAGE) */}
              <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border/40 pb-3">
                  <Upload className="h-4 w-4 text-accent-brand" />
                  <span>Upload Files</span>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Attach initial project deliverables or files for this deal workspace. File uploads start automatically in the background when the workspace initializes.
                </p>

                {/* File Drag & Drop Upload Zone */}
                <div className="space-y-3 pt-1">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 rounded-xl p-6 text-center cursor-pointer hover:border-accent-brand/60 hover:bg-muted/30 transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-brand/10 text-accent-brand mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold">Click to browse or drag and drop files</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      ZIP, PDF, MP4, PNG, JPG, Figma archives (up to 100MB per file)
                    </p>
                  </div>

                  {selectedFiles.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                        <span>{selectedFiles.length} file(s) attached:</span>
                        <span className="text-[10px]">
                          Total: {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                        </span>
                      </div>
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl bg-card p-3 text-xs border border-border/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-accent-brand shrink-0" />
                            <span className="truncate font-medium">{file.name}</span>
                            <span className="text-muted-foreground text-[10px] shrink-0">
                              ({formatBytes(file.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                      No files attached yet. You can attach files now or upload deliverables later directly in the deal workspace.
                    </div>
                  )}
                </div>
              </div>

              {/* ② CLIENT DELIVERABLE PREVIEW (MIDDLE - PREVIEW OFF BY DEFAULT) */}
              <PreviewConfig
                storageProvider={data.storageProvider}
                previewEnabled={previewEnabled}
                onPreviewEnabledChange={setPreviewEnabled}
                previewMode={previewMode}
                onPreviewModeChange={setPreviewMode}
                manualPreviewFile={manualPreviewFile}
                onManualPreviewFileChange={setManualPreviewFile}
                manualPreviewError={manualPreviewError}
                disabled={loading}
              />

              {/* ③ STORAGE PROVIDER (BOTTOM) */}
              <div className="rounded-2xl border border-border/80 bg-muted/15 p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground border-b border-border/40 pb-3">
                  <Shield className="h-4 w-4 text-accent-brand" />
                  <span>Storage Provider</span>
                </div>

                {/* Storage Provider Selection */}
                <div className="space-y-2">
                  {isFetchingConnections ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
                      Loading storage connections...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setData({ ...data, storageProvider: 'supabase', storageConnectionId: null });
                          if (previewEnabled && previewMode === 'EXTERNAL') {
                            setPreviewMode('AUTO');
                          }
                        }}
                        className={cn(
                          'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200',
                          data.storageProvider === 'supabase'
                            ? 'bg-accent-brand/10 border-accent-brand/60 shadow-xs'
                            : 'bg-card border-border/60 hover:bg-muted/40'
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-accent-brand" />
                            <span className="font-semibold text-xs">DELT Storage</span>
                          </div>
                          {data.storageProvider === 'supabase' && (
                            <CheckCircle2 className="h-4 w-4 text-accent-brand" />
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Stored securely by DELT Cloud
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeGoogleConn) {
                            setData({
                              ...data,
                              storageProvider: 'google_drive',
                              storageConnectionId: activeGoogleConn.id,
                            });
                            if (previewEnabled && previewMode === 'AUTO') {
                              setPreviewMode('EXTERNAL');
                            }
                          }
                        }}
                        className={cn(
                          'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-200',
                          isGoogleDriveSelected
                            ? 'bg-accent-brand/10 border-accent-brand/60 shadow-xs'
                            : 'bg-card border-border/60 hover:bg-muted/40',
                          !activeGoogleConn && 'opacity-70'
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-accent-brand" />
                            <span className="font-semibold text-xs">Google Drive</span>
                          </div>
                          {isGoogleDriveSelected && <CheckCircle2 className="h-4 w-4 text-accent-brand" />}
                        </div>

                        {activeGoogleConn ? (
                          <span className="text-[11px] text-emerald-400 font-medium">Connected</span>
                        ) : (
                          <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-[11px] text-muted-foreground">Not connected</span>
                            <a
                              href="/storage"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-accent-brand hover:underline flex items-center gap-1 font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Connect <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Navigation Controls */}
          <div className="pt-6 border-t border-border/60 flex items-center justify-between">
            {activeStep === 'details' && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/deals')}
                  disabled={loading}
                  className="text-xs text-muted-foreground font-medium"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleProceedToFiles}
                  disabled={loading}
                  className="rounded-xl text-xs font-semibold gap-2 shadow-xs bg-accent-brand hover:bg-accent-brand/90 text-accent-brand-foreground px-5 py-2.5 h-auto"
                >
                  <span>Continue to Files Upload</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {activeStep === 'files' && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep('details')}
                  disabled={loading}
                  className="rounded-xl text-xs font-medium gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Details</span>
                </Button>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    onClick={handleCreateDeal}
                    disabled={loading}
                    className="rounded-xl text-xs font-semibold gap-2 shadow-xs bg-accent-brand hover:bg-accent-brand/90 text-accent-brand-foreground px-6 py-2.5 h-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating Deal Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Deal Workspace</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
