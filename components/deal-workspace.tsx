'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileCheck,
  CreditCard,
  Activity,
  ArrowLeftRight,
  Send,
  Paperclip,
  Check,
  X,
  AlertCircle,
  Upload,
  Lock,
  Flag,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Copy,
  Link as LinkIcon,
  Share2,
  ExternalLink,
  Edit,
  Trash,
  Plus,
  RefreshCw,
  Settings,
  Eye,
  FileText,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { Breadcrumb } from '@/components/app-shell';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealStatusBadge, PaymentStatusBadge, DeliverableStatusBadge } from '@/components/deal-status-badge';
import { PriceProposalCard } from '@/components/price-proposal-card';
import { ChatMessageItem } from '@/components/chat-message';
import { FileCard } from '@/components/file-card';
import { Timeline } from '@/components/timeline-event';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { EmptyState } from '@/components/empty-state';
import { ScopeMilestones } from '@/components/scope-milestones';
import { DealCard } from '@/components/deal/deal-card';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { getCreatorUsername, getClientDealUrl, getDealPublicUrl } from '@/lib/deal-url';
import { useRouter } from 'next/navigation';
import { cn, serializeDescription, parseDescription } from '@/lib/utils';
import { uploadQueue, type UploadTask } from '@/lib/upload-queue';
import { addMessageToStore, addProposalToStore, respondToProposalInStore, permanentlyDeleteDealInStore, closeDealInStore } from '@/lib/app-store';
import { printWithFilename } from '@/lib/print-utils';
import { getCanonicalDeliverables } from '@/lib/deals/canonical-deliverables';
import { CreatorContractPanel } from '@/components/contract/creator-contract-panel';
import type { Deal, DealMessage, PriceProposal, DealEvent, FileVersion, Deliverable, Milestone, Payment, ChangeRequest } from '@/lib/types';

