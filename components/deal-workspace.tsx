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
import { addMessageToStore, addProposalToStore, respondToProposalInStore, permanentlyDeleteDealInStore } from '@/lib/app-store';
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
        setCloseError(errJson.error || 'Failed to close and delete deal.');
        setClosing(false);
        return;
      }

      permanentlyDeleteDealInStore(currentDeal.id);
      setCloseDialogOpen(false);
      router.push('/deals');
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

            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                  Close Deal
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
                    <li>All deliverables, file versions, and uploaded storage files</li>
                  </ul>
                  {closeError && (
                    <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                      {closeError}
                    </p>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={closing}>
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
                <ExternalLink className="h-3.5 w-3.5" />
                Open Client View
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
          <FilesTab deal={currentDeal} deliverables={deliverables} fileVersions={fileVersions} changeRequests={changeRequests} isClosed={isClosed} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab deal={currentDeal} payments={payments} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityTab events={events} />
        </TabsContent>
      </Tabs>
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
              if (prev.some((p) => p.id === formattedProp.id)) return prev;
              return [...prev, formattedProp];
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
                onSubmit={async (price, reason) => {
                  try {
                    await fetch('/api/negotiation/propose', {
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
                  } catch (e) {
                    console.error(e);
                  }
                  const newProp = addProposalToStore(deal.id, price, reason, 'creator', creatorName);
                  setLocalProposals((prev) => [...prev, newProp]);
                  setProposalOpen(false);
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
                  onSubmit={async (price, reason) => {
                    try {
                      await fetch('/api/negotiation/propose', {
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
                    } catch (e) {
                      console.error(e);
                    }
                    const counterProp = addProposalToStore(deal.id, price, reason, 'creator', creatorName);
                    setLocalProposals((prev) => [...prev, counterProp]);
                    setCounterOpen(false);
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
}: {
  currentPrice: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onSubmit: (price: number, reason: string) => void;
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
        <Button onClick={() => onSubmit(Number(price), reason)} disabled={!price}>
          Send Proposal
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
}: {
  proposal: PriceProposal;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  onAccept: () => void;
  onDecline: () => void;
  onSubmit: (price: number, reason: string) => void;
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
        <Button variant="ghost" onClick={onDecline} className="mr-auto text-muted-foreground">
          <X className="h-4 w-4 mr-1.5" />
          Decline
        </Button>
        <Button variant="outline" onClick={onAccept} className="gap-1.5">
          <Check className="h-4 w-4" />
          Accept
        </Button>
        <Button onClick={() => onSubmit(Number(price), reason)} disabled={!price}>
          Send Counter
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
}: {
  deal: Deal;
  deliverables: Deliverable[];
  fileVersions: FileVersion[];
  changeRequests: ChangeRequest[];
  isClosed?: boolean;
}) {
  const isPaid = deal.paymentStatus === 'paid';
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(deliverables[0]?.id || '');
  const [fileDesc, setFileDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleUploadFile(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('dealId', deal.id);
      formData.append('deliverableId', selectedDeliverable || deliverables[0]?.id || 'del-1');
      formData.append('description', fileDesc);
      formData.append('file', selectedFile);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      setUploadOpen(false);
      setSelectedFile(null);
      setFileDesc('');
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
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
                  {deliverables.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Select Deliverable</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                        value={selectedDeliverable}
                        onChange={(e) => setSelectedDeliverable(e.target.value)}
                      >
                        {deliverables.map((del) => (
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
        {deliverables.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState icon={FileCheck} title="No deliverables" description="No deliverables have been added to this deal yet." />
            </CardContent>
          </Card>
        ) : (
          deliverables.map((del) => {
            const versions = fileVersions.filter((v) => v.deliverableId === del.id);
            return (
              <Card key={del.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{del.name}</CardTitle>
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
                            {v.files.map((f) => (
                              <FileCard key={f.id} file={f} locked={v.locked && !isPaid} />
                            ))}
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
