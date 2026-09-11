'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DealWorkspace } from '@/components/deal-workspace';
import { Breadcrumb } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { FolderKanban } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { parseDescription } from '@/lib/utils';
import type { Deal, DealMessage, PriceProposal, DealEvent, Deliverable, FileVersion, Payment, Milestone } from '@/lib/types';

export default function DealDetailPage() {
  const params = useParams();
  const routeParam = params.identifier as string;
  const store = useAppStore();

  const [deal, setDeal] = useState<Deal | null>(() => store.deals.find((d) => d.id === routeParam || d.dealCode === routeParam) || null);
  
  // Use resolved ID for child store lookup, fallback to routeParam if not loaded yet
  const actualDealId = deal?.id || routeParam;

  const [messages, setMessages] = useState<DealMessage[]>(() => store.messages[actualDealId] || []);
  const [proposals, setProposals] = useState<PriceProposal[]>(() => store.proposals[actualDealId] || []);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => store.deliverables[actualDealId] || []);
  const [fileVersions, setFileVersions] = useState<FileVersion[]>(() => store.fileVersions[actualDealId] || []);
  const [events, setEvents] = useState<DealEvent[]>(() => store.events[actualDealId] || []);
  const [payments, setPayments] = useState<Payment[]>(() => store.payments[actualDealId] || []);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(!deal);

  useEffect(() => {
    const storeDeal = store.deals.find((d) => d.id === routeParam || d.dealCode === routeParam);
    const resolvedId = storeDeal?.id || routeParam;
    
    if (storeDeal) {
      setDeal(storeDeal);
      setPayments(store.payments[resolvedId] || []);
    }

    if (!hasSupabasePublicConfig()) {
      setLoading(false);
      return;
    }

    async function fetchDealData() {
      const supabase = createClient();
      try {
        let currentDeal = storeDeal;
        if (!currentDeal) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeParam);
          let query = supabase.from('deals').select('*');
          
          if (isUuid) {
            query = query.eq('id', routeParam);
          } else {
            query = query.eq('deal_code', routeParam);
          }
          
          const { data: dbDeal } = await query.maybeSingle();

          if (dbDeal) {
            currentDeal = {
              id: dbDeal.id,
              dealCode: dbDeal.deal_code,
              token: dbDeal.token,
              creatorId: dbDeal.creator_id,
              clientId: dbDeal.client_id || '',
              title: dbDeal.title,
              description: parseDescription(dbDeal.description).description,
              scope: Array.isArray(dbDeal.scope) ? dbDeal.scope : [],
              price: Number(dbDeal.price),
              currency: dbDeal.currency || 'INR',
              status: dbDeal.status || 'in_progress',
              deadline: dbDeal.deadline,
              paymentStatus: dbDeal.payment_status || 'pending',
              lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
              createdAt: dbDeal.created_at,
              updatedAt: dbDeal.updated_at,
              previewEnabled: parseDescription(dbDeal.description).previewEnabled,
              projectStructure: dbDeal.project_structure || 'scope_and_milestones',
            };
            setDeal(currentDeal);
          }
        }

        if (currentDeal) {
          const fetchedId = currentDeal.id;
          const [dbMsgs, dbProps, dbDelivs, dbVersions, dbEvents, dbInvoicesRaw, dbMilestones] = await Promise.all([
            supabase.from('deal_messages').select('*').eq('deal_id', fetchedId).order('created_at', { ascending: true }),
            supabase.from('price_proposals').select('*').eq('deal_id', fetchedId).order('created_at', { ascending: true }),
            supabase.from('deliverables').select('*').eq('deal_id', fetchedId),
            supabase.from('file_versions').select('*').eq('deal_id', fetchedId).order('version', { ascending: true }),
            supabase.from('deal_events').select('*').eq('deal_id', fetchedId).order('created_at', { ascending: false }),
            supabase.from('invoices').select('*, creator:profiles(*)').eq('deal_id', fetchedId).neq('status', 'draft').order('created_at', { ascending: false }),
            supabase.from('milestones').select('*').eq('deal_id', fetchedId).order('order', { ascending: true })
          ]);

          let fetchedInvoices = dbInvoicesRaw.data || [];

          if (fetchedInvoices.length === 0 && currentDeal.status === 'completed' && currentDeal.paymentStatus === 'paid') {
            try {
              const res = await fetch('/api/invoices/ensure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dealId: fetchedId })
              });
              const json = await res.json();
              if (json.invoice) {
                const { data: genInvoice } = await supabase.from('invoices').select('*, creator:profiles(*)').eq('id', json.invoice.id).maybeSingle();
                if (genInvoice) fetchedInvoices = [genInvoice];
              }
            } catch (e) {
              console.error('Failed to ensure invoice', e);
            }
          }
          setInvoices(fetchedInvoices);

          if (dbMsgs.data) {
            setMessages(dbMsgs.data.map((m: any) => ({
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
            setProposals(dbProps.data.map((p: any) => ({
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
            setDeliverables(dbDelivs.data.map((d: any) => ({
              id: d.id,
              dealId: d.deal_id,
              name: d.name,
              description: d.description,
              status: d.status,
              createdAt: d.created_at,
            })));
          }

          if (dbVersions.data) {
            setFileVersions(dbVersions.data.map((v: any) => ({
              id: v.id,
              deliverableId: v.deliverable_id,
              dealId: v.deal_id || currentDeal?.id || actualDealId,
              version: v.version,
              description: v.description,
              uploaderId: v.uploader_id || '',
              uploaderName: v.uploader_name || 'Creator',
              files: Array.isArray(v.files) ? v.files : [],
              status: v.status,
              locked: Boolean(v.locked),
              clientFeedback: v.client_feedback,
              reviewedAt: v.reviewed_at,
              createdAt: v.created_at,
            })));
          }

          if (dbEvents.data) {
            setEvents(dbEvents.data.map((e: any) => ({
              id: e.id,
              dealId: e.deal_id,
              type: e.type,
              actorName: e.actor_name || 'System',
              actorRole: e.actor_role || 'system',
              description: e.description,
              createdAt: e.created_at,
            })));
          }

          if (dbMilestones.data) {
            setMilestones(dbMilestones.data.map((m: any) => ({
              id: m.id,
              dealId: m.deal_id,
              title: m.title,
              description: m.description,
              order: m.order,
              dueDate: m.due_date,
              status: m.status,
              completedAt: m.completed_at,
              createdAt: m.created_at,
              updatedAt: m.updated_at,
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching deal details', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDealData();
  }, [actualDealId, store.deals, store.payments]);

  useEffect(() => {
    if (!deal || !hasSupabasePublicConfig()) return;

    const fetchedId = deal.id;
    const supabase = createClient();
    const channel = supabase
      .channel(`deal-creator:${fetchedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deal_messages', filter: `deal_id=eq.${fetchedId}` },
        (payload) => {
          const raw = payload.new as any;
          const formattedMsg = {
            id: raw.id,
            dealId: raw.deal_id || raw.actualDealId || fetchedId,
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
            if (exists) return prev;
            // Filter out optimistic message if content matches
            const filtered = prev.filter((m) => !(m.id.startsWith('msg_') && m.content === formattedMsg.content));
            return [...filtered, formattedMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_proposals', filter: `deal_id=eq.${fetchedId}` },
        (payload) => {
          const raw = payload.new as any;
          const formattedProp: PriceProposal = {
            id: raw.id,
            dealId: raw.deal_id || raw.dealId || fetchedId,
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
              if (filtered.some((p) => p.id === formattedProp.id)) return filtered;
              return [...filtered, formattedProp];
            });
          } else if (payload.eventType === 'UPDATE') {
            setProposals((prev) =>
              prev.map((p) => (p.id === formattedProp.id ? formattedProp : p))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${fetchedId}` },
        (payload) => {
          const updated = payload.new as any;
          setDeal((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ...updated,
              price: Number(updated.price ?? prev.price),
              status: updated.status || prev.status,
              paymentStatus: updated.payment_status || prev.paymentStatus,
              lastActivityAt: updated.last_activity_at || prev.lastActivityAt,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestones', filter: `deal_id=eq.${fetchedId}` },
        (payload) => {
          const raw = payload.new as any;
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any).id;
            setMilestones((prev) => prev.filter((m) => m.id !== oldId));
          } else {
            const formatted: Milestone = {
              id: raw.id,
              dealId: raw.deal_id,
              title: raw.title,
              description: raw.description,
              order: raw.order,
              dueDate: raw.due_date,
              status: raw.status,
              completedAt: raw.completed_at,
              createdAt: raw.created_at,
              updatedAt: raw.updated_at,
            };
            if (payload.eventType === 'INSERT') {
              setMilestones((prev) => {
                if (prev.some((m) => m.id === formatted.id)) return prev;
                return [...prev, formatted];
              });
            } else if (payload.eventType === 'UPDATE') {
              setMilestones((prev) =>
                prev.map((m) => (m.id === formatted.id ? formatted : m))
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deal?.id]);

  if (loading) {
    return (
      <div className="py-16 text-center space-y-2">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading deal workspace...</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FolderKanban}
          title="Deal not found"
          description="This deal may have been removed or does not exist."
          actionLabel="Back to Deals"
          actionHref="/deals"
        />
      </div>
    );
  }

  const client = store.clients.find((c) => c.id === deal.clientId);
  const clientName = (deal as any).client_name || (deal as any).clientName || client?.name || 'Client';
  const clientCompany = client?.company;

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: deal.title }]} />
      <DealWorkspace
        deal={deal}
        clientName={clientName}
        clientEmail={(deal as any).client_email || (deal as any).clientEmail || ''}
        clientCompany={clientCompany}
        creatorName={store.user.displayName || 'Creator'}
        messages={messages}
        proposals={proposals}
        events={events}
        deliverables={deliverables}
        fileVersions={fileVersions}
        milestones={milestones}
        payments={payments}
        changeRequests={[]}
        invoices={invoices}
      />
    </div>
  );
}
