import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCreatorDealAccess } from '@/lib/deal-auth';
import {
  getDealContractWithVersions,
  captureDeliverablesSnapshot,
  captureMilestonesSnapshot,
  isValidContractStatusTransition,
  serializeContract,
  serializeContractVersion,
} from '@/lib/contracts/state';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    const resolution = await requireCreatorDealAccess(code);
    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 403 });
    }

    const deal = resolution.deal;
    const result = await getDealContractWithVersions(deal.id);

    if (!result || !result.contract || !result.currentVersion) {
      return NextResponse.json({ error: 'Contract not found. Please create a draft first.' }, { status: 404 });
    }

    if (!isValidContractStatusTransition(result.contract.status as any, 'sent')) {
      return NextResponse.json(
        { error: `Cannot send contract from status '${result.contract.status}'.` },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Re-capture fresh snapshots from canonical deal data at send time
    const delivSnapshots = await captureDeliverablesSnapshot(deal.id, deal.scope);
    const milestoneSnapshots = await captureMilestonesSnapshot(deal.id);

    // Update current version with fresh snapshots and sent_at
    const { data: updatedVersion } = await admin
      .from('contract_versions')
      .update({
        price_snapshot: deal.price,
        currency_snapshot: deal.currency || 'INR',
        deliverables_snapshot: delivSnapshots,
        milestones_snapshot: milestoneSnapshots,
        sent_at: now,
      })
      .eq('id', result.currentVersion.id)
      .select()
      .single();

    // Transition contract status to 'sent'
    const { data: updatedContract } = await admin
      .from('deal_contracts')
      .update({
        status: 'sent',
        updated_at: now,
      })
      .eq('id', result.contract.id)
      .select()
      .single();

    // Insert timeline audit event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'contract_sent',
      actor_id: deal.creatorId,
      actor_name: resolution.creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Agreement v${result.currentVersion.versionNumber} sent to ${deal.clientName || 'Client'}.`,
    });

    // Insert system message in chat timeline
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'creator',
      type: 'system',
      content: `Agreement v${result.currentVersion.versionNumber} sent by Creator for client review & acceptance.`,
    });

    return NextResponse.json({
      success: true,
      contract: serializeContract(updatedContract),
      currentVersion: serializeContractVersion(updatedVersion),
    });
  } catch (error: any) {
    console.error('Error sending contract:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send contract.' }, { status: 500 });
  }
}
