'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  FolderKanban,
  IndianRupee,
  FileCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  Sparkles,
  Lock,
  ExternalLink,
  AlertCircle,
  Upload,
  Share2,
  Mail,
  RefreshCw,
  FileText,
  Paperclip,
} from 'lucide-react';
import { Breadcrumb } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatCurrency, formatBytes } from '@/lib/plans';
import { STANDARD_TEMPLATES, createDealInStore, useAppStore, type Deal } from '@/lib/app-store';
import { getDealPublicUrl } from '@/lib/deal-url';
import { uploadQueue } from '@/lib/upload-queue';

const steps = [
  { id: 'client', label: 'Client', icon: User },
  { id: 'project', label: 'Project', icon: FolderKanban },
  { id: 'pricing', label: 'Pricing', icon: IndianRupee },
  { id: 'files', label: 'Deliverables & Files', icon: FileCheck },
  { id: 'review', label: 'Review', icon: Check },
];

interface DealFormData {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  title: string;
  description: string;
  scope: string[];
  deadline: string;
  price: string;
  currency: string;
  deliverables: string[];
}

export default function CreateDealPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading deal creator...</div>}>
      <CreateDealForm />
    </Suspense>
  );
}

function CreateDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template');
  const store = useAppStore();

  const [step, setStep] = useState(0);
  const [createdDeal, setCreatedDeal] = useState<Deal | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ delivered?: boolean; simulated?: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdParam || '');
  const [validationError, setValidationError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [data, setData] = useState<DealFormData>({
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    title: '',
    description: '',
    scope: [],
    deadline: '',
    price: '',
    currency: 'INR',
    deliverables: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [scopeInput, setScopeInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill from template query param if provided
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
  }

  function update(field: keyof DealFormData, value: string | string[]) {
    setData((prev) => ({ ...prev, [field]: value }));
    setValidationError('');
  }

  function addScope() {
    if (scopeInput.trim()) {
      update('scope', [...data.scope, scopeInput.trim()]);
      setScopeInput('');
    }
  }
  function removeScope(idx: number) {
    update('scope', data.scope.filter((_, i) => i !== idx));
  }
  function addDeliverable() {
    if (deliverableInput.trim()) {
      update('deliverables', [...data.deliverables, deliverableInput.trim()]);
      setDeliverableInput('');
    }
  }
  function removeDeliverable(idx: number) {
    update('deliverables', data.deliverables.filter((_, i) => i !== idx));
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

  function canProceed() {
    switch (step) {
      case 0:
        return data.clientName.trim().length > 0 && isValidEmail(data.clientEmail.trim());
      case 1:
        return data.title.trim().length > 0;
      case 2:
        return Number(data.price) > 0;
      default:
        return true;
    }
  }

  async function handleCreate() {
    if (!data.clientName.trim() || !isValidEmail(data.clientEmail.trim())) {
      setValidationError('Please enter a valid client name and email address.');
      setStep(0);
      return;
    }
    if (!data.title.trim()) {
      setValidationError('Please enter a project title.');
      setStep(1);
      return;
    }
    const priceNum = Number(data.price);
    if (!priceNum || priceNum <= 0) {
      setValidationError('Please enter a valid positive deal price.');
      setStep(2);
      return;
    }

    setLoading(true);
    setValidationError('');
    setUploadProgress('Creating deal...');

    try {
      // 1. Submit deal metadata to /api/deals/create
      const res = await fetch('/api/deals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: data.clientName.trim(),
          clientEmail: data.clientEmail.trim(),
          clientCompany: data.clientCompany.trim(),
          title: data.title.trim(),
          description: data.description.trim(),
          price: priceNum,
          currency: data.currency,
          deadline: data.deadline,
          scope: data.scope,
          deliverables: data.deliverables,
          previewEnabled
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create deal');
      }

      const json = await res.json();
      if (!json.success || !json.deal) {
        throw new Error('Deal creation returned unsuccessful response');
      }

      const deal = json.deal;
      const deliverableId = json.deliverableId;

      // 2. Perform direct storage uploads for selected files asynchronously
      if (selectedFiles.length > 0 && deliverableId) {
        uploadQueue.addUploads(
          deal.id,
          deliverableId,
          selectedFiles,
          'Initial project deliverable files',
          previewEnabled
        );
      }

      // Sync local reactive store
      createDealInStore({
        clientName: data.clientName.trim(),
        clientEmail: data.clientEmail.trim(),
        clientCompany: data.clientCompany.trim() || undefined,
        title: data.title.trim(),
        description: data.description.trim(),
        scope: data.scope,
        price: priceNum,
        currency: data.currency,
        deadline: data.deadline,
        deliverables: data.deliverables,
      });

      router.push(`/deals/${deal.id}`);
    } catch (err: any) {
      console.error('Error creating deal:', err);
      setValidationError(err.message || 'Deal creation failed.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  }

  async function handleShare(url: string, title: string) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `DELT Deal: ${title}`,
          text: `Here is your private Deal workspace on DELT: ${title}`,
          url: url,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleResendEmail(token: string) {
    setResendingEmail(true);
    setResendResult(null);
    try {
      const res = await fetch(`/api/deals/${encodeURIComponent(token)}/resend-invite`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok && json.emailResult?.delivered) {
        setResendResult('Invitation email resent successfully!');
      } else if (json.emailResult?.simulated) {
        setResendResult('Email simulated (Resend API key not configured in .env.local).');
      } else {
        setResendResult(json.emailResult?.error || 'Email delivery requires RESEND_API_KEY configuration.');
      }
    } catch (err) {
      setResendResult('Failed to resend invitation email.');
    } finally {
      setResendingEmail(false);
    }
  }

  if (createdDeal) {
    const canonicalUrl = getDealPublicUrl(createdDeal.token);

    return (
      <div className="mx-auto max-w-lg py-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Header Badge */}
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-display font-semibold tracking-tight">Deal created successfully</h2>
                <p className="text-sm font-medium text-foreground">
                  {createdDeal.title} · {formatCurrency(createdDeal.price, createdDeal.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Client: <strong className="text-foreground">{data.clientName}</strong> ({data.clientEmail})
                </p>
              </div>

              {/* Email Status Indicator */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    Client invitation:{' '}
                    {emailStatus === null ? (
                      <strong className="text-amber-600 dark:text-amber-400 font-medium">Ready to send</strong>
                    ) : emailStatus?.delivered ? (
                      <strong className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Sent to {data.clientEmail}</strong>
                    ) : emailStatus?.simulated ? (
                      <strong className="text-muted-foreground font-medium">Simulated (Dev mode)</strong>
                    ) : (
                      <strong className="text-amber-600 dark:text-amber-400 font-medium">⚠ Failed to send — use Copy Link / Resend Invitation</strong>
                    )}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleResendEmail(createdDeal.token)}
                  disabled={resendingEmail}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <RefreshCw className={cn("h-3 w-3", resendingEmail && "animate-spin")} />
                  {resendingEmail ? 'Sending...' : 'Resend Email'}
                </Button>
              </div>

              {resendResult && (
                <p className="text-[11px] text-muted-foreground text-center">{resendResult}</p>
              )}

              {/* Private Link Box */}
              <div className="space-y-2 text-left">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Your private Deal link
                </Label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-xs font-mono select-all">{canonicalUrl}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(canonicalUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  Only authorized people with this private link and email verification can open this workspace.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(canonicalUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleShare(canonicalUrl, createdDeal.title)}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => window.open(canonicalUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Client View
                  </Button>
                </div>

                <div className="pt-2">
                  <Button
                    className="w-full gap-2"
                    onClick={() => router.push(`/deals/${createdDeal.id}`)}
                  >
                    Open Deal Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: 'New Deal' }]} />

      {/* Step indicator */}
      <div className="pb-2">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                    i < step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : i === step
                        ? 'border-primary bg-background text-primary'
                        : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn('text-xs font-medium', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          {validationError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Client */}
              {step === 0 && (
                <div className="space-y-5 max-w-md">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Client details</h2>
                    <p className="text-sm text-muted-foreground">Who is this deal for?</p>
                  </div>

                  {store.clients.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">Select an existing client (optional)</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        onChange={(e) => {
                          if (e.target.value) applyClient(e.target.value);
                        }}
                        defaultValue=""
                      >
                        <option value="">-- Choose from your clients --</option>
                        {store.clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.company || c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client name *</Label>
                    <Input
                      id="clientName"
                      placeholder="e.g. Rahul Sharma"
                      value={data.clientName}
                      onChange={(e) => update('clientName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={data.clientEmail}
                      onChange={(e) => update('clientEmail', e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      An invitation with the private Deal link will be sent to this email address.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCompany">Company name (optional)</Label>
                    <Input
                      id="clientCompany"
                      placeholder="e.g. TechCorp"
                      value={data.clientCompany}
                      onChange={(e) => update('clientCompany', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Project */}
              {step === 1 && (
                <div className="space-y-5 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Project details</h2>
                    <p className="text-sm text-muted-foreground">Describe the project and scope of work.</p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Optional: Load from template
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {STANDARD_TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => applyTemplate(t.id)}
                          className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium border transition-colors',
                            selectedTemplateId === t.id
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                          )}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Project title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Final YouTube Video"
                      value={data.title}
                      onChange={(e) => update('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief overview of project goals..."
                      rows={3}
                      value={data.description}
                      onChange={(e) => update('description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scope items (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a scope milestone or task..."
                        value={scopeInput}
                        onChange={(e) => setScopeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addScope(); } }}
                      />
                      <Button variant="outline" size="icon" onClick={addScope}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {data.scope.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {data.scope.map((s, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                            <span className="text-sm">{s}</span>
                            <button onClick={() => removeScope(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Target deadline (optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={data.deadline}
                      onChange={(e) => update('deadline', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {step === 2 && (
                <div className="space-y-5 max-w-md">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Pricing</h2>
                    <p className="text-sm text-muted-foreground">Set the project price and currency.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="2500"
                        value={data.price}
                        onChange={(e) => update('price', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                  {Number(data.price) > 0 && (
                    <div className="rounded-lg bg-muted/40 p-4 border border-border">
                      <p className="text-xs text-muted-foreground">Total Project Amount</p>
                      <p className="text-2xl font-display font-semibold mt-1">
                        {formatCurrency(Number(data.price), data.currency as 'INR' | 'USD' | 'EUR' | 'GBP')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Client can review, accept, or propose price adjustments inside the Deal chat.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Deliverables & File Upload */}
              {step === 3 && (
                <div className="space-y-6 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Deliverables & Files (optional)</h2>
                    <p className="text-sm text-muted-foreground">Upload deliverable files or list project milestones.</p>
                  </div>

                  {/* Client File Preview Settings */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Client File Preview</span>
                        <p className="text-xs text-muted-foreground pr-4">
                          Allow the client to preview supported deliverables before payment.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewEnabled(!previewEnabled)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                          previewEnabled ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                            previewEnabled ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* File Upload Box */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Attach Deliverable Files</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">Click to browse or drag and drop files</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ZIP, PDF, MP4, PNG, JPG, PSD, Figma archives (up to 100MB)
                      </p>
                    </div>

                    {/* Selected files list */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-medium text-muted-foreground">{selectedFiles.length} file(s) selected:</p>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-xs border border-border">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate font-medium">{file.name}</span>
                              <span className="text-muted-foreground shrink-0">({formatBytes(file.size)})</span>
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
                    )}
                  </div>

                  {/* Deliverable Milestones */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-medium">Deliverable Item Names (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Master Video Export (4K)..."
                        value={deliverableInput}
                        onChange={(e) => setDeliverableInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDeliverable(); } }}
                      />
                      <Button variant="outline" size="icon" onClick={addDeliverable}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {data.deliverables.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {data.deliverables.map((d, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                            <span className="text-sm">{d}</span>
                            <button onClick={() => removeDeliverable(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 4 && (
                <div className="space-y-5 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Review & Create</h2>
                    <p className="text-sm text-muted-foreground">Confirm details before generating your private deal link.</p>
                  </div>
                  <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
                    <ReviewRow label="Client" value={`${data.clientName} (${data.clientEmail})`} />
                    <ReviewRow label="Project" value={data.title} />
                    <ReviewRow label="Description" value={data.description || '—'} />
                    <ReviewRow label="Scope" value={data.scope.length > 0 ? data.scope.join(', ') : 'Standard Project Scope'} />
                    <ReviewRow
                      label="Deadline"
                      value={data.deadline ? new Date(data.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Flexible'}
                    />
                    <ReviewRow
                      label="Price"
                      value={data.price ? formatCurrency(Number(data.price), data.currency as 'INR' | 'USD' | 'EUR' | 'GBP') : '—'}
                    />
                    <ReviewRow
                      label="Deliverable Files"
                      value={selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Upload anytime in workspace'}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => (step > 0 ? setStep(step - 1) : router.push('/deals'))}
              className="gap-1.5"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1.5">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={loading} className="gap-1.5">
                <Check className="h-4 w-4" />
                {loading ? (uploadProgress || 'Creating Deal & Uploading...') : 'Create Deal'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  );
}

const loadPdfLib = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).PDFLib) return resolve((window as any).PDFLib);
    const script = document.createElement('script');
    script.src = '/lib/pdf-lib.min.js';
    script.onload = () => resolve((window as any).PDFLib);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

async function generateClientPreview(file: File): Promise<Blob | null> {
  const fileType = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isPdf = fileType === 'application/pdf' || ext === 'pdf';

  if (isImage) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compute average luminance by drawing to a 1x1 canvas
          let isDark = false;
          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1;
            tempCanvas.height = 1;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.drawImage(img, 0, 0, 1, 1);
              const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
              const r = pixel[0];
              const g = pixel[1];
              const b = pixel[2];
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              isDark = luminance < 127;
            }
          } catch (e) {
            console.error('Failed to compute image luminance client-side:', e);
          }

          ctx.save();

          // Calculate font size dynamically based on dimensions (responsive)
          const fontSize = Math.max(
            32,
            Math.round(Math.min(width, height) * 0.045)
          );

          ctx.strokeStyle = isDark ? 'rgba(240, 240, 240, 0.35)' : 'rgba(70, 70, 70, 0.35)'; // Hollow outline at 35% opacity
          ctx.lineWidth = 2;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const text = 'DELT PREVIEW';
          const textWidth = ctx.measureText(text).width;
          const stepX = textWidth + 35; // Compact horizontal gap (20-50px)
          const stepY = fontSize + 45;   // Compact vertical gap (30-60px)

          // Rotate by -30 degrees
          ctx.rotate((-30 * Math.PI) / 180);

          // Render staggered tiled grid of hollow watermarks
          for (let y = -height * 2; y < height * 2.5; y += stepY) {
            const xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
            for (let x = -width * 2 - xOffset; x < width * 2.5; x += stepX) {
              ctx.strokeText(text, x + xOffset, y);
            }
          }
          ctx.restore();

          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.6);
        };
        img.onerror = () => resolve(null);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  if (isPdf) {
    try {
      const PDFLib = (await loadPdfLib()) as any;
      if (!PDFLib) return null;

      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const pagesToKeep = pages.slice(0, 5);

      const previewDoc = await PDFLib.PDFDocument.create();
      const copiedPages = await previewDoc.copyPages(pdfDoc, pagesToKeep.map((_: any, i: number) => i));

      for (const page of copiedPages) {
        previewDoc.addPage(page);
        const { width, height } = page.getSize();

        // Staggered grid watermark on PDF page with outline/stroke configuration
        const text = 'DELT PREVIEW';
        const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
        const stepX = (fontSize * 8) + 35; // approximate width of 'DELT PREVIEW' + horizontal gap
        const stepY = fontSize + 45;       // vertical gap
        const rotationAngle = 30; // 30 degrees rotation

        page.pushOperators(
          PDFLib.pushGraphicsState(),
          PDFLib.setStrokingColor(PDFLib.rgb(0.27, 0.27, 0.27)), // rgb(70,70,70) -> 70/255 = 0.27
          PDFLib.setLineWidth(2),
          PDFLib.setTextRenderingMode(PDFLib.TextRenderingMode.Outline)
        );

        for (let y = -100; y < height + 200; y += stepY) {
          const xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
          for (let x = -100 - xOffset; x < width + 200; x += stepX) {
            page.drawText(text, {
              x: x + xOffset,
              y: y,
              size: fontSize,
              font: font,
              opacity: 0.35, // 35% opacity
              rotate: PDFLib.degrees(rotationAngle),
            });
          }
        }

        page.pushOperators(PDFLib.popGraphicsState());
      }

      const previewBytes = await previewDoc.save();
      return new Blob([previewBytes], { type: 'application/pdf' });
    } catch (err) {
      console.error('Error generating PDF preview client-side:', err);
      return null;
    }
  }

  return null;
}
