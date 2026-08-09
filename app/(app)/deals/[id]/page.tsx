'use client';

import { useParams, useRouter } from 'next/navigation';
import { DealWorkspace } from '@/components/deal-workspace';
import { Breadcrumb } from '@/components/app-shell';
import { EmptyState } from '@/components/empty-state';
import { FolderKanban } from 'lucide-react';
import {
  getDealById,
  getClientById,
  getMessagesByDeal,
  getProposalsByDeal,
  getEventsByDeal,
  getDeliverablesByDeal,
  getFileVersionsByDeal,
  getMilestonesByDeal,
  getPaymentsByDeal,
  getChangeRequestsByDeal,
  CURRENT_USER,
} from '@/lib/demo-data';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  const deal = getDealById(dealId);

  if (!deal) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Deal not found"
        description="This deal may have been deleted or the link is incorrect."
        actionLabel="Back to Deals"
        actionHref="/deals"
      />
    );
  }

  const client = getClientById(deal.clientId);
  const messages = getMessagesByDeal(deal.id);
  const proposals = getProposalsByDeal(deal.id);
  const events = getEventsByDeal(deal.id);
  const deliverables = getDeliverablesByDeal(deal.id);
  const fileVersions = getFileVersionsByDeal(deal.id);
  const milestones = getMilestonesByDeal(deal.id);
  const payments = getPaymentsByDeal(deal.id);
  const changeRequests = getChangeRequestsByDeal(deal.id);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: deal.title }]} />
      <DealWorkspace
        deal={deal}
        clientName={client?.name || 'Unknown'}
        clientCompany={client?.company}
        creatorName={CURRENT_USER.displayName}
        messages={messages}
        proposals={proposals}
        events={events}
        deliverables={deliverables}
        fileVersions={fileVersions}
        milestones={milestones}
        payments={payments}
        changeRequests={changeRequests}
      />
    </div>
  );
}
