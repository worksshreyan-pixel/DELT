import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireCreatorDealAccess, requireClientDealAccess } from '@/lib/deal-auth';
import {
  getDealContractWithVersions,
  captureDeliverablesSnapshot,
  captureMilestonesSnapshot,
  getDefaultContractTerms,
  serializeContract,
  serializeContractVersion,
} from '@/lib/contracts/state';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    // Check Creator or Client authorization
    const creatorAuth = await requireCreatorDealAccess(code);
    const clientAuth = !creatorAuth.authorized ? await requireClientDealAccess(request, code) : null;

    const authorized = Boolean(creatorAuth.authorized || clientAuth?.authorized);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized deal access.' }, { status: 403 });
    }

    const deal = creatorAuth.authorized ? creatorAuth.deal : clientAuth?.deal;
    const isCreator = Boolean(creatorAuth.authorized);

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    const result = await getDealContractWithVersions(deal.id);
    const admin = createAdminClient();

    // If client opens for the first time while status is 'sent', transition -> 'viewed'
    if (!isCreator && result?.contract && result.contract.status === 'sent' && result.currentVersion) {
      const now = new Date().toISOString();

      await admin
        .from('deal_contracts')
        .update({ status: 'viewed', updated_at: now })
        .eq('id', result.contract.id);

      await admin
        .from('contract_versions')
        .update({ viewed_at: now })
        .eq('id', result.currentVersion.id);

      result.contract.status = 'viewed';
      if (result.currentVersion) {
        result.currentVersion.viewedAt = now;
      }

      // Log event and notify creator
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'contract_viewed',
        actor_id: clientAuth?.clientEmail || 'client',
        actor_name: deal.clientName || 'Client',
        actor_role: 'client',
        description: `${deal.clientName || 'Client'} viewed the agreement (v${result.currentVersion.versionNumber}).`,
      });

      await admin.from('notifications').insert({
        user_id: deal.creatorId,
        type: 'contract_viewed',
        title: 'Agreement Viewed',
        description: `${deal.clientName} viewed agreement v${result.currentVersion.versionNumber} for "${deal.title}"`,
        deal_id: deal.id,
        deal_title: deal.title,
        read: false,
      });
    }

    return NextResponse.json({
      success: true,
      contract: result?.contract || null,
      versions: result?.versions || [],
      currentVersion: result?.currentVersion || null,
      isCreator,
    });
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch contract.' }, { status: 500 });
  }
}

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
    const admin = createAdminClient();

    // Check if contract already exists
    let existing = await getDealContractWithVersions(deal.id);
    if (existing?.contract) {
      return NextResponse.json({
        success: true,
        contract: existing.contract,
        versions: existing.versions,
        currentVersion: existing.currentVersion,
      });
    }

    // Capture initial snapshots from canonical deal data
    const delivSnapshots = await captureDeliverablesSnapshot(deal.id, deal.scope);
    const milestoneSnapshots = await captureMilestonesSnapshot(deal.id);
    const defaultTerms = getDefaultContractTerms(deal.title, deal.clientName);

    // Create contract row
    const { data: newContract, error: cErr } = await admin
      .from('deal_contracts')
      .insert({
        deal_id: deal.id,
        status: 'draft',
      })
      .select()
      .single();

    if (cErr || !newContract) {
      return NextResponse.json({ error: cErr?.message || 'Failed to create contract.' }, { status: 500 });
    }

    // Create initial version 1 row
    const { data: newVersion, error: vErr } = await admin
      .from('contract_versions')
      .insert({
        contract_id: newContract.id,
        deal_id: deal.id,
        version_number: 1,
        title: `${deal.title} — Service Agreement`,
        terms_content: defaultTerms,
        price_snapshot: deal.price,
        currency_snapshot: deal.currency || 'INR',
        deliverables_snapshot: delivSnapshots,
        milestones_snapshot: milestoneSnapshots,
        created_by: deal.creatorId,
      })
      .select()
      .single();

    if (vErr || !newVersion) {
      return NextResponse.json({ error: vErr?.message || 'Failed to create contract version.' }, { status: 500 });
    }

    // Point current_version_id to initial version
    await admin
      .from('deal_contracts')
      .update({ current_version_id: newVersion.id })
      .eq('id', newContract.id);

    newContract.current_version_id = newVersion.id;

    // Log audit event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'contract_created',
      actor_id: deal.creatorId,
      actor_name: resolution.creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Draft agreement initialized by creator.`,
    });

    const contractData = serializeContract(newContract);
    const versionData = serializeContractVersion(newVersion);

    return NextResponse.json({
      success: true,
      contract: contractData,
      versions: [versionData],
      currentVersion: versionData,
    });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create contract.' }, { status: 500 });
  }
}
