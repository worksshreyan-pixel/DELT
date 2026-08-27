'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DealSettings } from '@/components/deal-settings';
import { Breadcrumb } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { FolderKanban } from 'lucide-react';
import { useAppStore } from '@/lib/app-store';
import { createClient } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/env';
import { parseDescription } from '@/lib/utils';
import type { Deal, Deliverable, FileVersion, Payment } from '@/lib/types';

export default function DealSettingsPage() {
  const params = useParams();
  const routeParam = params.id as string;
  const store = useAppStore();

  const [deal, setDeal] = useState<Deal | null>(() => store.deals.find((d) => d.id === routeParam || d.dealCode === routeParam) || null);
  
  const actualDealId = deal?.id || routeParam;

  const [deliverables, setDeliverables] = useState<Deliverable[]>(() => store.deliverables[actualDealId] || []);
  const [fileVersions, setFileVersions] = useState<FileVersion[]>(() => store.fileVersions[actualDealId] || []);
  const [payments, setPayments] = useState<Payment[]>(() => store.payments[actualDealId] || []);
  const [loading, setLoading] = useState(!deal);

  useEffect(() => {
    const storeDeal = store.deals.find((d) => d.id === routeParam || d.dealCode === routeParam);
    if (storeDeal) {
      setDeal(storeDeal);
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
              progress: Number(dbDeal.progress || 0),
              paymentStatus: dbDeal.payment_status || 'pending',
              lastActivityAt: dbDeal.last_activity_at || dbDeal.created_at,
              createdAt: dbDeal.created_at,
              updatedAt: dbDeal.updated_at,
              previewEnabled: parseDescription(dbDeal.description).previewEnabled,
            };
            setDeal(currentDeal);
          }
        }

        if (currentDeal) {
          const fetchedId = currentDeal.id;
          const [dbDelivs, dbVersions, dbPayments] = await Promise.all([
            supabase.from('deliverables').select('*').eq('deal_id', fetchedId),
            supabase.from('file_versions').select('*').eq('deal_id', fetchedId).order('version', { ascending: true }),
            supabase.from('payments').select('*').eq('deal_id', fetchedId).order('created_at', { ascending: true })
          ]);

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
              dealId: v.deal_id || actualDealId,
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

          if (dbPayments.data) {
            setPayments(dbPayments.data.map((p: any) => ({
              id: p.id,
              dealId: p.deal_id,
              clientId: p.client_id || '',
              clientName: p.client_name,
              dealTitle: p.deal_title,
              amount: Number(p.amount),
              currency: p.currency,
              platformFee: Number(p.platform_fee),
              processingFee: Number(p.processing_fee),
              creatorNet: Number(p.creator_net),
              state: p.state,
              method: p.method,
              createdAt: p.created_at,
              completedAt: p.completed_at,
            })));
          }
        }
      } catch (err) {
        console.error('Error fetching deal details for settings', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDealData();
  }, [actualDealId, store.deals, store.payments]);

  if (loading) {
    return (
      <div className="py-16 text-center space-y-2">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading deal settings...</p>
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
      <Breadcrumb items={[
        { label: 'Deals', href: '/deals' },
        { label: deal.title, href: `/deals/${deal.id}` },
        { label: 'Settings' }
      ]} />
      <DealSettings
        deal={deal}
        clientName={clientName}
        clientEmail={(deal as any).client_email || (deal as any).clientEmail || ''}
        clientCompany={clientCompany}
        creatorName={store.user.displayName || 'Creator'}
        deliverables={deliverables}
        fileVersions={fileVersions}
        payments={payments}
      />
    </div>
  );
}
