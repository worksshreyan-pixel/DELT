'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeftRight,
  Paperclip,
  Lock,
  Upload,
  Download,
  Check,
  X,
  FileCheck,
  Clock,
  IndianRupee,
  AlertCircle,
  Flag,
  Eye,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DealStatusBadge, PaymentStatusBadge, DeliverableStatusBadge, MilestoneStatusBadge } from '@/components/deal-status-badge';
import { PriceProposalCard } from '@/components/price-proposal-card';
import { ChatMessageItem } from '@/components/chat-message';
import { FileCard } from '@/components/file-card';
import { Timeline } from '@/components/timeline-event';
import { EmptyState } from '@/components/empty-state';
import { formatCurrency } from '@/lib/plans';
import type { Deal, DealMessage, PriceProposal, DealEvent, FileVersion, Deliverable, Milestone, Payment, ChangeRequest } from '@/lib/types';

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

interface DealWorkspaceProps {
  deal: Deal;
  clientName: string;
  clientCompany?: string;
  creatorName: string;
  messages: DealMessage[];
  proposals: PriceProposal[];
  events: DealEvent[];
  deliverables: Deliverable[];
  fileVersions: FileVersion[];
  milestones: Milestone[];
  payments: Payment[];
  changeRequests: ChangeRequest[];
}

