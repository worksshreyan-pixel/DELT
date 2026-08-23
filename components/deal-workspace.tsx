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
  Share2,
  ExternalLink,
  Edit,
  Trash,
  Plus,
  RefreshCw,
  Settings,
  Eye,
} from 'lucide-react';
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
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { getDealPublicUrl } from '@/lib/deal-url';
import { useRouter } from 'next/navigation';
import { cn, serializeDescription, parseDescription } from '@/lib/utils';
import { uploadQueue, type UploadTask } from '@/lib/upload-queue';
import { addMessageToStore, addProposalToStore, respondToProposalInStore, permanentlyDeleteDealInStore, closeDealInStore } from '@/lib/app-store';
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
}: DealWorkspaceProps) {
  const router = useRouter();
  const [currentDeal, setCurrentDeal] = useState<Deal>(deal);
  const isPaidOrCompleted = currentDeal.paymentStatus === 'paid' || currentDeal.status === 'completed';

  const [localFileVersions, setLocalFileVersions] = useState<FileVersion[]>(fileVersions);
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

  const [activeTab, setActiveTab] = useState('overview');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const canonicalUrl = getDealPublicUrl(currentDeal.token || (currentDeal as any).id);
  const isClosed = currentDeal.status === 'closed';

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: currentDeal.title,
          text: `Review and collaborate on "${currentDeal.title}" on DELT`,
          url: canonicalUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(canonicalUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  async function handleCloseDeal() {
    setClosing(true);
    setCloseError('');

    try {
      const res = await fetch(`/api/deals/${currentDeal.id}/close`, {
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
      <div className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">{currentDeal.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{clientName}</span>
              {clientCompany && <><span>·</span><span>{clientCompany}</span></>}
              <span>·</span>
              <span>{formatCurrency(currentDeal.price, currentDeal.currency)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DealStatusBadge status={currentDeal.status} />
            <Link href={`/deals/${currentDeal.id}/settings`}>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Shareable Client Link Banner */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Client Portal Link</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  OTP Protected
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate font-mono select-all">
                {canonicalUrl}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => {
                  navigator.clipboard.writeText(canonicalUrl);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                {linkCopied ? 'Link Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={handleShare}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium"
                onClick={() => window.open(canonicalUrl, '_blank')}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview Client View
              </Button>
            </div>
          </div>
        </div>

        {isClosed && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300">
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
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab deal={currentDeal} deliverables={deliverables} milestones={milestones} events={events} clientName={clientName} creatorName={creatorName} />
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <ChatTab deal={currentDeal} messages={messages} proposals={proposals} creatorName={creatorName} isClosed={isClosed} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FilesTab deal={currentDeal} deliverables={deliverables} fileVersions={localFileVersions} changeRequests={changeRequests} isClosed={isClosed} handleViewPreview={handleViewPreview} handleRetryPreview={handleRetryPreview} previewLoadingFileId={previewLoadingFileId} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab deal={currentDeal} payments={payments} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab events={events} />
        </TabsContent>
      </Tabs>

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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({
  deal,
  deliverables,
  milestones,
  events,
  clientName,
  creatorName,
}: {
  deal: Deal;
  deliverables: Deliverable[];
  milestones: Milestone[];
  events: DealEvent[];
  clientName: string;
  creatorName: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                <p className="text-sm font-semibold">{formatCurrency(deal.price, deal.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                <PaymentStatusBadge status={deal.paymentStatus} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                <p className="text-sm font-semibold">
                  {deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <p className="text-sm font-semibold capitalize">{deal.status.replace('_', ' ')}</p>
              </div>
            </div>

            {deal.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{deal.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Scope</p>
              <ul className="space-y-1.5">
                {deal.scope.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {deliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {deliverables.map((del) => (
                <div key={del.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{del.name}</p>
                    {del.description && <p className="text-xs text-muted-foreground mt-0.5">{del.description}</p>}
                  </div>
                  <DeliverableStatusBadge status={deal.paymentStatus === 'paid' || deal.status === 'completed' ? 'approved' : del.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{getInitials(clientName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{clientName}</p>
                <p className="text-xs text-muted-foreground">{(deal as any).client_email || (deal as any).clientEmail || ''}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
              <p className="font-medium text-foreground">Private Workspace Access</p>
              <p className="text-muted-foreground leading-relaxed">
                Client accesses this deal via private token link with email OTP verification.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
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
        { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${deal.id}` },
        (payload) => {
          const raw = payload.new as any;
          const formattedMsg: DealMessage = {
            id: raw.id,
            dealId: raw.deal_id || raw.dealId || deal.id,
            senderId: raw.sender_id || raw.senderId || 'creator',
            senderName: raw.sender_name || raw.senderName || creatorName,
            senderRole: raw.sender_role || raw.senderRole || 'creator',
            type: raw.type,
            content: raw.content,
            proposalId: raw.proposal_id || raw.proposalId,
            createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          };
          setLocalMessages((prev) => {
            // Replace any optimistic message with same content if within 5 seconds, or deduplicate
            const exists = prev.some((m) => m.id === formattedMsg.id);
            if (exists) return prev;
            const filtered = prev.filter((m) => !(m.id.startsWith('msg_') && m.content === formattedMsg.content));
            return [...filtered, formattedMsg];
          });
        }
      )
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

  async function handleDeclineProposal() {
    if (activeProposal) {
      try {
        await fetch('/api/negotiation/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: activeProposal.id,
            dealId: deal.id,
            response: 'decline',
            responderName: creatorName,
            responderRole: 'creator',
          }),
        });
      } catch (e) {
        console.error(e);
      }
      respondToProposalInStore(deal.id, activeProposal.id, 'decline', creatorName);
    }
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
                      onDecline={handleDeclineProposal}
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
                  onDecline={handleDeclineProposal}
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

  const runningTasks = activeTasks.filter(
    (t) => t.status === 'uploading' || t.status === 'waiting' || t.status === 'failed' || (t.status === 'completed' && (t.previewStatus === 'processing' || t.previewStatus === 'waiting'))
  );

  useEffect(() => {
    setLocalDeliverables(deliverables.filter(d => !d.name.startsWith('[DELETED]')));
  }, [deliverables]);





  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      const { previewEnabled } = parseDescription(deal.description);
      const deliverableId = selectedDeliverable || deliverables[0]?.id || 'del-1';

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
                Uploading Files ({runningTasks.filter(t => t.status !== 'failed').length} in queue)
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
                    <button
                      type="button"
                      onClick={() => uploadQueue.removeTask(task.id)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
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
// Payments Tab
// ---------------------------------------------------------------------------

function PaymentsTab({
  deal,
  payments,
}: {
  deal: Deal;
  payments: Payment[];
}) {
  const isPaid = deal.paymentStatus === 'paid';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Total Deal Amount</p>
                <p className="text-2xl font-display font-semibold mt-0.5">{formatCurrency(deal.price, deal.currency)}</p>
              </div>
              <PaymentStatusBadge status={deal.paymentStatus} />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Payment Status</span>
                <span className="font-medium capitalize">{deal.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{deal.currency}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Deliverables Access</span>
                <span className="font-medium">
                  {isPaid ? 'Unlocked (All files downloadable)' : 'Locked until payment confirmed'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Razorpay Gateway</p>
                <p className="text-xs text-muted-foreground">Cards, UPI, Netbanking & Wallets</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
              When your client completes payment in the portal, files unlock immediately and the transaction is recorded.
            </p>
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