function getInitials(name: string) {
  if (!name) return 'YA';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

interface DealWorkspaceProps {
  deal: Deal;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  creatorName: string;
  messages: DealMessage[];
  proposals: PriceProposal[];
  deliverables: Deliverable[];
  fileVersions: FileVersion[];
  events: DealEvent[];
  milestones: Milestone[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
  invoices?: any[];
  contract?: any;
  hasAgreement?: boolean;
}

export function DealWorkspace({
  deal,
  clientName,
  clientEmail,
  clientCompany,
  creatorName,
  messages,
  proposals,
  deliverables,
  fileVersions,
  events,
  milestones,
  payments,
  changeRequests,
  invoices = [],
  contract: contractProp,
  hasAgreement: hasAgreementProp,
}: DealWorkspaceProps) {
  const router = useRouter();
  const [currentDeal, setCurrentDeal] = useState<Deal>(deal);
  const isPaidOrCompleted = currentDeal.paymentStatus === 'paid' || currentDeal.status === 'completed';

  // Authoritative feature-conditional flags
  const hasAgreement = Boolean(
    hasAgreementProp ||
    contractProp ||
    (currentDeal as any).createAgreement ||
    events.some((e) => (e.type as string) === 'contract_created' || (e.type as string) === 'contract_sent' || (e.type as string) === 'contract_accepted')
  );
  const hasMilestones = Boolean(milestones && milestones.length > 0);
  const hasInvoice = Boolean(invoices && invoices.length > 0);

  const [activeTab, setActiveTab] = useState('overview');

  // Auto-fallback activeTab if on a removed or disabled tab
  useEffect(() => {
    if (activeTab === 'payments' || activeTab === 'payment') {
      setActiveTab('overview');
    } else if (activeTab === 'agreement' && !hasAgreement) {
      setActiveTab('overview');
    }
  }, [activeTab, hasAgreement]);

  const [localFileVersions, setLocalFileVersions] = useState<FileVersion[]>(fileVersions);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewLoadingFileId, setPreviewLoadingFileId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDeal(deal);
  }, [deal]);

  useEffect(() => {
    setLocalFileVersions(fileVersions);
  }, [fileVersions]);

  async function refreshFiles() {
    try {
      const supabase = createClient();
      const { data: dbVersions } = await supabase
        .from('file_versions')
        .select('*')
        .eq('deal_id', currentDeal.id)
        .order('version', { ascending: true });

      if (dbVersions) {
        const formatted = dbVersions.map((v: any) => ({
          id: v.id,
          deliverableId: v.deliverable_id,
          dealId: v.deal_id,
          version: v.version,
          description: v.description,
          uploaderId: v.uploader_id,
          uploaderName: v.uploader_name,
          files: Array.isArray(v.files) ? v.files : [],
          status: v.status,
          locked: Boolean(v.locked),
          createdAt: v.created_at,
        }));
        setLocalFileVersions(formatted);
      }
    } catch (err) {
      console.error('Error refreshing files:', err);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleRefresh = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.dealId === currentDeal.id) {
        refreshFiles();
      }
    };
    window.addEventListener('delt-files-uploaded', handleRefresh);
    return () => {
      window.removeEventListener('delt-files-uploaded', handleRefresh);
    };
  }, [currentDeal.id]);

  // Polling for processing previews
  useEffect(() => {
    let hasProcessing = false;
    for (const v of localFileVersions) {
      const files = Array.isArray(v.files) ? v.files : [];
      if (files.some((f: any) => f.previewStatus === 'processing')) {
        hasProcessing = true;
        break;
      }
    }

    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const supabase = createClient();
        const { data: dbVersions } = await supabase
          .from('file_versions')
          .select('*')
          .eq('deal_id', currentDeal.id)
          .order('version', { ascending: true });

        if (dbVersions) {
          const formatted = dbVersions.map((v: any) => ({
            id: v.id,
            deliverableId: v.deliverable_id,
            dealId: v.deal_id,
            version: v.version,
            description: v.description,
            uploaderId: v.uploader_id,
            uploaderName: v.uploader_name,
            files: Array.isArray(v.files) ? v.files : [],
            status: v.status,
            locked: Boolean(v.locked),
            createdAt: v.created_at,
          }));

          setLocalFileVersions(formatted);

          // Check if still has processing
          const stillProcessing = formatted.some((v: any) =>
            v.files.some((f: any) => f.previewStatus === 'processing')
          );
          if (!stillProcessing) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error polling preview status:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [localFileVersions, currentDeal.id]);

  async function handleViewPreview(versionId: string, fileId: string, fileName: string, mimeType: string) {
    if (previewLoadingFileId) return;
    setPreviewLoadingFileId(fileId);
    try {
      const res = await fetch('/api/files/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: currentDeal.id,
          token: currentDeal.token,
          fileVersionId: versionId,
          fileId: fileId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to fetch preview');
        return;
      }

      const { signedUrl } = await res.json();
      setPreviewUrl(signedUrl);
      setPreviewMimeType(mimeType);
      setPreviewFileName(fileName);
      setPreviewModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Error loading preview');
    } finally {
      setPreviewLoadingFileId(null);
    }
  }

  async function handleRetryPreview(versionId: string, fileId: string) {
    try {
      const res = await fetch('/api/files/preview-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: currentDeal.id,
          fileVersionId: versionId,
          fileId,
        }),
      });

      if (res.ok) {
        setLocalFileVersions((prev) =>
          prev.map((v) => {
            if (v.id === versionId) {
              return {
                ...v,
                files: v.files.map((f: any) =>
                  f.id === fileId ? { ...f, previewStatus: 'processing' } : f
                ),
              };
            }
            return v;
          })
        );
      } else {
        alert('Failed to trigger preview retry.');
      }
    } catch (err: any) {
      alert('Error retrying preview: ' + err.message);
    }
  }

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharingPoster, setSharingPoster] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  function cloneNodeWithComputedStyles(sourceNode: HTMLElement): HTMLElement {
    const clone = sourceNode.cloneNode(true) as HTMLElement;
    const sourceElements = Array.from(sourceNode.querySelectorAll('*'));
    const cloneElements = Array.from(clone.querySelectorAll('*'));

    const rootComputed = window.getComputedStyle(sourceNode);
    for (let i = 0; i < rootComputed.length; i++) {
      const prop = rootComputed[i];
      try {
        clone.style.setProperty(prop, rootComputed.getPropertyValue(prop), rootComputed.getPropertyPriority(prop));
      } catch {
        // ignore read-only style properties
      }
    }

    sourceElements.forEach((sourceEl, index) => {
      const cloneEl = cloneElements[index] as Element;
      if (cloneEl && sourceEl instanceof Element) {
        if (sourceEl.tagName.toLowerCase() === 'svg' && !cloneEl.getAttribute('xmlns')) {
          cloneEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        const computed = window.getComputedStyle(sourceEl);
        for (let i = 0; i < computed.length; i++) {
          const prop = computed[i];
          try {
            (cloneEl as HTMLElement).style?.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop));
          } catch {
            // ignore read-only style properties
          }
        }
      }
    });

    return clone;
  }

  async function generatePosterFile(element: HTMLElement, dealCode: string): Promise<File | null> {
    try {
      const width = element.offsetWidth || 380;
      const height = element.offsetHeight || 520;

      let cssRules = '';
      try {
        const styleSheets = Array.from(document.styleSheets);
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              cssRules += rule.cssText + '\n';
            }
          } catch {
            // Ignore cross-origin stylesheet security blocks
          }
        }
      } catch (e) {
        console.warn('Could not extract styleSheets:', e);
      }

      const clone = cloneNodeWithComputedStyles(element);
      clone.style.width = `${width}px`;
      clone.style.height = `${height}px`;
      clone.style.boxSizing = 'border-box';
      const htmlString = new XMLSerializer().serializeToString(clone);

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <defs>
            <style>
              ${cssRules}
              * { box-sizing: border-box; }
              body, html { margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            </style>
          </defs>
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="background-color: #0F172A; color: #F8FAFC; width: ${width}px; height: ${height}px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${htmlString}
            </div>
          </foreignObject>
        </svg>
      `;

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      return new Promise<File | null>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const scale = 2; // 2x HiDPI sharp output
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(url);
              resolve(null);
              return;
            }
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            canvas.toBlob((blob) => {
              if (!blob) {
                resolve(null);
                return;
              }
              const cleanCode = (dealCode || 'DLT-DEAL').replace(/[^A-Z0-9]/gi, '').toUpperCase();
              const filename = `DELT-${cleanCode}.png`;
              const file = new File([blob], filename, { type: 'image/png' });
              resolve(file);
            }, 'image/png');
          } catch (err) {
            console.error('Canvas drawImage error:', err);
            URL.revokeObjectURL(url);
            resolve(null);
          }
        };
        img.onerror = (err) => {
          console.error('SVG image load error:', err);
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });
    } catch (err) {
      console.error('Poster capture error:', err);
      return null;
    }
  }

  const creatorUsername = getCreatorUsername({ displayName: creatorName, username: (currentDeal as any).creatorUsername || (currentDeal as any).creator_username });
  const canonicalUrl = getClientDealUrl(currentDeal.dealCode || currentDeal.token || (currentDeal as any).id, creatorUsername);
  const isClosed = currentDeal.status === 'closed';

  const handleShare = async () => {
    // Native share sheet first (mobile); the polished share surface is the
    // fallback/home for desktop. The canonical deal URL is unchanged.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: currentDeal.title,
          text: `Review and collaborate on "${currentDeal.title}" on DELT`,
          url: canonicalUrl,
        });
        return;
      } catch (err) {
        // User dismissed or share failed — open the share surface instead.
      }
    }
    setShareOpen(true);
  };

  async function handleCloseDeal() {
    setClosing(true);
    setCloseError('');

    try {
      const res = await fetch(`/api/deals/${currentDeal.dealCode || currentDeal.id}/close`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json();
        setCloseError(errJson.error || 'Failed to close deal.');
        setClosing(false);
        return;
      }

      closeDealInStore(currentDeal.id);
      setCurrentDeal((prev) => ({
        ...prev,
        status: 'closed',
        updatedAt: new Date().toISOString(),
      }));
      setCloseDialogOpen(false);
      setClosing(false);
    } catch (err: any) {
      console.error('Error closing deal:', err);
      setCloseError(err.message || 'Failed to close deal.');
      setClosing(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 space-y-4">
        <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: currentDeal.title }]} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">{currentDeal.title}</h1>
              <DealStatusBadge status={currentDeal.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
              <span>·</span>
              <span>{clientName}</span>
              {clientCompany && <><span>·</span><span>{clientCompany}</span></>}
              <span>·</span>
              <span className="font-mono text-[11px] text-muted-foreground">{currentDeal.dealCode || currentDeal.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(canonicalUrl);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  {linkCopied ? 'Link Copied!' : 'Copy Deal Link'}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/deals/${currentDeal.dealCode || currentDeal.id}/settings`}>
                    <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    Deal Settings
                  </Link>
                </DropdownMenuItem>
                {!isClosed && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setCloseDialogOpen(true)} className="text-amber-600 dark:text-amber-400">
                      <Lock className="h-3.5 w-3.5 mr-2" />
                      Close Deal
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isClosed && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300">
            <Check className="h-4 w-4 text-zinc-500 shrink-0" />
            <span>This Deal is closed.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <TabsList className="w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {hasAgreement && <TabsTrigger value="agreement">Agreement</TabsTrigger>}
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            deal={currentDeal}
            deliverables={deliverables}
            milestones={milestones}
            events={events}
            clientName={clientName}
            creatorName={creatorName}
            invoices={invoices}
            hasAgreement={hasAgreement}
            hasMilestones={hasMilestones}
            hasInvoice={hasInvoice}
            changeRequests={changeRequests}
            setInvoiceModalOpen={setInvoiceModalOpen}
            onCreateInvoice={() => setCreateInvoiceOpen(true)}
            onNavigateTab={setActiveTab}
          />
        </TabsContent>
        {hasAgreement && (
          <TabsContent value="agreement" className="mt-4">
            <CreatorContractPanel
              dealCode={currentDeal.dealCode || currentDeal.id}
              dealTitle={currentDeal.title}
              creatorName={creatorName}
              clientName={clientName}
              clientEmail={clientEmail}
            />
          </TabsContent>
        )}
        <TabsContent value="chat" className="mt-4">
          <ChatTab deal={currentDeal} messages={messages} proposals={proposals} creatorName={creatorName} isClosed={isClosed} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FilesTab deal={currentDeal} deliverables={deliverables} fileVersions={localFileVersions} changeRequests={changeRequests} isClosed={isClosed} handleViewPreview={handleViewPreview} handleRetryPreview={handleRetryPreview} previewLoadingFileId={previewLoadingFileId} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab events={events} />
        </TabsContent>
      </Tabs>

      {/* Share Deal surface — Deal Card as the visual centerpiece */}
      <Dialog open={shareOpen} onOpenChange={(open) => { setShareOpen(open); if (!open) setShareCopied(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div ref={posterRef}>
              <DealCard
                deal={currentDeal}
                creatorUsername={creatorUsername}
                creatorName={creatorName}
                clientName={clientName}
                deliverablesCount={deliverables.length}
                milestones={milestones}
                variant="share"
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
              <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate select-all font-mono text-xs">{canonicalUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 gap-1.5 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(canonicalUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
              >
                {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {shareCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The link opens the client&apos;s private workspace. Access stays protected by email OTP verification.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(canonicalUrl);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                {shareCopied ? 'Link Copied!' : 'Copy Link'}
              </Button>
              <Button
                className="w-full gap-1.5"
                disabled={sharingPoster}
                onClick={async () => {
                  setSharingPoster(true);
                  try {
                    const shareTitle = `DELT — ${currentDeal.title}`;
                    const shareText = `Private deal: ${currentDeal.title}`;
                    const shareUrl = canonicalUrl;
                    const dealCode = currentDeal.dealCode || currentDeal.id;

                    let posterFile: File | null = null;
                    if (posterRef.current) {
                      posterFile = await generatePosterFile(posterRef.current, dealCode);
                    }

                    if (typeof navigator !== 'undefined' && navigator.share) {
                      // 1. Try native file + URL sharing if supported
                      if (posterFile && navigator.canShare) {
                        const fileShareData = { title: shareTitle, text: shareText, url: shareUrl, files: [posterFile] };
                        if (navigator.canShare(fileShareData)) {
                          try {
                            await navigator.share(fileShareData);
                            return;
                          } catch (err: any) {
                            if (err.name === 'AbortError') return;
                          }
                        }
                      }

                      // 2. Fallback to Web Share with URL only
                      const textShareData = { title: shareTitle, text: shareText, url: shareUrl };
                      if (navigator.canShare ? navigator.canShare(textShareData) : true) {
                        try {
                          await navigator.share(textShareData);
                          return;
                        } catch (err: any) {
                          if (err.name === 'AbortError') return;
                        }
                      }
                    }

                    // 3. Desktop fallback: copy link and download poster image if available
                    if (posterFile) {
                      const a = document.createElement('a');
                      const fileUrl = URL.createObjectURL(posterFile);
                      a.href = fileUrl;
                      a.download = posterFile.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
                    }
                    await navigator.clipboard.writeText(shareUrl);
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  } finally {
                    setSharingPoster(false);
                  }
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
                {sharingPoster ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secure File Preview Modal for Creator */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base truncate">Preview — {previewFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-muted/20 min-h-[40vh] max-h-[60vh] rounded-md relative">
            {previewMimeType.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={previewFileName}
                className="max-w-full max-h-[55vh] object-contain rounded shadow-sm select-none pointer-events-none"
              />
            ) : previewMimeType === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                title={previewFileName}
                className="w-full h-[55vh] border-0 rounded shadow-sm"
              />
            ) : previewMimeType.startsWith('video/') ? (
              <video
                src={previewUrl}
                controls
                controlsList="nodownload"
                className="max-w-full max-h-[55vh] object-contain rounded shadow-sm"
              />
            ) : (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm font-semibold text-foreground">Preview unavailable</p>
                <p className="text-xs text-muted-foreground">Watermarked preview is still processing or has failed.</p>
              </div>
            )}
          </div>
          <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium">
              <Lock className="h-3.5 w-3.5" />
              <span>Preview mode — Watermarked view of the deliverable file.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Invoice Modal */}
      <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-4 sm:p-6">
            <InvoiceForm
              deal={currentDeal}
              invoice={invoices.find((i) => i.status === 'draft') || invoices[0]}
              onSuccess={() => {
                setCreateInvoiceOpen(false);
                router.refresh();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-background border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Invoice Document</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const activeInvoice = invoices?.find(i => i.status !== 'draft') || invoices[0];
                if (!activeInvoice) return;
                const code = activeInvoice.invoice_code || activeInvoice.invoice_number || 'UNKNOWN';
                printWithFilename(`DELT-${code}-INVOICE`);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Save PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInvoiceModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 sm:p-6 pb-12">
            {invoices.length > 0 && (
              <InvoicePreview
                invoice={invoices.find(i => i.status !== 'draft') || invoices[0]}
                deal={currentDeal}
                client={{ name: clientName, email: clientEmail }}
                creator={{ name: creatorName }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice - always in DOM, only visible when printing */}
      <div className="hidden print:block invoice-document">
        {invoices.length > 0 && (
          <InvoicePreview
            invoice={invoices.find(i => i.status !== 'draft') || invoices[0]}
            deal={currentDeal}
            client={{ name: clientName, email: clientEmail }}
            creator={{ name: creatorName }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice Card Component
// ---------------------------------------------------------------------------

function InvoiceCard({
  deal,
  invoices = [],
  setInvoiceModalOpen,
  onCreateInvoice,
}: {
  deal: Deal;
  invoices?: any[];
  setInvoiceModalOpen?: (open: boolean) => void;
  onCreateInvoice?: () => void;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const activeInvoice = invoices.length > 0 ? invoices[0] : null;

  async function handleIssue(id: string) {
    setLoadingAction('issue');
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) alert(data.error || 'Failed to issue invoice');
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Error issuing invoice');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    setLoadingAction('cancel');
    try {
      const res = await fetch(`/api/invoices/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) alert(data.error || 'Failed to cancel invoice');
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Error cancelling invoice');
    } finally {
      setLoadingAction(null);
    }
  }

  if (!activeInvoice) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">Invoicing</h3>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Create an official itemized invoice for this deal with custom line items, tax, and discount.
        </p>
        <Button variant="outline" className="w-full text-xs h-9 gap-1.5" onClick={onCreateInvoice}>
          <Plus className="h-3.5 w-3.5" />
          Create Invoice
        </Button>
      </div>
    );
  }

  const isDraft = activeInvoice.status === 'draft';
  const isPaid = activeInvoice.status === 'paid';
  const isCancelled = activeInvoice.status === 'cancelled';
  const statusColor = isPaid
    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
    : isDraft
    ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400'
    : isCancelled
    ? 'text-destructive bg-destructive/10'
    : 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400';

  return (
    <div className="bg-card rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Invoice</h3>
        <span className="text-xs font-mono font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
          {activeInvoice.invoice_number}
        </span>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{isPaid ? 'Total Amount' : 'Amount Due'}</p>
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(activeInvoice.total_amount, activeInvoice.currency)}</p>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md capitalize ${statusColor}`}>
              {activeInvoice.status}
            </span>
          </div>
          {activeInvoice.due_date && !isPaid && (
            <span className="text-muted-foreground">
              Due: {new Date(activeInvoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {isPaid && activeInvoice.paid_at && (
          <p className="text-xs text-muted-foreground">
            Paid on: {new Date(activeInvoice.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        <div className="pt-3 border-t border-primary/10 grid grid-cols-2 gap-2">
          {isDraft ? (
            <>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" onClick={onCreateInvoice}>
                Edit Draft
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs h-8"
                onClick={() => handleIssue(activeInvoice.id)}
                disabled={loadingAction === 'issue'}
              >
                {loadingAction === 'issue' ? 'Issuing...' : 'Issue Invoice'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" onClick={() => setInvoiceModalOpen?.(true)}>
                <ExternalLink className="h-3 w-3 mr-1.5" />
                View
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  const code = activeInvoice.invoice_code || activeInvoice.invoice_number || 'UNKNOWN';
                  printWithFilename(`DELT-${code}-INVOICE`);
                }}
              >
                <Download className="h-3 w-3 mr-1.5" />
                Download
              </Button>
            </>
          )}
        </div>

        {!isPaid && !isCancelled && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-destructive h-7 mt-1"
            onClick={() => handleCancel(activeInvoice.id)}
            disabled={loadingAction === 'cancel'}
          >
            Cancel Invoice
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function NeedsAttentionCard({
  deal,
  deliverables,
  changeRequests,
  invoices,
  hasAgreement,
  hasMilestones,
  hasInvoice,
  onNavigateTab,
}: {
  deal: Deal;
  deliverables: Deliverable[];
  changeRequests: ChangeRequest[];
  invoices?: any[];
  hasAgreement: boolean;
  hasMilestones: boolean;
  hasInvoice: boolean;
  onNavigateTab: (tab: string) => void;
}) {
  const pendingRevisions = changeRequests.filter((cr) => cr.status === 'open');
  const pendingReviews = deal.previewEnabled ? deliverables.filter((d) => d.status === 'uploaded') : [];
  const isPaymentPending = deal.status === 'payment_pending' || (deal.paymentStatus !== 'paid' && deal.paymentStatus !== 'none');
  const unpaidInvoice = hasInvoice ? invoices?.find((i) => i.status === 'sent' || i.status === 'overdue') : null;

  const attentionItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    actionText: string;
    onClick: () => void;
  }> = [];

  if (pendingRevisions.length > 0) {
    pendingRevisions.forEach((cr) => {
      attentionItems.push({
        id: `rev-${cr.id}`,
        title: 'Client requested changes',
        subtitle: cr.description || cr.title || 'Revision requested on deliverable',
        actionText: 'Open Files →',
        onClick: () => onNavigateTab('files'),
      });
    });
  }

  if (pendingReviews.length > 0) {
    pendingReviews.forEach((del) => {
      attentionItems.push({
        id: `del-${del.id}`,
        title: 'Deliverable awaiting client review',
        subtitle: del.name,
        actionText: 'Open Files →',
        onClick: () => onNavigateTab('files'),
      });
    });
  }

  if (hasInvoice && unpaidInvoice) {
    attentionItems.push({
      id: `inv-${unpaidInvoice.id}`,
      title: 'Invoice payment pending',
      subtitle: `${unpaidInvoice.number || unpaidInvoice.invoice_number || 'Invoice'} · ${formatCurrency(unpaidInvoice.amount || unpaidInvoice.total_amount || deal.price, deal.currency)}`,
      actionText: 'View Details →',
      onClick: () => onNavigateTab('overview'),
    });
  } else if (isPaymentPending && deliverables.some((d) => d.status === 'approved')) {
    attentionItems.push({
      id: 'pay-pending',
      title: 'Deliverables approved · Payment pending',
      subtitle: `Total amount: ${formatCurrency(deal.price, deal.currency)}`,
      actionText: 'View Details →',
      onClick: () => onNavigateTab('overview'),
    });
  }

  if (attentionItems.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <div>
          <p className="font-semibold text-foreground text-sm">Everything is up to date</p>
          <p className="text-muted-foreground">Nothing needs your attention right now.</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-amber-500/10">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-500">Needs your attention</CardTitle>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
          {attentionItems.length} {attentionItems.length === 1 ? 'item' : 'items'}
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {attentionItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-card/80 border border-border/40">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 text-xs h-8" onClick={item.onClick}>
              {item.actionText}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OverviewTab({
  deal,
  deliverables,
  milestones,
  events,
  clientName,
  creatorName,
  invoices,
  hasAgreement,
  hasMilestones,
  hasInvoice,
  changeRequests = [],
  setInvoiceModalOpen,
  onCreateInvoice,
  onNavigateTab,
}: {
  deal: Deal;
  deliverables: Deliverable[];
  milestones: Milestone[];
  events: DealEvent[];
  clientName: string;
  creatorName: string;
  invoices?: any[];
  hasAgreement: boolean;
  hasMilestones: boolean;
  hasInvoice: boolean;
  changeRequests?: ChangeRequest[];
  setInvoiceModalOpen?: (open: boolean) => void;
  onCreateInvoice?: () => void;
  onNavigateTab: (tab: string) => void;
}) {
  const activeInvoice = invoices?.find((i) => i.status !== 'draft');

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <NeedsAttentionCard
          deal={deal}
          deliverables={deliverables}
          changeRequests={changeRequests}
          invoices={invoices}
          hasAgreement={hasAgreement}
          hasMilestones={hasMilestones}
          hasInvoice={hasInvoice}
          onNavigateTab={onNavigateTab}
        />

        <ScopeMilestones 
          deal={deal} 
          milestones={milestones} 
          isCreator={true} 
          showScope={true}
          showMilestones={hasMilestones}
        />
      </div>

      <div className="space-y-6">
        {/* Compact Payment & Client Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Payment & Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground">Deal Amount</span>
              <span className="font-semibold text-sm text-foreground">{formatCurrency(deal.price, deal.currency)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground">Payment Status</span>
              <PaymentStatusBadge status={deal.paymentStatus} />
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium text-foreground">{clientName}</span>
            </div>
            {hasInvoice && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Invoice</span>
                {activeInvoice ? (
                  <Button variant="link" className="p-0 h-auto text-xs font-semibold text-primary" onClick={() => setInvoiceModalOpen?.(true)}>
                    {activeInvoice.number || activeInvoice.invoice_number || 'View Invoice'} →
                  </Button>
                ) : (
                  <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground" onClick={onCreateInvoice}>
                    + Create Invoice
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            {events.length > 4 && (
              <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground hover:text-foreground p-0" onClick={() => onNavigateTab('activity')}>
                View all →
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No activity recorded yet.</p>
            ) : (
              <Timeline events={events.slice(0, 4)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Tab (With Supabase Realtime Scoped Subscription)
// ---------------------------------------------------------------------------

function ChatTab({
  deal,
  messages,
  proposals,
  creatorName,
  isClosed,
}: {
  deal: Deal;
  messages: DealMessage[];
  proposals: PriceProposal[];
  creatorName: string;
  isClosed?: boolean;
}) {
  const [localMessages, setLocalMessages] = useState<DealMessage[]>(messages);
  const [localProposals, setLocalProposals] = useState<PriceProposal[]>(proposals);
  const [input, setInput] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<PriceProposal | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Supabase Realtime Subscription Scoped to Deal
  useEffect(() => {
    if (!hasSupabasePublicConfig()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`deal:${deal.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_proposals', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          const raw = payload.new as any;
          const formattedProp: PriceProposal = {
            id: raw.id,
            dealId: raw.deal_id || raw.dealId || deal.id,
            direction: raw.direction,
            previousPrice: Number(raw.previous_price ?? raw.previousPrice ?? 0),
            proposedPrice: Number(raw.proposed_price ?? raw.proposedPrice ?? 0),
            reason: raw.reason,
            state: raw.state,
            proposedBy: raw.proposed_by || raw.proposedBy || 'user',
            proposedByName: raw.proposed_by_name || raw.proposedByName || 'User',
            proposedByRole: raw.proposed_by_role || raw.proposedByRole || 'creator',
            counterProposalId: raw.parent_proposal_id || raw.parentProposalId || raw.counter_proposal_id || raw.counterProposalId,
            createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          };
          if (payload.eventType === 'INSERT') {
            setLocalProposals((prev) => {
              const filtered = prev.filter((p) => !(p.id.startsWith('prop_') && p.proposedPrice === formattedProp.proposedPrice && p.proposedByRole === formattedProp.proposedByRole));
              if (filtered.some((p) => p.id === formattedProp.id)) return filtered;
              return [...filtered, formattedProp];
            });
          } else if (payload.eventType === 'UPDATE') {
            setLocalProposals((prev) =>
              prev.map((p) => (p.id === formattedProp.id ? formattedProp : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deal.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [localMessages]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);

  async function sendMessage() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    // Optimistic local add
    const optId = `msg_${Date.now()}`;
    const optMsg: DealMessage = {
      id: optId,
      dealId: deal.id,
      senderId: 'creator',
      senderName: creatorName,
      senderRole: 'creator',
      type: 'text',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optMsg]);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          senderId: 'creator',
          senderName: creatorName,
          senderRole: 'creator',
          type: 'text',
          content: text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          const serverMsg: DealMessage = {
            id: data.message.id,
            dealId: data.message.deal_id,
            senderId: data.message.sender_id,
            senderName: data.message.sender_name,
            senderRole: data.message.sender_role,
            type: data.message.type,
            content: data.message.content,
            createdAt: data.message.created_at,
          };
          setLocalMessages((prev) =>
            prev.map((m) => (m.id === optId ? serverMsg : m))
          );
        }
      }
    } catch (e) {
      console.error('Error sending message:', e);
    }
  }

  async function handleAcceptProposal(proposal: PriceProposal) {
    try {
      await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          dealId: deal.id,
          response: 'accept',
          responderName: creatorName,
          responderRole: 'creator',
        }),
      });
    } catch (e) {
      console.error(e);
    }

    respondToProposalInStore(deal.id, proposal.id, 'accept', creatorName);
    setProposalOpen(false);
    setCounterOpen(false);
  }

  async function handleDeclineProposal(proposal: PriceProposal) {
    try {
      await fetch('/api/negotiation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: proposal.id,
          dealId: deal.id,
          response: 'decline',
          responderName: creatorName,
          responderRole: 'creator',
        }),
      });
    } catch (e) {
      console.error(e);
    }
    respondToProposalInStore(deal.id, proposal.id, 'decline', creatorName);
    setProposalOpen(false);
    setCounterOpen(false);
  }

  const pendingProposal = localProposals.find((p) => p.state === 'pending' && p.direction === 'client_to_creator');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {localMessages.map((msg, i) => {
          const prevMsg = localMessages[i - 1];
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';

          if (msg.type === 'proposal' && msg.proposalId) {
            const proposal = localProposals.find((p) => p.id === msg.proposalId);
            if (proposal) {
              return (
                <ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'creator'} showAvatar={showAvatar}>
                  <div className="max-w-sm">
                    <PriceProposalCard
                      proposal={proposal}
                      currency={deal.currency}
                      perspective="creator"
                      onAccept={() => handleAcceptProposal(proposal)}
                      onCounter={() => { setActiveProposal(proposal); setCounterOpen(true); }}
                      onDecline={() => handleDeclineProposal(proposal)}
                    />
                  </div>
                </ChatMessageItem>
              );
            }
          }

          return (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isCurrentUser={msg.senderRole === 'creator'}
              showAvatar={showAvatar}
            />
          );
        })}
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-end gap-2">
          <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Propose Price
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ProposalForm
                currentPrice={deal.price}
                currency={deal.currency}
                disabled={submittingProposal}
                onSubmit={async (price, reason) => {
                  setSubmittingProposal(true);
                  try {
                    const res = await fetch('/api/negotiation/propose', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        dealId: deal.id,
                        proposedPrice: price,
                        reason,
                        proposedByRole: 'creator',
                        proposedByName: creatorName,
                      }),
                    });
                    const json = await res.json();
                    if (res.ok && json.proposal) {
                      const newProp: PriceProposal = {
                        id: json.proposal.id,
                        dealId: json.proposal.deal_id,
                        direction: json.proposal.direction,
                        previousPrice: Number(json.proposal.previous_price),
                        proposedPrice: Number(json.proposal.proposed_price),
                        reason: json.proposal.reason,
                        state: json.proposal.state,
                        proposedBy: json.proposal.proposed_by,
                        proposedByName: json.proposal.proposed_by_name,
                        proposedByRole: json.proposal.proposed_by_role,
                        createdAt: json.proposal.created_at,
                      };
                      addProposalToStore(deal.id, price, reason, 'creator', creatorName);
                      setLocalProposals((prev) => {
                        const filtered = prev.filter((p) => !p.id.startsWith('prop_'));
                        if (filtered.some((p) => p.id === newProp.id)) return filtered;
                        return [...filtered, newProp];
                      });
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setSubmittingProposal(false);
                    setProposalOpen(false);
                  }
                }}
              />
            </DialogContent>
          </Dialog>
          <Textarea
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="min-h-[40px] max-h-24 resize-none"
            rows={1}
          />
          <Button size="icon" onClick={sendMessage} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Pending proposal action banner */}
        {!isClosed && pendingProposal && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
              {pendingProposal.proposedByName} proposed {formatCurrency(pendingProposal.proposedPrice, deal.currency)}
            </span>
            <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setActiveProposal(pendingProposal)}>
                  Respond
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CounterOfferForm
                  proposal={pendingProposal}
                  currency={deal.currency}
                  onAccept={() => handleAcceptProposal(pendingProposal)}
                  onDecline={() => handleDeclineProposal(pendingProposal)}
                  disabled={submittingProposal}
                  onSubmit={async (price, reason) => {
                    setSubmittingProposal(true);
                    try {
                      const res = await fetch('/api/negotiation/propose', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          dealId: deal.id,
                          proposedPrice: price,
                          reason,
                          proposedByRole: 'creator',
                          proposedByName: creatorName,
                          parentProposalId: pendingProposal.id,
                        }),
                      });
                      const json = await res.json();
                      if (res.ok && json.proposal) {
                        const counterProp: PriceProposal = {
                          id: json.proposal.id,
                          dealId: json.proposal.deal_id,
                          direction: json.proposal.direction,
                          previousPrice: Number(json.proposal.previous_price),
                          proposedPrice: Number(json.proposal.proposed_price),
                          reason: json.proposal.reason,
                          state: json.proposal.state,
                          proposedBy: json.proposal.proposed_by,
                          proposedByName: json.proposal.proposed_by_name,
                          proposedByRole: json.proposal.proposed_by_role,
                          counterProposalId: pendingProposal.id,
                          createdAt: json.proposal.created_at,
                        };
                        addProposalToStore(deal.id, price, reason, 'creator', creatorName, pendingProposal.id);
                        setLocalProposals((prev) => {
                          const filtered = prev.map((p) => p.id === pendingProposal.id ? { ...p, state: 'countered' as const } : p)
                            .filter((p) => !p.id.startsWith('prop_'));
                          if (filtered.some((p) => p.id === counterProp.id)) return filtered;
                          return [...filtered, counterProp];
                        });
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setSubmittingProposal(false);
                      setCounterOpen(false);
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalForm({
  currentPrice,
  currency,
  onSubmit,
  disabled,
}: {
  currentPrice: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onSubmit: (price: number, reason: string) => void;
  disabled?: boolean;
}) {
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');

  return (
    <>
      <DialogHeader>
        <DialogTitle>Propose Price Adjustment</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Current price</p>
          <p className="text-lg font-semibold">{formatCurrency(currentPrice, currency)}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposedPrice">New proposed price ({currency})</Label>
          <Input
            id="proposedPrice"
            type="number"
            placeholder={String(currentPrice)}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposalReason">Reason (optional)</Label>
          <Textarea
            id="proposalReason"
            placeholder="Explain why you are proposing this price..."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(Number(price), reason)} disabled={!price || disabled}>
          {disabled ? 'Sending...' : 'Send Proposal'}
        </Button>
      </DialogFooter>
    </>
  );
}

function CounterOfferForm({
  proposal,
  currency,
  onAccept,
  onDecline,
  onSubmit,
  disabled,
}: {
  proposal: PriceProposal;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onAccept: () => void;
  onDecline: () => void;
  onSubmit: (price: number, reason: string) => void;
  disabled?: boolean;
}) {
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');

  return (
    <>
      <DialogHeader>
        <DialogTitle>Respond to Proposal</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-sm font-semibold line-through text-muted-foreground">
              {formatCurrency(proposal.previousPrice, currency)}
            </p>
          </div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 rounded-lg bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Proposed</p>
            <p className="text-sm font-bold text-primary">
              {formatCurrency(proposal.proposedPrice, currency)}
            </p>
          </div>
        </div>
        {proposal.reason && (
          <div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Their reason</p>
            <p className="text-sm">{proposal.reason}</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="counterPrice">Your counter price</Label>
          <Input
            id="counterPrice"
            type="number"
            placeholder={String(proposal.proposedPrice)}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="counterReason">Reason (optional)</Label>
          <Textarea
            id="counterReason"
            placeholder="Explain your counter offer..."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onDecline} className="mr-auto text-muted-foreground" disabled={disabled}>
          <X className="h-4 w-4 mr-1.5" />
          Decline
        </Button>
        <Button variant="outline" onClick={onAccept} className="gap-1.5" disabled={disabled}>
          <Check className="h-4 w-4" />
          Accept
        </Button>
        <Button onClick={() => onSubmit(Number(price), reason)} disabled={!price || disabled}>
          {disabled ? 'Sending...' : 'Send Counter'}
        </Button>
      </DialogFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// Files Tab (Private Storage & Upload Modal)
// ---------------------------------------------------------------------------

function FilesTab({
  deal,
  deliverables,
  fileVersions,
  changeRequests,
  isClosed,
  handleViewPreview,
  handleRetryPreview,
  previewLoadingFileId,
}: {
  deal: Deal;
  deliverables: Deliverable[];
  fileVersions: FileVersion[];
  changeRequests: ChangeRequest[];
  isClosed?: boolean;
  handleViewPreview: (versionId: string, fileId: string, fileName: string, mimeType: string) => Promise<void>;
  handleRetryPreview: (versionId: string, fileId: string) => Promise<void>;
  previewLoadingFileId: string | null;
}) {
  const isPaid = deal.paymentStatus === 'paid';
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(deliverables[0]?.id || '');
  const [fileDesc, setFileDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [localDeliverables, setLocalDeliverables] = useState<Deliverable[]>([]);
  const [activeTasks, setActiveTasks] = useState<UploadTask[]>([]);

  useEffect(() => {
    let prevCompletedCount = 0;
    // Auto-start queued background uploads when the Deal Workspace opens
    uploadQueue.startPendingUploadsForDeal(deal.id);

    return uploadQueue.subscribe((tasks) => {
      const dealTasks = tasks.filter((t) => t.dealId === deal.id);
      setActiveTasks(dealTasks);
      
      const currentCompletedCount = dealTasks.filter(t => t.status === 'completed' || t.status === 'failed').length;
      if (currentCompletedCount > prevCompletedCount) {
        window.dispatchEvent(new CustomEvent('delt-files-uploaded', { detail: { dealId: deal.id } }));
      }
      prevCompletedCount = currentCompletedCount;
    });
  }, [deal.id]);

  const runningTasks = activeTasks;

  useEffect(() => {
    setLocalDeliverables(getCanonicalDeliverables(deal, deliverables, fileVersions));
  }, [deal, deliverables, fileVersions]);

  // Sync preview status from database fileVersions to uploadQueue tasks
  useEffect(() => {
    activeTasks.forEach(task => {
      if (task.status === 'completed' && task.previewStatus === 'processing') {
        for (const fv of fileVersions) {
          const matchedFile = fv.files?.find((f: any) => f.name === task.fileName);
          if (matchedFile && matchedFile.previewStatus && matchedFile.previewStatus !== 'processing') {
            uploadQueue.updateTaskPreviewStatusByFileName(task.fileName, matchedFile.previewStatus);
          }
        }
      }
    });
  }, [fileVersions, activeTasks]);





  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const previewEnabled = deal.previewEnabled;
      const deliverableId = selectedDeliverable || deliverables[0]?.id || '';

      uploadQueue.addUploads(
        deal.id,
        deliverableId,
        [selectedFile],
        fileDesc,
        previewEnabled
      );

      setUploadOpen(false);
      setSelectedFile(null);
      setFileDesc('');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    }
  }

  const [downloadingAll, setDownloadingAll] = useState(false);

  const allFilesList = fileVersions.flatMap((v) =>
    v.files.map((f: any) => ({
      name: f.name,
      path: f.path || f.url || f.name,
    }))
  );

  async function handleDownloadAllFiles() {
    if (allFilesList.length === 0) return;
    setDownloadingAll(true);
    try {
      for (const file of allFilesList) {
        const res = await fetch('/api/files/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: deal.id,
            filePath: file.path,
            isCreator: true,
          }),
        });
        if (res.ok) {
          const { signedUrl } = await res.json();
          if (signedUrl) {
            const a = document.createElement('a');
            a.href = signedUrl;
            a.download = file.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (e) {
      console.error('Download error:', e);
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Download All Bar when files exist */}
        {allFilesList.length > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Project Deliverables ({allFilesList.length} files)</p>
              <p className="text-[11px] text-muted-foreground">Download all uploaded version assets in one click</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={handleDownloadAllFiles}
              disabled={downloadingAll}
            >
              <Download className="h-3.5 w-3.5" />
              {downloadingAll ? 'Downloading...' : 'Download All Files'}
            </Button>
          </div>
        )}

        {runningTasks.length > 0 && (
          <Card className="border border-primary/20 bg-primary/5 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {runningTasks.some(t => t.status === 'uploading' || t.status === 'waiting') 
                  ? `Uploading Files (${runningTasks.filter(t => t.status !== 'failed').length} in queue)`
                  : `Processing Previews (${runningTasks.filter(t => t.status !== 'failed').length} in queue)`
                }
              </h4>
            </div>
            <div className="space-y-3">
              {runningTasks.map((task) => (
                <div key={task.id} className="text-xs space-y-1 bg-background/50 border border-border/50 rounded-lg p-2.5 relative">
                  <div className="flex items-center justify-between font-medium">
                    <span className="truncate max-w-[250px] pr-6">{task.fileName}</span>
                    {task.status === 'failed' ? (
                      <span className="text-destructive font-semibold">Failed</span>
                    ) : task.status === 'completed' && task.previewStatus ? (
                      <span className="text-muted-foreground">
                        {task.previewStatus === 'processing' ? 'Generating preview...' : 
                         task.previewStatus === 'ready' ? 'Preview ready ✓' : 
                         task.previewStatus === 'failed' || task.previewStatus === 'unavailable' ? 'Preview unavailable ⚠' : 'Upload complete ✓'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{task.percentage}%</span>
                    )}
                  </div>
                  
                  {task.status === 'failed' ? (
                    <p className="text-[10px] text-destructive mt-0.5">{task.error || 'Upload error'}</p>
                  ) : task.status === 'completed' && task.previewStatus === 'processing' ? (
                    <div className="mt-1 flex items-center text-[10px] text-primary/80 animate-pulse">
                      Processing video preview...
                    </div>
                  ) : task.status !== 'completed' ? (
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-primary h-full transition-all duration-200"
                        style={{ width: `${task.percentage}%` }}
                      />
                    </div>
                  ) : null}

                  {task.status === 'failed' && (
                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-destructive/20">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => uploadQueue.retryTask(task.id)}
                        className="h-6 px-2 text-[10px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Retry Upload</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => uploadQueue.removeTask(task.id)}
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        <span>Dismiss</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Upload area */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Upload deliverables</p>
            <p className="text-xs text-muted-foreground mt-1">
              Files are saved to private storage and unlocked automatically upon payment.
            </p>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  Select files to upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Deliverable Version</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadFile} className="space-y-4 pt-2">
                  {localDeliverables.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Select Deliverable</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        value={selectedDeliverable}
                        onChange={(e) => setSelectedDeliverable(e.target.value)}
                      >
                        {localDeliverables.map((del) => (
                          <option key={del.id} value={del.id}>
                            {del.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Version Description (optional)</Label>
                    <Input
                      placeholder="e.g. Master design export v2 with revisions"
                      value={fileDesc}
                      onChange={(e) => setFileDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Choose File *</Label>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  {uploadError && (
                    <div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                      {uploadError}
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!selectedFile || uploading}>
                      {uploading ? 'Uploading...' : 'Upload Version'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Deliverables with versions */}
        {localDeliverables.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState icon={FileCheck} title="No deliverables" description="No deliverables have been added to this deal yet." />
            </CardContent>
          </Card>
        ) : (
          localDeliverables.map((del) => {
            const versions = fileVersions.filter((v) => v.deliverableId === del.id);
            return (
              <Card key={del.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{del.name}</CardTitle>
                  </div>
                  <DeliverableStatusBadge status={isPaid || deal.status === 'completed' ? 'approved' : del.status} />
                </CardHeader>
                <CardContent>
                  {versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No versions uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((v) => (
                        <div key={v.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                              {v.version === Math.max(...versions.map((vv) => vv.version)) && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
                          {v.status === 'changes_requested' && v.clientFeedback && (
                            <div className="mb-3 rounded-md bg-amber-500/10 p-2.5 border border-amber-500/20">
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Revision Feedback</p>
                              <p className="text-sm text-amber-800 dark:text-amber-200">{v.clientFeedback}</p>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            {v.files.map((f: any) => {
                              const isReplaced = f.deletionStatus === 'retention' || f.deletionStatus === 'deleted';
                              if (isReplaced) return null; // do not show deleted/replaced files in creator active list
                              return (
                                <div key={f.id} className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <FileCard file={f} locked={v.locked && !isPaid} />
                                  </div>
                                  {deal.previewEnabled && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {f.previewStatus === 'ready' && f.previewPath && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="gap-1 text-xs text-primary border-primary/25 hover:bg-primary/5 hover:text-primary h-8 px-2.5"
                                          onClick={() => handleViewPreview(v.id, f.id, f.name, f.previewType || 'image/jpeg')}
                                          disabled={previewLoadingFileId === f.id}
                                        >
                                          <Eye className="h-3 w-3" />
                                          {previewLoadingFileId === f.id ? '...' : 'Preview'}
                                        </Button>
                                      )}
                                      {f.previewStatus === 'processing' && (
                                        <span className="text-[10px] text-muted-foreground bg-muted/65 px-1.5 py-1.5 rounded animate-pulse">
                                          Processing...
                                        </span>
                                      )}
                                      {f.previewStatus === 'failed' && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-1.5 rounded">
                                            Failed
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleRetryPreview(v.id, f.id)}
                                          >
                                            <RefreshCw className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {!isPaid && v.locked && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              <span>Files locked until payment is confirmed</span>
                            </div>
                          )}
                          {isPaid && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3 w-3" />
                              <span>Files unlocked — payment confirmed</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Sidebar: Change requests */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Change Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {changeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No change requests.</p>
            ) : (
              changeRequests.map((cr) => (
                <div key={cr.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{cr.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cr.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {cr.requestedByName}</span>
                    <span className="capitalize text-amber-600 dark:text-amber-400 font-medium">{cr.status}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



// ---------------------------------------------------------------------------
// Activity Tab
// ---------------------------------------------------------------------------

function ActivityTab({ events }: { events: DealEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deal Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState icon={Activity} title="No activity recorded" description="Events will appear here as deal updates occur." />
        ) : (
          <Timeline events={events} />
        )}
      </CardContent>
    </Card>
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

          ctx.save();

          // Calculate font size dynamically based on dimensions (responsive)
          const fontSize = Math.max(
            32,
            Math.round(Math.min(width, height) * 0.045)
          );

          ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)'; // Hollow dark gray outline at 35% opacity
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
