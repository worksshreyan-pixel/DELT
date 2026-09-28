import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCreatorDealAccess } from '@/lib/deal-auth';
import {
  getDealContractWithVersions,
  captureDeliverablesSnapshot,
  captureMilestonesSnapshot,
  getDefaultContractTerms,
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
    const body = await request.json().catch(() => ({}));
    const { title, termsContent } = body;

    const result = await getDealContractWithVersions(deal.id);
    if (!result || !result.contract) {
      return NextResponse.json({ error: 'Contract not found. Please create a contract first.' }, { status: 404 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Determine next version number using max existing version
    const maxVersionNum = result.versions.reduce((max, v) => Math.max(max, v.versionNumber || 1), 0);
    const nextVersionNum = maxVersionNum + 1;

    // Clean up obsolete unaccepted draft versions before creating new version.
    // Preserves all historical accepted versions (where accepted_at is NOT null).
    await admin
      .from('contract_versions')
      .delete()
      .eq('contract_id', result.contract.id)
      .is('accepted_at', null);

    // Capture fresh snapshots from live deal data for new version
    const delivSnapshots = await captureDeliverablesSnapshot(deal.id, deal.scope);
    const milestoneSnapshots = await captureMilestonesSnapshot(deal.id);

    const versionTitle = (title && title.trim()) || result.currentVersion?.title || `${deal.title} — Service Agreement`;
    const versionTerms = (termsContent && termsContent.trim()) || result.currentVersion?.termsContent || getDefaultContractTerms(deal.title, deal.clientName);

    // Create new version row
    const { data: newVersion, error: vErr } = await admin
      .from('contract_versions')
      .insert({
        contract_id: result.contract.id,
        deal_id: deal.id,
        version_number: nextVersionNum,
        title: versionTitle,
        terms_content: versionTerms,
        price_snapshot: deal.price,
        currency_snapshot: deal.currency || 'INR',
        deliverables_snapshot: delivSnapshots,
        milestones_snapshot: milestoneSnapshots,
        created_by: deal.creatorId,
      })
      .select()
      .single();

    if (vErr || !newVersion) {
      return NextResponse.json({ error: vErr?.message || 'Failed to create new contract version.' }, { status: 500 });
    }

    // Point contract to new version and reset status to 'draft'
    const { data: updatedContract } = await admin
      .from('deal_contracts')
      .update({
        current_version_id: newVersion.id,
        status: 'draft',
        updated_at: now,
      })
      .eq('id', result.contract.id)
      .select()
      .single();

    // Log audit event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'contract_version_created',
      actor_id: deal.creatorId,
      actor_name: resolution.creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `New draft agreement v${nextVersionNum} created by creator.`,
    });

    return NextResponse.json({
      success: true,
      contract: serializeContract(updatedContract),
      currentVersion: serializeContractVersion(newVersion),
    });
  } catch (error: any) {
    console.error('Error creating new contract version:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create new version.' }, { status: 500 });
  }
}
