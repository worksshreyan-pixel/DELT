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
import type { Deal, DealMessage, PriceProposal, DealEvent, Deliverable, FileVersion, Payment } from '@/lib/types';

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const store = useAppStore();

  const [deal, setDeal] = useState<Deal | null>(() => store.deals.find((d) => d.id === dealId) || null);
  const [messages, setMessages] = useState<DealMessage[]>(() => store.messages[dealId] || []);
  const [proposals, setProposals] = useState<PriceProposal[]>(() => store.proposals[dealId] || []);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => store.deliverables[dealId] || []);
  const [fileVersions, setFileVersions] = useState<FileVersion[]>(() => store.fileVersions[dealId] || []);
  const [events, setEvents] = useState<DealEvent[]>(() => store.events[dealId] || []);
  const [payments, setPayments] = useState<Payment[]>(() => store.payments[dealId] || []);
  const [loading, setLoading] = useState(!deal);

  useEffect(() => {
    const storeDeal = store.deals.find((d) => d.id === dealId);
    if (storeDeal) {
      setDeal(storeDeal);
      setMessages(store.messages[dealId] || []);
      setProposals(store.proposals[dealId] || []);
      setDeliverables(store.deliverables[dealId] || []);
      setFileVersions(store.fileVersions[dealId] || []);
      setEvents(store.events[dealId] || []);
      setPayments(store.payments[dealId] || []);
      setLoading(false);
      return;
    }

    if (!hasSupabasePublicConfig()) {
      setLoading(false);
      return;
    }

    async function fetchDealData() {
      const supabase = createClient();
      try {
        const { data: dbDeal } = await supabase
          .from('deals')
          .select('*')
          .eq('id', dealId)
          .maybeSingle();

        if (dbDeal) {
          const mappedDeal: Deal = {
            id: dbDeal.id,
            token: dbDeal.token,
            creatorId: dbDeal.creator_id,
            clientId: dbDeal.client_id || '',
            title: dbDeal.title,
            description: dbDeal.description || '',
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
          };
          setDeal(mappedDeal);

          // Fetch messages
          const { data: dbMsgs } = await supabase
            .from('deal_messages')
            .select('*')
            .eq('deal_id', dealId)
            .order('created_at', { ascending: true });
          if (dbMsgs) {
            setMessages(dbMsgs.map((m: any) => ({
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

          // Fetch proposals
          const { data: dbProps } = await supabase
            .from('price_proposals')
            .select('*')
            .eq('deal_id', dealId)
            .order('created_at', { ascending: true });
          if (dbProps) {
            setProposals(dbProps.map((p: any) => ({
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

          // Fetch deliverables
          const { data: dbDelivs } = await supabase
            .from('deliverables')
            .select('*')
            .eq('deal_id', dealId);
          if (dbDelivs) {
            setDeliverables(dbDelivs.map((d: any) => ({
              id: d.id,
              dealId: d.deal_id,
              name: d.name,
              description: d.description,
              status: d.status,
              createdAt: d.created_at,
            })));
          }

          // Fetch file versions
          const { data: dbVersions } = await supabase
            .from('file_versions')
            .select('*')
            .eq('deal_id', dealId)
            .order('version', { ascending: true });
          if (dbVersions) {
            setFileVersions(dbVersions.map((v: any) => ({
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

          // Fetch events
          const { data: dbEvents } = await supabase
            .from('deal_events')
            .select('*')
            .eq('deal_id', dealId)
            .order('created_at', { ascending: false });
          if (dbEvents) {
            setEvents(dbEvents.map((e: any) => ({
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
      } catch (err) {
        console.error('Error fetching deal details', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDealData();
  }, [dealId]);

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
        milestones={[]}
        payments={payments}
        changeRequests={[]}
      />
    </div>
  );
}
