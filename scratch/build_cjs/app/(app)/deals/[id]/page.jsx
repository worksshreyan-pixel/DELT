"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const deal_workspace_1 = require("@/components/deal-workspace");
const app_shell_1 = require("@/components/app-shell");
const empty_state_1 = require("@/components/empty-state");
const lucide_react_1 = require("lucide-react");
const app_store_1 = require("@/lib/app-store");
const client_1 = require("@/lib/supabase/client");
const env_1 = require("@/lib/env");
const utils_1 = require("@/lib/utils");
function DealDetailPage() {
    const params = (0, navigation_1.useParams)();
    const dealId = params.id;
    const store = (0, app_store_1.useAppStore)();
    const [deal, setDeal] = (0, react_1.useState)(() => store.deals.find((d) => d.id === dealId) || null);
    const [messages, setMessages] = (0, react_1.useState)(() => store.messages[dealId] || []);
    const [proposals, setProposals] = (0, react_1.useState)(() => store.proposals[dealId] || []);
    const [deliverables, setDeliverables] = (0, react_1.useState)(() => store.deliverables[dealId] || []);
    const [fileVersions, setFileVersions] = (0, react_1.useState)(() => store.fileVersions[dealId] || []);
    const [events, setEvents] = (0, react_1.useState)(() => store.events[dealId] || []);
    const [payments, setPayments] = (0, react_1.useState)(() => store.payments[dealId] || []);
    const [loading, setLoading] = (0, react_1.useState)(!deal);
    (0, react_1.useEffect)(() => {
        const storeDeal = store.deals.find((d) => d.id === dealId);
        if (storeDeal) {
            setDeal(storeDeal);
            setPayments(store.payments[dealId] || []);
        }
        if (!(0, env_1.hasSupabasePublicConfig)()) {
            setLoading(false);
            return;
        }
        async function fetchDealData() {
            const supabase = (0, client_1.createClient)();
            try {
                let currentDeal = storeDeal;
                if (!currentDeal) {
                    const { data: dbDeal } = await supabase
                        .from('deals')
                        .select('*')
                        .eq('id', dealId)
                        .maybeSingle();
                    if (dbDeal) {
                        currentDeal = {
                            id: dbDeal.id,
                            token: dbDeal.token,
                            creatorId: dbDeal.creator_id,
                            clientId: dbDeal.client_id || '',
                            title: dbDeal.title,
                            description: (0, utils_1.parseDescription)(dbDeal.description).description,
                            scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
                            price: Number(dbDeal.price),
                            currency: dbDeal.currency || 'INR',
                            status: dbDeal.status || 'in_progress',
                            deadline: dbDeal.deadline,
                            progress: Number(dbDeal.progress || 0),
                            paymentStatus: dbDeal.payment_status || 'pending',
                            lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
                            createdAt: dbDeal.created_at,
                            updatedAt: dbDeal.updated_at,
                            previewEnabled: (0, utils_1.parseDescription)(dbDeal.description).previewEnabled,
                        };
                        setDeal(currentDeal);
                    }
                }
                if (currentDeal) {
                    // Fetch child data in parallel
                    const [dbMsgs, dbProps, dbDelivs, dbVersions, dbEvents] = await Promise.all([
                        supabase.from('deal_messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: true }),
                        supabase.from('price_proposals').select('*').eq('deal_id', dealId).order('created_at', { ascending: true }),
                        supabase.from('deliverables').select('*').eq('deal_id', dealId),
                        supabase.from('file_versions').select('*').eq('deal_id', dealId).order('version', { ascending: true }),
                        supabase.from('deal_events').select('*').eq('deal_id', dealId).order('created_at', { ascending: false })
                    ]);
                    if (dbMsgs.data) {
                        setMessages(dbMsgs.data.map((m) => ({
                            id: m.id,
                            dealId: m.deal_id,
                            senderId: m.sender_id,
                            senderName: m.sender_name,
                            senderRole: m.sender_role,
                            type: m.type,
                            content: m.content,
                            proposalId: m.proposal_id,
                            createdAt: m.created_at,
                        })));
                    }
                    if (dbProps.data) {
                        setProposals(dbProps.data.map((p) => ({
                            id: p.id,
                            dealId: p.deal_id,
                            direction: p.direction,
                            previousPrice: Number(p.previous_price),
                            proposedPrice: Number(p.proposed_price),
                            reason: p.reason,
                            state: p.state,
                            proposedBy: p.proposed_by,
                            proposedByName: p.proposed_by_name,
                            proposedByRole: p.proposed_by_role,
                            createdAt: p.created_at,
                        })));
                    }
                    if (dbDelivs.data) {
                        setDeliverables(dbDelivs.data.map((d) => ({
                            id: d.id,
                            dealId: d.deal_id,
                            name: d.name,
                            description: d.description,
                            status: d.status,
                            createdAt: d.created_at,
                        })));
                    }
                    if (dbVersions.data) {
                        setFileVersions(dbVersions.data.map((v) => ({
                            id: v.id,
                            deliverableId: v.deliverable_id,
                            dealId: v.deal_id || dealId,
                            version: v.version,
                            description: v.description,
                            uploaderId: v.uploader_id || '',
                            uploaderName: v.uploader_name || 'Creator',
                            files: Array.isArray(v.files) ? v.files : [],
                            status: v.status,
                            locked: Boolean(v.locked),
                            createdAt: v.created_at,
                        })));
                    }
                    if (dbEvents.data) {
                        setEvents(dbEvents.data.map((e) => ({
                            id: e.id,
                            dealId: e.deal_id,
                            type: e.type,
                            actorName: e.actor_name || 'System',
                            actorRole: e.actor_role || 'system',
                            description: e.description,
                            createdAt: e.created_at,
                        })));
                    }
                }
            }
            catch (err) {
                console.error('Error fetching deal details', err);
            }
            finally {
                setLoading(false);
            }
        }
        fetchDealData();
    }, [dealId, store.deals, store.payments]);
    (0, react_1.useEffect)(() => {
        if (!dealId || !(0, env_1.hasSupabasePublicConfig)())
            return;
        const supabase = (0, client_1.createClient)();
        const channel = supabase
            .channel(`deal-creator:${dealId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${dealId}` }, (payload) => {
            const raw = payload.new;
            const formattedMsg = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || dealId,
                senderId: raw.sender_id || raw.senderId || 'user',
                senderName: raw.sender_name || raw.senderName || 'User',
                senderRole: raw.sender_role || raw.senderRole || 'client',
                type: raw.type,
                content: raw.content,
                proposalId: raw.proposal_id || raw.proposalId,
                createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
            };
            setMessages((prev) => {
                const exists = prev.some((m) => m.id === formattedMsg.id);
                if (exists)
                    return prev;
                // Filter out optimistic message if content matches
                const filtered = prev.filter((m) => !(m.id.startsWith('msg_') && m.content === formattedMsg.content));
                return [...filtered, formattedMsg];
            });
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'price_proposals', filter: `deal_id=eq.${dealId}` }, (payload) => {
            const raw = payload.new;
            const formattedProp = {
                id: raw.id,
                dealId: raw.deal_id || raw.dealId || dealId,
                direction: raw.direction,
                previousPrice: Number(raw.previous_price ?? raw.previousPrice ?? 0),
                proposedPrice: Number(raw.proposed_price ?? raw.proposedPrice ?? 0),
                reason: raw.reason,
                state: raw.state,
                proposedBy: raw.proposed_by || raw.proposedBy || 'user',
                proposedByName: raw.proposed_by_name || raw.proposedByName || 'User',
                proposedByRole: raw.proposed_by_role || raw.proposedByRole || 'client',
                counterProposalId: raw.parent_proposal_id || raw.parentProposalId || raw.counter_proposal_id || raw.counterProposalId,
                createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
            };
            if (payload.eventType === 'INSERT') {
                setProposals((prev) => {
                    const filtered = prev.filter((p) => !(p.id.startsWith('prop_') && p.proposedPrice === formattedProp.proposedPrice && p.proposedByRole === formattedProp.proposedByRole));
                    if (filtered.some((p) => p.id === formattedProp.id))
                        return filtered;
                    return [...filtered, formattedProp];
                });
            }
            else if (payload.eventType === 'UPDATE') {
                setProposals((prev) => prev.map((p) => (p.id === formattedProp.id ? formattedProp : p)));
            }
        })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${dealId}` }, (payload) => {
            const updated = payload.new;
            setDeal((prev) => {
                if (!prev)
                    return null;
                return {
                    ...prev,
                    ...updated,
                    price: Number(updated.price ?? prev.price),
                    status: updated.status || prev.status,
                    paymentStatus: updated.payment_status || prev.paymentStatus,
                    lastActivityAt: updated.last_activity_at || prev.lastActivityAt,
                };
            });
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [dealId]);
    if (loading) {
        return (<div className="py-16 text-center space-y-2">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
        <p className="text-xs text-muted-foreground">Loading deal workspace...</p>
      </div>);
    }
    if (!deal) {
        return (<div className="py-12">
        <empty_state_1.EmptyState icon={lucide_react_1.FolderKanban} title="Deal not found" description="This deal may have been removed or does not exist." actionLabel="Back to Deals" actionHref="/deals"/>
      </div>);
    }
    const client = store.clients.find((c) => c.id === deal.clientId);
    const clientName = deal.client_name || deal.clientName || client?.name || 'Client';
    const clientCompany = client?.company;
    return (<div className="space-y-4">
      <app_shell_1.Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: deal.title }]}/>
      <deal_workspace_1.DealWorkspace deal={deal} clientName={clientName} clientEmail={deal.client_email || deal.clientEmail || ''} clientCompany={clientCompany} creatorName={store.user.displayName || 'Creator'} messages={messages} proposals={proposals} events={events} deliverables={deliverables} fileVersions={fileVersions} milestones={[]} payments={payments} changeRequests={[]}/>
    </div>);
}
exports.default = DealDetailPage;
