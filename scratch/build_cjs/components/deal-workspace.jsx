"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealWorkspace = void 0;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const dialog_1 = require("@/components/ui/dialog");
const avatar_1 = require("@/components/ui/avatar");
const tabs_1 = require("@/components/ui/tabs");
const deal_status_badge_1 = require("@/components/deal-status-badge");
const price_proposal_card_1 = require("@/components/price-proposal-card");
const chat_message_1 = require("@/components/chat-message");
const file_card_1 = require("@/components/file-card");
const timeline_event_1 = require("@/components/timeline-event");
const empty_state_1 = require("@/components/empty-state");
const plans_1 = require("@/lib/plans");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
const deal_url_1 = require("@/lib/deal-url");
const navigation_1 = require("next/navigation");
const utils_1 = require("@/lib/utils");
const app_store_1 = require("@/lib/app-store");
function getInitials(name) {
    if (!name)
        return 'YA';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}
function DealWorkspace({ deal, clientName, clientEmail, clientCompany, creatorName, messages, proposals, deliverables, fileVersions, events, milestones, payments, changeRequests, }) {
    const router = (0, navigation_1.useRouter)();
    const [currentDeal, setCurrentDeal] = (0, react_1.useState)(deal);
    (0, react_1.useEffect)(() => {
        setCurrentDeal(deal);
    }, [deal]);
    const [activeTab, setActiveTab] = (0, react_1.useState)('overview');
    const [closeDialogOpen, setCloseDialogOpen] = (0, react_1.useState)(false);
    const [closing, setClosing] = (0, react_1.useState)(false);
    const [closeError, setCloseError] = (0, react_1.useState)('');
    const [linkCopied, setLinkCopied] = (0, react_1.useState)(false);
    const canonicalUrl = (0, deal_url_1.getDealPublicUrl)(currentDeal.token || currentDeal.id);
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
            }
            catch (err) {
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
            (0, app_store_1.closeDealInStore)(currentDeal.id);
            setCurrentDeal((prev) => ({
                ...prev,
                status: 'closed',
                updatedAt: new Date().toISOString(),
            }));
            setCloseDialogOpen(false);
            setClosing(false);
        }
        catch (err) {
            console.error('Error closing deal:', err);
            setCloseError(err.message || 'Failed to close deal.');
            setClosing(false);
        }
    }
    return (<div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">{currentDeal.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{clientName}</span>
              {clientCompany && <><span>·</span><span>{clientCompany}</span></>}
              <span>·</span>
              <span>{(0, plans_1.formatCurrency)(currentDeal.price, currentDeal.currency)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <deal_status_badge_1.DealStatusBadge status={currentDeal.status}/>

            <dialog_1.Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <dialog_1.DialogTrigger asChild>
                <button_1.Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                  Close Deal
                </button_1.Button>
              </dialog_1.DialogTrigger>
              <dialog_1.DialogContent>
                <dialog_1.DialogHeader>
                  <dialog_1.DialogTitle>Close and permanently delete this Deal?</dialog_1.DialogTitle>
                </dialog_1.DialogHeader>
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
                  {closeError && (<p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                      {closeError}
                    </p>)}
                </div>
                <dialog_1.DialogFooter className="gap-2 sm:gap-0">
                  <button_1.Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={closing}>
                    Cancel
                  </button_1.Button>
                  <button_1.Button variant="destructive" onClick={handleCloseDeal} disabled={closing}>
                    {closing ? 'Deleting Deal...' : 'Close & Delete'}
                  </button_1.Button>
                </dialog_1.DialogFooter>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>
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
              <button_1.Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={() => {
            navigator.clipboard.writeText(canonicalUrl);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }}>
                <lucide_react_1.Copy className="h-3.5 w-3.5"/>
                {linkCopied ? 'Link Copied!' : 'Copy Link'}
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={handleShare}>
                <lucide_react_1.Share2 className="h-3.5 w-3.5"/>
                Share
              </button_1.Button>
              <button_1.Button variant="secondary" size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={() => window.open(canonicalUrl, '_blank')}>
                <lucide_react_1.ExternalLink className="h-3.5 w-3.5"/>
                Open Client View
              </button_1.Button>
            </div>
          </div>
        </div>

        {isClosed && (<div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-3 text-xs text-zinc-700 dark:text-zinc-300">
            <lucide_react_1.Check className="h-4 w-4 text-zinc-500 shrink-0"/>
            <span>This Deal is closed.</span>
          </div>)}
      </div>

      {/* Tabs */}
      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
          <tabs_1.TabsList className="w-auto">
            <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="chat">Chat</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="files">Files</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="payments">Payments</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="activity">Activity</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="settings">Settings</tabs_1.TabsTrigger>
          </tabs_1.TabsList>
        </div>

        <tabs_1.TabsContent value="overview" className="mt-4">
          <OverviewTab deal={currentDeal} deliverables={deliverables} milestones={milestones} events={events} clientName={clientName} creatorName={creatorName}/>
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="chat" className="mt-4">
          <ChatTab deal={currentDeal} messages={messages} proposals={proposals} creatorName={creatorName} isClosed={isClosed}/>
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="files" className="mt-4">
          <FilesTab deal={currentDeal} deliverables={deliverables} fileVersions={fileVersions} changeRequests={changeRequests} isClosed={isClosed}/>
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="payments" className="mt-4">
          <PaymentsTab deal={currentDeal} payments={payments}/>
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="activity" className="mt-4">
          <ActivityTab events={events}/>
        </tabs_1.TabsContent>
        <tabs_1.TabsContent value="settings" className="mt-4">
          <SettingsTab deal={currentDeal} onUpdateDeal={setCurrentDeal} fileVersions={fileVersions}/>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
exports.DealWorkspace = DealWorkspace;
// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
function OverviewTab({ deal, deliverables, milestones, events, clientName, creatorName, }) {
    return (<div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Project Details</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                <p className="text-sm font-semibold">{(0, plans_1.formatCurrency)(deal.price, deal.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
                <deal_status_badge_1.PaymentStatusBadge status={deal.paymentStatus}/>
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

            {deal.description && (<div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{deal.description}</p>
              </div>)}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Scope</p>
              <ul className="space-y-1.5">
                {deal.scope.map((s, i) => (<li key={i} className="flex items-start gap-2 text-sm">
                    <lucide_react_1.Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                    <span>{s}</span>
                  </li>))}
              </ul>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {deliverables.length > 0 && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base">Deliverables</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-2">
              {deliverables.map((del) => (<div key={del.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{del.name}</p>
                    {del.description && <p className="text-xs text-muted-foreground mt-0.5">{del.description}</p>}
                  </div>
                  <deal_status_badge_1.DeliverableStatusBadge status={deal.paymentStatus === 'paid' || deal.status === 'completed' ? 'approved' : del.status}/>
                </div>))}
            </card_1.CardContent>
          </card_1.Card>)}
      </div>

      <div className="space-y-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Client Information</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="flex items-center gap-3 mb-4">
              <avatar_1.Avatar className="h-10 w-10">
                <avatar_1.AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{getInitials(clientName)}</avatar_1.AvatarFallback>
              </avatar_1.Avatar>
              <div>
                <p className="text-sm font-medium">{clientName}</p>
                <p className="text-xs text-muted-foreground">{deal.client_email || deal.clientEmail || ''}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
              <p className="font-medium text-foreground">Private Workspace Access</p>
              <p className="text-muted-foreground leading-relaxed">
                Client accesses this deal via private token link with email OTP verification.
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Recent Activity</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            {events.length === 0 ? (<p className="text-sm text-muted-foreground">No events recorded yet.</p>) : (<timeline_event_1.Timeline events={events.slice(0, 4)}/>)}
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Chat Tab (With Supabase Realtime Scoped Subscription)
// ---------------------------------------------------------------------------
function ChatTab({ deal, messages, proposals, creatorName, isClosed, }) {
    const [localMessages, setLocalMessages] = (0, react_1.useState)(messages);
    const [localProposals, setLocalProposals] = (0, react_1.useState)(proposals);
    const [input, setInput] = (0, react_1.useState)('');
    const [proposalOpen, setProposalOpen] = (0, react_1.useState)(false);
    const [counterOpen, setCounterOpen] = (0, react_1.useState)(false);
    const [activeProposal, setActiveProposal] = (0, react_1.useState)(null);
    const [submittingProposal, setSubmittingProposal] = (0, react_1.useState)(false);
    const scrollRef = (0, react_1.useRef)(null);
    // Supabase Realtime Subscription Scoped to Deal
    (0, react_1.useEffect)(() => {
        if (!(0, env_1.hasSupabasePublicConfig)())
            return;
        const supabase = (0, client_1.createClient)();
        const channel = supabase
            .channel(`deal:${deal.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${deal.id}` }, (payload) => {
            const raw = payload.new;
            const formattedMsg = {
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
                if (exists)
                    return prev;
                const filtered = prev.filter((m) => !(m.id.startsWith('msg_') && m.content === formattedMsg.content));
                return [...filtered, formattedMsg];
            });
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'price_proposals', filter: `deal_id=eq.${deal.id}` }, (payload) => {
            const raw = payload.new;
            const formattedProp = {
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
                    if (filtered.some((p) => p.id === formattedProp.id))
                        return filtered;
                    return [...filtered, formattedProp];
                });
            }
            else if (payload.eventType === 'UPDATE') {
                setLocalProposals((prev) => prev.map((p) => (p.id === formattedProp.id ? formattedProp : p)));
            }
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [deal.id]);
    (0, react_1.useEffect)(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [localMessages]);
    (0, react_1.useEffect)(() => {
        setLocalMessages(messages);
    }, [messages]);
    (0, react_1.useEffect)(() => {
        setLocalProposals(proposals);
    }, [proposals]);
    async function sendMessage() {
        if (!input.trim())
            return;
        const text = input.trim();
        setInput('');
        // Optimistic local add
        const optId = `msg_${Date.now()}`;
        const optMsg = {
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
                    const serverMsg = {
                        id: data.message.id,
                        dealId: data.message.deal_id,
                        senderId: data.message.sender_id,
                        senderName: data.message.sender_name,
                        senderRole: data.message.sender_role,
                        type: data.message.type,
                        content: data.message.content,
                        createdAt: data.message.created_at,
                    };
                    setLocalMessages((prev) => prev.map((m) => (m.id === optId ? serverMsg : m)));
                }
            }
        }
        catch (e) {
            console.error('Error sending message:', e);
        }
    }
    async function handleAcceptProposal(proposal) {
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
        }
        catch (e) {
            console.error(e);
        }
        (0, app_store_1.respondToProposalInStore)(deal.id, proposal.id, 'accept', creatorName);
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
            }
            catch (e) {
                console.error(e);
            }
            (0, app_store_1.respondToProposalInStore)(deal.id, activeProposal.id, 'decline', creatorName);
        }
        setProposalOpen(false);
        setCounterOpen(false);
    }
    const pendingProposal = localProposals.find((p) => p.state === 'pending' && p.direction === 'client_to_creator');
    return (<div className="flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
        {localMessages.map((msg, i) => {
            const prevMsg = localMessages[i - 1];
            const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || msg.type === 'system';
            if (msg.type === 'proposal' && msg.proposalId) {
                const proposal = localProposals.find((p) => p.id === msg.proposalId);
                if (proposal) {
                    return (<chat_message_1.ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'creator'} showAvatar={showAvatar}>
                  <div className="max-w-sm">
                    <price_proposal_card_1.PriceProposalCard proposal={proposal} currency={deal.currency} perspective="creator" onAccept={() => handleAcceptProposal(proposal)} onCounter={() => { setActiveProposal(proposal); setCounterOpen(true); }} onDecline={handleDeclineProposal}/>
                  </div>
                </chat_message_1.ChatMessageItem>);
                }
            }
            return (<chat_message_1.ChatMessageItem key={msg.id} message={msg} isCurrentUser={msg.senderRole === 'creator'} showAvatar={showAvatar}/>);
        })}
      </div>

      {/* Input */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-end gap-2">
          <dialog_1.Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
            <dialog_1.DialogTrigger asChild>
              <button_1.Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <lucide_react_1.ArrowLeftRight className="h-3.5 w-3.5"/>
                Propose Price
              </button_1.Button>
            </dialog_1.DialogTrigger>
            <dialog_1.DialogContent>
              <ProposalForm currentPrice={deal.price} currency={deal.currency} disabled={submittingProposal} onSubmit={async (price, reason) => {
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
                    const newProp = {
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
                    (0, app_store_1.addProposalToStore)(deal.id, price, reason, 'creator', creatorName);
                    setLocalProposals((prev) => {
                        const filtered = prev.filter((p) => !p.id.startsWith('prop_'));
                        if (filtered.some((p) => p.id === newProp.id))
                            return filtered;
                        return [...filtered, newProp];
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
            finally {
                setSubmittingProposal(false);
                setProposalOpen(false);
            }
        }}/>
            </dialog_1.DialogContent>
          </dialog_1.Dialog>
          <textarea_1.Textarea placeholder="Type a message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    } }} className="min-h-[40px] max-h-24 resize-none" rows={1}/>
          <button_1.Button size="icon" onClick={sendMessage} className="shrink-0">
            <lucide_react_1.Send className="h-4 w-4"/>
          </button_1.Button>
        </div>

        {/* Pending proposal action banner */}
        {!isClosed && pendingProposal && (<div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950">
            <lucide_react_1.AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0"/>
            <span className="text-sm text-amber-800 dark:text-amber-200 flex-1">
              {pendingProposal.proposedByName} proposed {(0, plans_1.formatCurrency)(pendingProposal.proposedPrice, deal.currency)}
            </span>
            <dialog_1.Dialog open={counterOpen} onOpenChange={setCounterOpen}>
              <dialog_1.DialogTrigger asChild>
                <button_1.Button size="sm" variant="outline" onClick={() => setActiveProposal(pendingProposal)}>
                  Respond
                </button_1.Button>
              </dialog_1.DialogTrigger>
              <dialog_1.DialogContent>
                <CounterOfferForm proposal={pendingProposal} currency={deal.currency} onAccept={() => handleAcceptProposal(pendingProposal)} onDecline={handleDeclineProposal} disabled={submittingProposal} onSubmit={async (price, reason) => {
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
                        const counterProp = {
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
                        (0, app_store_1.addProposalToStore)(deal.id, price, reason, 'creator', creatorName, pendingProposal.id);
                        setLocalProposals((prev) => {
                            const filtered = prev.map((p) => p.id === pendingProposal.id ? { ...p, state: 'countered' } : p)
                                .filter((p) => !p.id.startsWith('prop_'));
                            if (filtered.some((p) => p.id === counterProp.id))
                                return filtered;
                            return [...filtered, counterProp];
                        });
                    }
                }
                catch (e) {
                    console.error(e);
                }
                finally {
                    setSubmittingProposal(false);
                    setCounterOpen(false);
                }
            }}/>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>
          </div>)}
      </div>
    </div>);
}
function ProposalForm({ currentPrice, currency, onSubmit, disabled, }) {
    const [price, setPrice] = (0, react_1.useState)('');
    const [reason, setReason] = (0, react_1.useState)('');
    return (<>
      <dialog_1.DialogHeader>
        <dialog_1.DialogTitle>Propose Price Adjustment</dialog_1.DialogTitle>
      </dialog_1.DialogHeader>
      <div className="space-y-4 py-2">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Current price</p>
          <p className="text-lg font-semibold">{(0, plans_1.formatCurrency)(currentPrice, currency)}</p>
        </div>
        <div className="space-y-2">
          <label_1.Label htmlFor="proposedPrice">New proposed price ({currency})</label_1.Label>
          <input_1.Input id="proposedPrice" type="number" placeholder={String(currentPrice)} value={price} onChange={(e) => setPrice(e.target.value)}/>
        </div>
        <div className="space-y-2">
          <label_1.Label htmlFor="proposalReason">Reason (optional)</label_1.Label>
          <textarea_1.Textarea id="proposalReason" placeholder="Explain why you are proposing this price..." rows={3} value={reason} onChange={(e) => setReason(e.target.value)}/>
        </div>
      </div>
      <dialog_1.DialogFooter>
        <button_1.Button onClick={() => onSubmit(Number(price), reason)} disabled={!price || disabled}>
          {disabled ? 'Sending...' : 'Send Proposal'}
        </button_1.Button>
      </dialog_1.DialogFooter>
    </>);
}
function CounterOfferForm({ proposal, currency, onAccept, onDecline, onSubmit, disabled, }) {
    const [price, setPrice] = (0, react_1.useState)('');
    const [reason, setReason] = (0, react_1.useState)('');
    return (<>
      <dialog_1.DialogHeader>
        <dialog_1.DialogTitle>Respond to Proposal</dialog_1.DialogTitle>
      </dialog_1.DialogHeader>
      <div className="space-y-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Previous</p>
            <p className="text-sm font-semibold line-through text-muted-foreground">
              {(0, plans_1.formatCurrency)(proposal.previousPrice, currency)}
            </p>
          </div>
          <lucide_react_1.ArrowLeftRight className="h-4 w-4 text-muted-foreground"/>
          <div className="flex-1 rounded-lg bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Proposed</p>
            <p className="text-sm font-bold text-primary">
              {(0, plans_1.formatCurrency)(proposal.proposedPrice, currency)}
            </p>
          </div>
        </div>
        {proposal.reason && (<div className="rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Their reason</p>
            <p className="text-sm">{proposal.reason}</p>
          </div>)}
        <div className="space-y-2">
          <label_1.Label htmlFor="counterPrice">Your counter price</label_1.Label>
          <input_1.Input id="counterPrice" type="number" placeholder={String(proposal.proposedPrice)} value={price} onChange={(e) => setPrice(e.target.value)}/>
        </div>
        <div className="space-y-2">
          <label_1.Label htmlFor="counterReason">Reason (optional)</label_1.Label>
          <textarea_1.Textarea id="counterReason" placeholder="Explain your counter offer..." rows={3} value={reason} onChange={(e) => setReason(e.target.value)}/>
        </div>
      </div>
      <dialog_1.DialogFooter className="gap-2">
        <button_1.Button variant="ghost" onClick={onDecline} className="mr-auto text-muted-foreground" disabled={disabled}>
          <lucide_react_1.X className="h-4 w-4 mr-1.5"/>
          Decline
        </button_1.Button>
        <button_1.Button variant="outline" onClick={onAccept} className="gap-1.5" disabled={disabled}>
          <lucide_react_1.Check className="h-4 w-4"/>
          Accept
        </button_1.Button>
        <button_1.Button onClick={() => onSubmit(Number(price), reason)} disabled={!price || disabled}>
          {disabled ? 'Sending...' : 'Send Counter'}
        </button_1.Button>
      </dialog_1.DialogFooter>
    </>);
}
// ---------------------------------------------------------------------------
// Files Tab (Private Storage & Upload Modal)
// ---------------------------------------------------------------------------
function FilesTab({ deal, deliverables, fileVersions, changeRequests, isClosed, }) {
    const isPaid = deal.paymentStatus === 'paid';
    const [uploadOpen, setUploadOpen] = (0, react_1.useState)(false);
    const [selectedDeliverable, setSelectedDeliverable] = (0, react_1.useState)(deliverables[0]?.id || '');
    const [fileDesc, setFileDesc] = (0, react_1.useState)('');
    const [selectedFile, setSelectedFile] = (0, react_1.useState)(null);
    const [uploading, setUploading] = (0, react_1.useState)(false);
    const [uploadError, setUploadError] = (0, react_1.useState)('');
    async function handleUploadFile(e) {
        e.preventDefault();
        if (!selectedFile)
            return;
        setUploading(true);
        setUploadError('');
        try {
            const previewBlob = await generateClientPreview(selectedFile);
            const formData = new FormData();
            formData.append('dealId', deal.id);
            formData.append('deliverableId', selectedDeliverable || deliverables[0]?.id || 'del-1');
            formData.append('description', fileDesc);
            formData.append('file', selectedFile);
            if (previewBlob) {
                const originalExt = selectedFile.name.split('.').pop()?.toLowerCase();
                let previewExt = originalExt;
                if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
                    previewExt = 'jpg';
                }
                const previewName = selectedFile.name.replace(/\.[^.]+$/, `-preview.${previewExt}`);
                formData.append('previewFile', new File([previewBlob], previewName, { type: previewBlob.type }));
            }
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
        }
        catch (err) {
            setUploadError(err.message || 'Upload failed');
        }
        finally {
            setUploading(false);
        }
    }
    const [downloadingAll, setDownloadingAll] = (0, react_1.useState)(false);
    const allFilesList = fileVersions.flatMap((v) => v.files.map((f) => ({
        name: f.name,
        path: f.path || f.url || f.name,
    })));
    async function handleDownloadAllFiles() {
        if (allFilesList.length === 0)
            return;
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
        }
        catch (e) {
            console.error('Download error:', e);
        }
        finally {
            setDownloadingAll(false);
        }
    }
    return (<div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {/* Download All Bar when files exist */}
        {allFilesList.length > 1 && (<div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Project Deliverables ({allFilesList.length} files)</p>
              <p className="text-[11px] text-muted-foreground">Download all uploaded version assets in one click</p>
            </div>
            <button_1.Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleDownloadAllFiles} disabled={downloadingAll}>
              <lucide_react_1.Download className="h-3.5 w-3.5"/>
              {downloadingAll ? 'Downloading...' : 'Download All Files'}
            </button_1.Button>
          </div>)}

        {/* Upload area */}
        <card_1.Card className="border-dashed">
          <card_1.CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
              <lucide_react_1.Upload className="h-5 w-5 text-muted-foreground"/>
            </div>
            <p className="text-sm font-medium">Upload deliverables</p>
            <p className="text-xs text-muted-foreground mt-1">
              Files are saved to private storage and unlocked automatically upon payment.
            </p>

            <dialog_1.Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <dialog_1.DialogTrigger asChild>
                <button_1.Button variant="outline" size="sm" className="mt-3 gap-1.5">
                  <lucide_react_1.Upload className="h-3.5 w-3.5"/>
                  Select files to upload
                </button_1.Button>
              </dialog_1.DialogTrigger>
              <dialog_1.DialogContent>
                <dialog_1.DialogHeader>
                  <dialog_1.DialogTitle>Upload Deliverable Version</dialog_1.DialogTitle>
                </dialog_1.DialogHeader>
                <form onSubmit={handleUploadFile} className="space-y-4 pt-2">
                  {deliverables.length > 0 && (<div className="space-y-1.5">
                      <label_1.Label className="text-xs">Select Deliverable</label_1.Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs" value={selectedDeliverable} onChange={(e) => setSelectedDeliverable(e.target.value)}>
                        {deliverables.map((del) => (<option key={del.id} value={del.id}>
                            {del.name}
                          </option>))}
                      </select>
                    </div>)}
                  <div className="space-y-1.5">
                    <label_1.Label className="text-xs">Version Description (optional)</label_1.Label>
                    <input_1.Input placeholder="e.g. Master design export v2 with revisions" value={fileDesc} onChange={(e) => setFileDesc(e.target.value)}/>
                  </div>
                  <div className="space-y-1.5">
                    <label_1.Label className="text-xs">Choose File *</label_1.Label>
                    <input_1.Input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required/>
                  </div>
                  {uploadError && (<div className="p-2 rounded bg-destructive/10 text-xs text-destructive">
                      {uploadError}
                    </div>)}
                  <dialog_1.DialogFooter>
                    <button_1.Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                      Cancel
                    </button_1.Button>
                    <button_1.Button type="submit" disabled={!selectedFile || uploading}>
                      {uploading ? 'Uploading...' : 'Upload Version'}
                    </button_1.Button>
                  </dialog_1.DialogFooter>
                </form>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>
          </card_1.CardContent>
        </card_1.Card>

        {/* Deliverables with versions */}
        {deliverables.length === 0 ? (<card_1.Card>
            <card_1.CardContent>
              <empty_state_1.EmptyState icon={lucide_react_1.FileCheck} title="No deliverables" description="No deliverables have been added to this deal yet."/>
            </card_1.CardContent>
          </card_1.Card>) : (deliverables.map((del) => {
            const versions = fileVersions.filter((v) => v.deliverableId === del.id);
            return (<card_1.Card key={del.id}>
                <card_1.CardHeader className="flex-row items-center justify-between space-y-0">
                  <card_1.CardTitle className="text-base">{del.name}</card_1.CardTitle>
                  <deal_status_badge_1.DeliverableStatusBadge status={isPaid || deal.status === 'completed' ? 'approved' : del.status}/>
                </card_1.CardHeader>
                <card_1.CardContent>
                  {versions.length === 0 ? (<p className="text-sm text-muted-foreground">No versions uploaded yet.</p>) : (<div className="space-y-3">
                      {versions.map((v) => (<div key={v.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Version {v.version}</span>
                              {v.version === Math.max(...versions.map((vv) => vv.version)) && (<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>)}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          {v.description && <p className="text-sm text-muted-foreground mb-2">{v.description}</p>}
                          <div className="space-y-1.5">
                            {v.files.map((f) => (<file_card_1.FileCard key={f.id} file={f} locked={v.locked && !isPaid}/>))}
                          </div>
                          {!isPaid && v.locked && (<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <lucide_react_1.Lock className="h-3 w-3"/>
                              <span>Files locked until payment is confirmed</span>
                            </div>)}
                          {isPaid && (<div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                              <lucide_react_1.Check className="h-3 w-3"/>
                              <span>Files unlocked — payment confirmed</span>
                            </div>)}
                        </div>))}
                    </div>)}
                </card_1.CardContent>
              </card_1.Card>);
        }))}
      </div>

      {/* Sidebar: Change requests */}
      <div className="space-y-4">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base flex items-center gap-2">
              <lucide_react_1.Flag className="h-4 w-4"/>
              Change Requests
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-2">
            {changeRequests.length === 0 ? (<p className="text-sm text-muted-foreground">No change requests.</p>) : (changeRequests.map((cr) => (<div key={cr.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{cr.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cr.description}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {cr.requestedByName}</span>
                    <span className="capitalize text-amber-600 dark:text-amber-400 font-medium">{cr.status}</span>
                  </div>
                </div>)))}
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Payments Tab
// ---------------------------------------------------------------------------
function PaymentsTab({ deal, payments, }) {
    const isPaid = deal.paymentStatus === 'paid';
    return (<div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Payment Summary</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Total Deal Amount</p>
                <p className="text-2xl font-display font-semibold mt-0.5">{(0, plans_1.formatCurrency)(deal.price, deal.currency)}</p>
              </div>
              <deal_status_badge_1.PaymentStatusBadge status={deal.paymentStatus}/>
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
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <div>
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Payment Gateway</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <lucide_react_1.CreditCard className="h-5 w-5"/>
              </div>
              <div>
                <p className="text-sm font-medium">Razorpay Gateway</p>
                <p className="text-xs text-muted-foreground">Cards, UPI, Netbanking & Wallets</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border">
              When your client completes payment in the portal, files unlock immediately and the transaction is recorded.
            </p>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Activity Tab
// ---------------------------------------------------------------------------
function ActivityTab({ events }) {
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle className="text-base">Deal Activity Timeline</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent>
        {events.length === 0 ? (<empty_state_1.EmptyState icon={lucide_react_1.Activity} title="No activity recorded" description="Events will appear here as deal updates occur."/>) : (<timeline_event_1.Timeline events={events}/>)}
      </card_1.CardContent>
    </card_1.Card>);
}
function SettingsTab({ deal, onUpdateDeal, fileVersions, }) {
    const router = (0, navigation_1.useRouter)();
    const [previewEnabled, setPreviewEnabled] = (0, react_1.useState)(deal.previewEnabled || false);
    const [updating, setUpdating] = (0, react_1.useState)(false);
    const [statusText, setStatusText] = (0, react_1.useState)('');
    const [progressText, setProgressText] = (0, react_1.useState)('');
    // Sync state if deal updates
    (0, react_1.useEffect)(() => {
        setPreviewEnabled(deal.previewEnabled || false);
    }, [deal]);
    async function handleTogglePreview(checked) {
        setUpdating(true);
        setStatusText('Updating setting...');
        setProgressText('');
        try {
            const supabase = (0, client_1.createClient)();
            const serializedDesc = (0, utils_1.serializeDescription)(deal.description, checked);
            // Update setting in Supabase deals table
            const { error: updateErr } = await supabase
                .from('deals')
                .update({ description: serializedDesc })
                .eq('id', deal.id);
            if (updateErr)
                throw updateErr;
            // Update local state
            onUpdateDeal({ ...deal, previewEnabled: checked, description: serializedDesc || '' });
            setPreviewEnabled(checked);
            setStatusText('Setting saved.');
            // If checked is true, do retrospective preview generation for supported files
            if (checked) {
                setStatusText('Checking for files needing previews...');
                // Find supported files without previews
                const filesToProcess = [];
                for (const version of fileVersions) {
                    const files = Array.isArray(version.files) ? version.files : [];
                    for (const f of files) {
                        const ext = f.name.split('.').pop()?.toLowerCase() || '';
                        const isImage = (f.type || '').startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
                        const isPdf = f.type === 'application/pdf' || ext === 'pdf';
                        const isVideo = (f.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                        const isSupported = isImage || isPdf || isVideo;
                        // If supported and does not have a ready preview
                        if (isSupported && (!f.previewPath || f.previewStatus !== 'ready') && f.deletionStatus !== 'deleted') {
                            filesToProcess.push({
                                versionId: version.id,
                                fileId: f.id,
                                fileItem: f,
                            });
                        }
                    }
                }
                if (filesToProcess.length === 0) {
                    setStatusText('Preview ready');
                    setUpdating(false);
                    return;
                }
                let completedCount = 0;
                setStatusText(`Generating previews... 0 of ${filesToProcess.length} files completed`);
                for (const target of filesToProcess) {
                    try {
                        setProgressText(`Processing: ${target.fileItem.name}...`);
                        const targetExt = target.fileItem.name.split('.').pop()?.toLowerCase() || '';
                        const targetIsVideo = (target.fileItem.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(targetExt);
                        if (targetIsVideo) {
                            const formData = new FormData();
                            formData.append('dealId', deal.id);
                            formData.append('fileVersionId', target.versionId);
                            formData.append('fileId', target.fileId);
                            const uploadRes = await fetch('/api/files/preview-upload', {
                                method: 'POST',
                                body: formData,
                            });
                            if (!uploadRes.ok)
                                throw new Error('Failed to start server-side video preview generation');
                            completedCount++;
                            setStatusText(`Generating previews... ${completedCount} of ${filesToProcess.length} files completed`);
                            continue;
                        }
                        // 1. Get secure signed download URL for original file
                        const signedRes = await fetch('/api/files/signed-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                dealId: deal.id,
                                filePath: target.fileItem.path,
                                isCreator: true,
                            }),
                        });
                        if (!signedRes.ok)
                            throw new Error('Failed to get download URL');
                        const { signedUrl } = await signedRes.json();
                        if (!signedUrl)
                            throw new Error('Download URL not returned');
                        // 2. Fetch the file data
                        const fileDataRes = await fetch(signedUrl);
                        if (!fileDataRes.ok)
                            throw new Error('Failed to download file');
                        const blob = await fileDataRes.blob();
                        const fileObj = new File([blob], target.fileItem.name, { type: target.fileItem.type });
                        // 3. Generate preview client-side
                        const previewBlob = await generateClientPreview(fileObj);
                        if (!previewBlob)
                            throw new Error('Failed to generate preview copy');
                        // 4. Upload preview
                        const originalExt = fileObj.name.split('.').pop()?.toLowerCase();
                        let previewExt = originalExt || 'jpg';
                        if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
                            previewExt = 'jpg';
                        }
                        const originalBaseName = fileObj.name.substring(0, fileObj.name.lastIndexOf('.')) || fileObj.name;
                        const previewName = `preview-${originalBaseName}.${previewExt}`;
                        const formData = new FormData();
                        formData.append('dealId', deal.id);
                        formData.append('fileVersionId', target.versionId);
                        formData.append('fileId', target.fileId);
                        formData.append('previewFile', new File([previewBlob], previewName, { type: previewBlob.type }));
                        const uploadRes = await fetch('/api/files/preview-upload', {
                            method: 'POST',
                            body: formData,
                        });
                        if (!uploadRes.ok)
                            throw new Error('Failed to upload preview file');
                        completedCount++;
                        setStatusText(`Generating previews... ${completedCount} of ${filesToProcess.length} files completed`);
                    }
                    catch (fileErr) {
                        console.error(`Failed to process preview for ${target.fileItem.name}:`, fileErr);
                        completedCount++;
                        setStatusText(`Generating previews... ${completedCount} of ${filesToProcess.length} files completed`);
                    }
                }
                setStatusText('Preview ready');
                setProgressText('');
                // Trigger a reload or state refresh
                router.refresh();
            }
            else {
                setStatusText('');
                setProgressText('');
            }
        }
        catch (err) {
            console.error('Error toggling preview settings:', err);
            setStatusText(`Error: ${err.message || 'Failed to update settings'}`);
        }
        finally {
            setUpdating(false);
        }
    }
    return (<card_1.Card>
      <card_1.CardHeader>
        <card_1.CardTitle className="text-base">Deal Workspace Settings</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-6">
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium">Client File Preview</span>
              <p className="text-xs text-muted-foreground pr-4">
                Let clients inspect watermarked previews before payment.
              </p>
            </div>
            <button type="button" disabled={updating} onClick={() => handleTogglePreview(!previewEnabled)} className={(0, utils_1.cn)("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50", previewEnabled ? "bg-primary" : "bg-muted")}>
              <span className={(0, utils_1.cn)("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out", previewEnabled ? "translate-x-5" : "translate-x-0")}/>
            </button>
          </div>

          {(statusText || progressText) && (<div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
              {statusText && <p className="font-semibold text-primary">{statusText}</p>}
              {progressText && <p className="text-muted-foreground">{progressText}</p>}
            </div>)}
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
const loadPdfLib = () => {
    return new Promise((resolve, reject) => {
        if (window.PDFLib)
            return resolve(window.PDFLib);
        const script = document.createElement('script');
        script.src = '/lib/pdf-lib.min.js';
        script.onload = () => resolve(window.PDFLib);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};
async function generateClientPreview(file) {
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
                    }
                    else {
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
                    const fontSize = Math.max(32, Math.round(Math.min(width, height) * 0.045));
                    ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)'; // Hollow dark gray outline at 35% opacity
                    ctx.lineWidth = 2;
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const text = 'DELT PREVIEW';
                    const textWidth = ctx.measureText(text).width;
                    const stepX = textWidth + 35; // Compact horizontal gap (20-50px)
                    const stepY = fontSize + 45; // Compact vertical gap (30-60px)
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
                img.src = event.target?.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }
    if (isPdf) {
        try {
            const PDFLib = (await loadPdfLib());
            if (!PDFLib)
                return null;
            const fileBytes = new Uint8Array(await file.arrayBuffer());
            const pdfDoc = await PDFLib.PDFDocument.load(fileBytes);
            const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
            const pages = pdfDoc.getPages();
            const pagesToKeep = pages.slice(0, 5);
            const previewDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await previewDoc.copyPages(pdfDoc, pagesToKeep.map((_, i) => i));
            for (const page of copiedPages) {
                previewDoc.addPage(page);
                const { width, height } = page.getSize();
                // Staggered grid watermark on PDF page with outline/stroke configuration
                const text = 'DELT PREVIEW';
                const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
                const stepX = (fontSize * 8) + 35; // approximate width of 'DELT PREVIEW' + horizontal gap
                const stepY = fontSize + 45; // vertical gap
                const rotationAngle = 30; // 30 degrees rotation
                page.pushOperators(PDFLib.pushGraphicsState(), PDFLib.setStrokingColor(PDFLib.rgb(0.27, 0.27, 0.27)), // rgb(70,70,70) -> 70/255 = 0.27
                PDFLib.setLineWidth(2), PDFLib.setTextRenderingMode(PDFLib.TextRenderingMode.Outline));
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
        }
        catch (err) {
            console.error('Error generating PDF preview client-side:', err);
            return null;
        }
    }
    return null;
}