export function DealWorkspace({
  deal,
  clientName,
  clientCompany,
  creatorName,
  messages,
  proposals,
  events,
  deliverables,
  fileVersions,
  milestones,
  payments,
  changeRequests,
}: DealWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">{deal.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{clientName}</span>
              {clientCompany && <><span>·</span><span>{clientCompany}</span></>}
              <span>·</span>
              <span>{formatCurrency(deal.price, deal.currency)}</span>
            </div>
          </div>
          <DealStatusBadge status={deal.status} />
        </div>
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
          <OverviewTab deal={deal} deliverables={deliverables} milestones={milestones} events={events} clientName={clientName} creatorName={creatorName} />
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <ChatTab deal={deal} messages={messages} proposals={proposals} creatorName={creatorName} />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <FilesTab deal={deal} deliverables={deliverables} fileVersions={fileVersions} changeRequests={changeRequests} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab deal={deal} payments={payments} />
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
      <div className="lg:col-span-2 space-y-4">
        {/* Key info */}
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <InfoItem label="Price" value={formatCurrency(deal.price, deal.currency)} />
            <InfoItem label="Progress" value={`${deal.progress}%`} />
            <InfoItem label="Deadline" value={deal.deadline ? new Date(deal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'} />
            <InfoItem label="Payment" value={<PaymentStatusBadge status={deal.paymentStatus} />} />
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{deal.description}</p>
          </CardContent>
        </Card>

        {/* Scope */}
        <Card>
          <CardHeader><CardTitle className="text-base">Scope</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {deal.scope.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader><CardTitle className="text-base">Deliverables</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliverables added yet.</p>
            ) : (
              deliverables.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{d.name}</p>
                    {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                  </div>
                  <DeliverableStatusBadge status={d.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        {milestones.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{m.title}</p>
                    {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm font-semibold">{formatCurrency(m.amount, deal.currency)}</span>
                    <MilestoneStatusBadge status={m.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Participants</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ParticipantRow name={creatorName} role="Creator" />
            <ParticipantRow name={clientName} role="Client" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Access & Security</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Private deal workspace</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Client verified via OTP</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Files locked until payment</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Next Action</CardTitle></CardHeader>
          <CardContent>
            {deal.status === 'negotiating' ? (
              <p className="text-sm text-muted-foreground">Respond to the pending price proposal from the client.</p>
            ) : deal.status === 'in_progress' ? (
              <p className="text-sm text-muted-foreground">Upload the next version and notify the client for review.</p>
            ) : deal.status === 'payment_pending' ? (
              <p className="text-sm text-muted-foreground">Send a payment reminder to the client.</p>
            ) : deal.status === 'completed' ? (
              <p className="text-sm text-muted-foreground">This deal is complete. No further action needed.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Share the deal link with your client to begin.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function ParticipantRow({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-muted text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Tab
// ---------------------------------------------------------------------------

function ChatTab({
  deal,
  messages,
  proposals,
  creatorName,
}: {
  deal: Deal;
  messages: DealMessage[];
  proposals: PriceProposal[];
  creatorName: string;
}) {
  const [localMessages, setLocalMessages] = useState<DealMessage[]>(messages);
  const [input, setInput] = useState('');
  const [proposalOpen, setProposalOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<PriceProposal | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [localMessages]);

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg: DealMessage = {
      id: `m-${Date.now()}`,
      dealId: deal.id,
      senderId: 'u-alex-001',
      senderName: creatorName,
      senderRole: 'creator',
      type: 'text',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setLocalMessages([...localMessages, newMsg]);
    setInput('');
  }

  function handleAcceptProposal(proposal: PriceProposal) {
    setLocalMessages([
      ...localMessages,
      {
        id: `m-${Date.now()}`,
        dealId: deal.id,
        senderId: 'u-alex-001',
        senderName: creatorName,
        senderRole: 'creator',
        type: 'system',
        content: `Price accepted at ${formatCurrency(proposal.proposedPrice, deal.currency)}`,
        createdAt: new Date().toISOString(),
      },
    ]);
    setProposalOpen(false);
    setCounterOpen(false);
  }

  function handleDeclineProposal() {
    setLocalMessages([
      ...localMessages,
      {
        id: `m-${Date.now()}`,
        dealId: deal.id,
        senderId: 'u-alex-001',
        senderName: creatorName,
        senderRole: 'creator',
        type: 'system',
        content: 'Price proposal declined',
        createdAt: new Date().toISOString(),
      },
    ]);
    setProposalOpen(false);
    setCounterOpen(false);
  }

  const pendingProposal = proposals.find((p) => p.state === 'pending' && p.direction === 'client_to_creator');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {localMessages.map((msg, i) => {
          const prevMsg = localMessages[i - 1];
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';

          if (msg.type === 'proposal' && msg.proposalId) {
            const proposal = proposals.find((p) => p.id === msg.proposalId);
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
          <Button variant="outline" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
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
                onSubmit={(price, reason) => {
                  const newProposal: PriceProposal = {
                    id: `p-${Date.now()}`,
                    dealId: deal.id,
                    direction: 'creator_to_client',
                    previousPrice: deal.price,
                    proposedPrice: price,
                    reason,
                    state: 'pending',
                    proposedBy: 'u-alex-001',
                    proposedByName: creatorName,
                    proposedByRole: 'creator',
                    createdAt: new Date().toISOString(),
                  };
                  setLocalMessages([
                    ...localMessages,
                    {
                      id: `m-${Date.now()}`,
                      dealId: deal.id,
                      senderId: 'u-alex-001',
                      senderName: creatorName,
                      senderRole: 'creator',
                      type: 'proposal',
                      content: 'Price proposal submitted',
                      proposalId: newProposal.id,
                      createdAt: new Date().toISOString(),
                    },
                  ]);
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
        {pendingProposal && (
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
                  onSubmit={(price, reason) => {
                    const counter: PriceProposal = {
                      id: `p-${Date.now()}`,
                      dealId: deal.id,
                      direction: 'creator_to_client',
                      previousPrice: pendingProposal.proposedPrice,
                      proposedPrice: price,
                      reason,
                      state: 'pending',
                      counterProposalId: pendingProposal.id,
                      proposedBy: 'u-alex-001',
                      proposedByName: creatorName,
                      proposedByRole: 'creator',
                      createdAt: new Date().toISOString(),
                    };
                    setLocalMessages([
                      ...localMessages,
                      {
                        id: `m-${Date.now()}`,
                        dealId: deal.id,
                        senderId: 'u-alex-001',
                        senderName: creatorName,
                        senderRole: 'creator',
                        type: 'proposal',
                        content: 'Counter offer submitted',
                        proposalId: counter.id,
                        createdAt: new Date().toISOString(),
                      },
                    ]);
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
        <DialogTitle>Propose New Price</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Current price</p>
          <p className="text-lg font-semibold">{formatCurrency(currentPrice, currency)}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposedPrice">Proposed price</Label>
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
// Files Tab
// ---------------------------------------------------------------------------

function FilesTab({
  deal,
  deliverables,
  fileVersions,
  changeRequests,
}: {
  deal: Deal;
  deliverables: Deliverable[];
  fileVersions: FileVersion[];
  changeRequests: ChangeRequest[];
}) {
  const isPaid = deal.paymentStatus === 'paid';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Upload area */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Upload files</p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag and drop or click to browse. Files are stored privately.
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Select files
            </Button>
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
                  <DeliverableStatusBadge status={del.status} />
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
                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" variant="outline">Accept</Button>
                    <Button size="sm" variant="ghost">Decline</Button>
                    <Button size="sm" variant="ghost" className="gap-1">
                      <ArrowLeftRight className="h-3 w-3" />
                      Propose Price
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">File Access</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Private storage with signed URLs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Participant-based access control</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payments Tab
// ---------------------------------------------------------------------------

function PaymentsTab({ deal, payments }: { deal: Deal; payments: Payment[] }) {
  const platformFee = Math.round(deal.price * 0.025);
  const processingFee = Math.round(deal.price * 0.02);
  const creatorNet = deal.price - platformFee - processingFee;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Project amount</span>
              <span className="text-sm font-semibold">{formatCurrency(deal.price, deal.currency)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Platform fee (2.5%)</span>
              <span className="text-sm text-muted-foreground">−{formatCurrency(platformFee, deal.currency)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Processing fee (2.0%)</span>
              <span className="text-sm text-muted-foreground">−{formatCurrency(processingFee, deal.currency)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Creator receives</span>
              <span className="text-lg font-display font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(creatorNet, deal.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {payments.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(p.amount, p.currency)}</p>
                    <p className="text-xs text-muted-foreground">{p.method} · {new Date(p.completedAt || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <PaymentStatusBadge status={p.state} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <PaymentStatusBadge status={deal.paymentStatus} />
            {deal.paymentStatus === 'none' && (
              <p className="text-sm text-muted-foreground">Payment will be initiated once the deal is agreed and work begins.</p>
            )}
            {deal.paymentStatus === 'pending' && (
              <p className="text-sm text-muted-foreground">Payment is pending from the client. Files remain locked until payment is confirmed.</p>
            )}
            {deal.paymentStatus === 'paid' && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Payment confirmed. Files have been unlocked for the client.</p>
            )}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Payment processing requires integration with a payment provider. DELT does not confirm payments based on frontend state alone.
                </p>
              </div>
            </div>
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
  const sortedEvents = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState icon={Clock} title="No activity yet" description="Activity will appear here as the deal progresses." />
        ) : (
          <Timeline events={sortedEvents} />
        )}
      </CardContent>
    </Card>
  );
}
