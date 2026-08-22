'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  User,
  CreditCard,
  Package,
  Shield,
  Trash2,
  ArrowLeft,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Trash,
  Check,
  Lock,
  AlertCircle,
  Eye,
  Mail,
  Copy,
  Share2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { cn, serializeDescription } from '@/lib/utils';
import type { Deal, Deliverable, FileVersion, Payment } from '@/lib/types';
import { FileCard } from '@/components/file-card';

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
          ctx.save();

          const fontSize = Math.max(32, Math.round(Math.min(width, height) * 0.045));
          ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)';
          ctx.lineWidth = 2;
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const text = 'DELT PREVIEW';
          const textWidth = ctx.measureText(text).width;
          const stepX = textWidth + 35;
          const stepY = fontSize + 45;

          ctx.rotate((-30 * Math.PI) / 180);

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

        const text = 'DELT PREVIEW';
        const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
        const stepX = (fontSize * 8) + 35;
        const stepY = fontSize + 45;
        const rotationAngle = 30;

        page.pushOperators(
          PDFLib.pushGraphicsState(),
          PDFLib.setStrokingColor(PDFLib.rgb(0.27, 0.27, 0.27)),
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
              opacity: 0.35,
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

interface DealSettingsProps {
  deal: Deal;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  creatorName: string;
  deliverables: Deliverable[];
  fileVersions: FileVersion[];
  payments: Payment[];
}

export function DealSettings({
  deal,
  clientName,
  clientEmail,
  clientCompany,
  creatorName,
  deliverables,
  fileVersions,
  payments,
}: DealSettingsProps) {
  const router = useRouter();
  const [currentDeal, setCurrentDeal] = useState<Deal>(deal);
  const [activeTab, setActiveTab] = useState('general');

  // General States
  const [editTitle, setEditTitle] = useState(currentDeal.title);
  const [editDescription, setEditDescription] = useState(currentDeal.description || '');
  const [editDeadline, setEditDeadline] = useState(currentDeal.deadline ? new Date(currentDeal.deadline).toISOString().split('T')[0] : '');

  // Client States
  const [editClientName, setEditClientName] = useState(clientName);
  const [editClientEmail, setEditClientEmail] = useState(clientEmail);
  const [editClientCompany, setEditClientCompany] = useState(clientCompany || '');

  // Payment States
  const [editPrice, setEditPrice] = useState(currentDeal.price);
  const [editCurrency, setEditCurrency] = useState(currentDeal.currency);

  // Preview & Security States
  const [editPreviewEnabled, setEditPreviewEnabled] = useState(currentDeal.previewEnabled);

  // Status & Error
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Deliverables States
  const [localDeliverables, setLocalDeliverables] = useState<Deliverable[]>([]);
  useEffect(() => {
    setLocalDeliverables(deliverables.filter(d => !d.name.startsWith('[DELETED]')));
  }, [deliverables]);

  const [newDelivOpen, setNewDelivOpen] = useState(false);
  const [newDelivName, setNewDelivName] = useState('');
  const [newDelivDesc, setNewDelivDesc] = useState('');
  const [addingDeliv, setAddingDeliv] = useState(false);
  const [addDelivErr, setAddDelivErr] = useState('');

  const [renameDelivOpen, setRenameDelivOpen] = useState(false);
  const [renameDelivId, setRenameDelivId] = useState('');
  const [renameDelivName, setRenameDelivName] = useState('');
  const [renameDelivDesc, setRenameDelivDesc] = useState('');
  const [renamingDeliv, setRenamingDeliv] = useState(false);
  const [renameDelivErr, setRenameDelivErr] = useState('');

  const [deleteDelivOpen, setDeleteDelivOpen] = useState(false);
  const [deleteDelivId, setDeleteDelivId] = useState('');
  const [deleteDelivName, setDeleteDelivName] = useState('');
  const [deletingDeliv, setDeletingDeliv] = useState(false);
  const [deleteDelivErr, setDeleteDelivErr] = useState('');

  const [replacingFileId, setReplacingFileId] = useState<string | null>(null);

  // Danger Zone States
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');

  const isPaid = currentDeal.paymentStatus === 'paid';
  const isPaidOrCompleted = isPaid || currentDeal.status === 'completed';
  const isClosed = currentDeal.status === 'closed';

  async function handleSaveChanges(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/deals/${currentDeal.token}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          client_name: editClientName,
          client_email: editClientEmail,
          client_company: editClientCompany,
          price: Number(editPrice),
          currency: editCurrency,
          deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
          preview_enabled: editPreviewEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update settings.');
      }

      const json = await res.json();
      if (json.success && json.deal) {
        const dbDeal = json.deal;
        setCurrentDeal({
          ...currentDeal,
          title: dbDeal.title,
          description: editDescription, // parsed version
          price: Number(dbDeal.price),
          currency: dbDeal.currency,
          deadline: dbDeal.deadline,
          previewEnabled: editPreviewEnabled,
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Saving changes failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!newDelivName.trim() || addingDeliv) return;

    setAddingDeliv(true);
    setAddDelivErr('');

    try {
      const res = await fetch(`/api/deals/${currentDeal.token}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDelivName,
          description: newDelivDesc,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add deliverable.');
      }

      setNewDelivOpen(false);
      setNewDelivName('');
      setNewDelivDesc('');
      window.location.reload();
    } catch (err: any) {
      setAddDelivErr(err.message || 'Failed to add deliverable');
    } finally {
      setAddingDeliv(false);
    }
  }

  async function handleRenameDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!renameDelivName.trim() || renamingDeliv) return;

    setRenamingDeliv(true);
    setRenameDelivErr('');

    try {
      const res = await fetch(`/api/deals/${currentDeal.token}/deliverables`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          deliverableId: renameDelivId,
          name: renameDelivName,
          description: renameDelivDesc,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to rename deliverable.');
      }

      setRenameDelivOpen(false);
      window.location.reload();
    } catch (err: any) {
      setRenameDelivErr(err.message || 'Failed to rename deliverable');
    } finally {
      setRenamingDeliv(false);
    }
  }

  async function handleDeleteDeliverable() {
    if (deletingDeliv) return;

    setDeletingDeliv(true);
    setDeleteDelivErr('');

    try {
      const res = await fetch(`/api/deals/${currentDeal.token}/deliverables`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          deliverableId: deleteDelivId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete deliverable.');
      }

      setDeleteDelivOpen(false);
      window.location.reload();
    } catch (err: any) {
      setDeleteDelivErr(err.message || 'Failed to delete deliverable');
    } finally {
      setDeletingDeliv(false);
    }
  }

  async function handleReplaceFile(deliverableId: string, versionId: string, fileId: string, file: File | null) {
    if (!file) return;
    setReplacingFileId(fileId);
    try {
      const formData = new FormData();
      formData.append('dealId', currentDeal.id);
      formData.append('deliverableId', deliverableId);
      formData.append('fileId', fileId);
      formData.append('file', file);

      const previewBlob = await generateClientPreview(file);
      if (previewBlob) {
        const originalExt = file.name.split('.').pop()?.toLowerCase();
        let previewExt = originalExt || 'jpg';
        if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
          previewExt = 'jpg';
        }
        const previewName = file.name.replace(/\.[^.]+$/, `-preview.${previewExt}`);
        formData.append('previewFile', new File([previewBlob], previewName, { type: previewBlob.type }));
      }

      const res = await fetch('/api/files/replace', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to replace file.');
      }

      alert('File replaced successfully! Preview is being generated.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Replacement failed');
    } finally {
      setReplacingFileId(null);
    }
  }

  async function handleCloseDeal() {
    setClosing(true);
    setCloseError('');

    try {
      const res = await fetch(`/api/deals/${currentDeal.id}/close`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to close deal.');
      }

      setCurrentDeal((prev) => ({
        ...prev,
        status: 'closed',
        updatedAt: new Date().toISOString(),
      }));
      setCloseDialogOpen(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error closing deal:', err);
      setCloseError(err.message || 'Failed to close deal.');
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link href={`/deals/${currentDeal.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-display font-semibold tracking-tight">Deal Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Configure project details, client settings, deliverables, and secure previews.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/deals/${currentDeal.id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              Back to Workspace
            </Button>
          </Link>
          <Button size="sm" onClick={handleSaveChanges} disabled={saving || isClosed}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-500 text-xs rounded-xl border border-emerald-500/20 font-medium">
          <Check className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 font-medium">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar Tabs */}
        <div className="flex flex-col gap-1.5 md:col-span-1">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'client', label: 'Client', icon: User },
            { id: 'payment', label: 'Payment & Price', icon: CreditCard },
            { id: 'delivery', label: 'Deliverables', icon: Package },
            { id: 'preview', label: 'Preview & Security', icon: Shield },
            { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors',
                  active
                    ? tab.danger
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/5 text-primary'
                    : tab.danger
                    ? 'text-destructive/80 hover:bg-destructive/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? '' : 'opacity-70')} />
                <span className="flex-1">{tab.label}</span>
                <ChevronRight className={cn('h-3.5 w-3.5 opacity-0 transition-opacity', active ? 'opacity-40' : '')} />
              </button>
            );
          })}
        </div>

        {/* Settings Form Body */}
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">General Project Settings</h3>
                  <p className="text-xs text-muted-foreground">Basic information about the digital deal.</p>
                </div>
                <hr className="border-border" />
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs">Project Title *</Label>
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isClosed}
                    placeholder="Enter project name..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs">Project Description</Label>
                  <Textarea
                    id="description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={isClosed}
                    placeholder="Provide a detailed scope of work..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-xs">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={editDeadline}
                    disabled={isClosed}
                    onChange={(e) => setEditDeadline(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Client Settings */}
            {activeTab === 'client' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Client Information</h3>
                  <p className="text-xs text-muted-foreground">Details about the buyer/recipient of the deliverables.</p>
                </div>
                <hr className="border-border" />
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-xs">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    disabled={isClosed}
                    placeholder="Client display name..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-xs">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    disabled={isClosed}
                    placeholder="client@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCompany" className="text-xs">Client Company / Details (optional)</Label>
                  <Input
                    id="clientCompany"
                    value={editClientCompany}
                    disabled={isClosed}
                    onChange={(e) => setEditClientCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
              </div>
            )}

            {/* Payment & Price Settings */}
            {activeTab === 'payment' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Pricing & Payments</h3>
                  <p className="text-xs text-muted-foreground">Deal price, currency, and payment reconciliation details.</p>
                </div>
                <hr className="border-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      disabled={isPaidOrCompleted || isClosed}
                      required
                    />
                    {isPaidOrCompleted && (
                      <p className="text-[10px] text-muted-foreground bg-muted/60 p-2 rounded-lg border border-border">
                        Price edits are locked because payment is already confirmed.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-xs">Currency</Label>
                    <select
                      id="currency"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value as any)}
                      disabled={isPaidOrCompleted || isClosed}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {/* Read-Only Platform / Transaction Info */}
                <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Transaction Information</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-semibold capitalize text-foreground">{currentDeal.paymentStatus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee</span>
                      <span className="text-foreground">0.00 {currentDeal.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net creator payout</span>
                      <span className="font-medium text-foreground">{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deliverables Section */}
            {activeTab === 'delivery' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Deliverables Scope</h3>
                    <p className="text-xs text-muted-foreground">Manage files, attachments, and project deliverables.</p>
                  </div>
                  {!isClosed && (
                    <Dialog open={newDelivOpen} onOpenChange={setNewDelivOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1.5 h-8 text-xs">
                          <Plus className="h-3.5 w-3.5" />
                          Add Deliverable
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Deliverable</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddDeliverable} className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Deliverable Name *</Label>
                            <Input
                              placeholder="e.g. Logo Design Assets"
                              value={newDelivName}
                              onChange={(e) => setNewDelivName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Description (optional)</Label>
                            <Input
                              placeholder="e.g. High-res vector exports"
                              value={newDelivDesc}
                              onChange={(e) => setNewDelivDesc(e.target.value)}
                            />
                          </div>
                          {addDelivErr && (
                            <div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                              {addDelivErr}
                            </div>
                          )}
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setNewDelivOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={addingDeliv}>
                              {addingDeliv ? 'Adding...' : 'Add Deliverable'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <hr className="border-border" />

                {/* Deliverables List */}
                <div className="space-y-3">
                  {localDeliverables.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No deliverables configured.</p>
                  ) : (
                    localDeliverables.map((del) => {
                      const versions = fileVersions.filter((v) => v.deliverableId === del.id);
                      return (
                        <div key={del.id} className="rounded-xl border border-border p-3 space-y-3 bg-muted/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-semibold text-foreground">{del.name}</h4>
                              {del.description && <p className="text-[11px] text-muted-foreground">{del.description}</p>}
                            </div>
                            {!isClosed && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setRenameDelivId(del.id);
                                    setRenameDelivName(del.name);
                                    setRenameDelivDesc(del.description || '');
                                    setRenameDelivOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setDeleteDelivId(del.id);
                                    setDeleteDelivName(del.name);
                                    setDeleteDelivOpen(true);
                                  }}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* File versions list for replacement */}
                          {versions.length > 0 && (
                            <div className="border-t border-border/60 pt-2 space-y-2">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase">File Versions & Replacement</p>
                              {versions.map((v) => (
                                <div key={v.id} className="bg-background/80 rounded-lg p-2.5 border border-border space-y-1.5">
                                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                    <span>Version {v.version}</span>
                                    <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="space-y-1">
                                    {v.files.map((f) => {
                                      const isReplaced = f.deletionStatus === 'retention' || f.deletionStatus === 'deleted';
                                      if (isReplaced) return null;
                                      return (
                                        <div key={f.id} className="space-y-1">
                                          <FileCard file={f} locked={v.locked && !isPaid} />
                                          {!isClosed && (
                                            <div className="flex justify-end">
                                              <Label className="text-[10px] text-primary hover:underline cursor-pointer flex items-center gap-1 font-medium bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                                {replacingFileId === f.id ? (
                                                  <span className="animate-pulse">Uploading replacement...</span>
                                                ) : (
                                                  <>
                                                    <RefreshCw className="h-3 w-3" />
                                                    Replace File
                                                  </>
                                                )}
                                                <input
                                                  type="file"
                                                  className="hidden"
                                                  disabled={replacingFileId !== null}
                                                  onChange={(e) => handleReplaceFile(del.id, v.id, f.id, e.target.files?.[0] || null)}
                                                />
                                              </Label>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Preview & Security Settings */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Preview & Security Settings</h3>
                  <p className="text-xs text-muted-foreground">Control client access authentication and preview watermarks.</p>
                </div>
                <hr className="border-border" />
                <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-xl border border-border">
                  <input
                    type="checkbox"
                    id="previewEnabled"
                    checked={editPreviewEnabled}
                    disabled={isClosed}
                    onChange={(e) => setEditPreviewEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="previewEnabled" className="text-xs font-normal cursor-pointer select-none">
                    Enable secure, watermarked client preview files
                  </Label>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3 text-xs">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Client Access Control</h4>
                  <p className="text-muted-foreground">
                    This deal is restricted to the client email: <span className="font-semibold text-foreground">{editClientEmail}</span>.
                    The client must request a secure 6-digit OTP code to access the workspace.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/deals/${currentDeal.token}/resend-invite`, { method: 'POST' });
                          if (res.ok) alert('Invitation email resent successfully!');
                          else alert('Failed to resend invite.');
                        } catch (e) {
                          alert('Error sending invitation.');
                        }
                      }}
                    >
                      Resend Invitation Email
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">Irreversible administrative actions for this project.</p>
                </div>
                <hr className="border-border" />
                <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20 space-y-3">
                  <h4 className="text-xs font-semibold text-destructive">Close & Archive Deal</h4>
                  <p className="text-xs text-muted-foreground">
                    Closing the deal will hide the client portal access immediately. All uploaded deliverable files will enter a retention period before permanent deletion from storage.
                  </p>
                  <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="text-xs" disabled={isClosed}>
                        {isClosed ? 'Deal Already Closed' : 'Close and Delete Deal'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Close and permanently delete this Deal?</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 py-2 text-sm text-muted-foreground">
                        <p className="text-foreground font-medium">
                          This action cannot be undone. Closing this Deal will permanently delete:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                          <li>The Deal workspace and all access links</li>
                          <li>All chat messages and conversations</li>
                          <li>Timeline events and activity history</li>
                          <li>All deliverables, file versions, and uploaded storage files (after retention)</li>
                        </ul>
                        {closeError && (
                          <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                            {closeError}
                          </p>
                        )}
                      </div>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={closing}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleCloseDeal} disabled={closing}>
                          {closing ? 'Deleting Deal...' : 'Close & Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shared Dialogs for Rename/Delete Deliverables */}
      <Dialog open={renameDelivOpen} onOpenChange={setRenameDelivOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Deliverable</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameDeliverable} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Deliverable Name *</Label>
              <Input
                value={renameDelivName}
                onChange={(e) => setRenameDelivName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                value={renameDelivDesc}
                onChange={(e) => setRenameDelivDesc(e.target.value)}
              />
            </div>
            {renameDelivErr && (
              <div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                {renameDelivErr}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameDelivOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renamingDeliv}>
                {renamingDeliv ? 'Saving...' : 'Rename'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDelivOpen} onOpenChange={setDeleteDelivOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deliverable?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              Are you sure you want to delete deliverable <span className="font-semibold text-foreground">"{deleteDelivName}"</span>?
            </p>
            <p className="text-xs text-red-500 font-medium">
              Important: All associated file versions will be hidden, and their uploaded storage files will enter the retention period before deletion.
            </p>
            {deleteDelivErr && (
              <div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                {deleteDelivErr}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDelivOpen(false)} disabled={deletingDeliv}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDeliverable} disabled={deletingDeliv}>
              {deletingDeliv ? 'Deleting...' : 'Delete Deliverable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
