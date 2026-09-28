import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireClientDealAccess } from '@/lib/deal-auth';
import {
  getDealContractWithVersions,
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

    const clientAuth = await requireClientDealAccess(request, code);
    if (!clientAuth.authorized || !clientAuth.deal) {
      return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
    }

    const deal = clientAuth.deal;
    const body = await request.json();
    const { feedback, versionId } = body;

    if (!feedback || !feedback.trim()) {
      return NextResponse.json({ error: 'Please describe the requested changes.' }, { status: 400 });
    }

    const result = await getDealContractWithVersions(deal.id);
    if (!result || !result.contract || !result.currentVersion) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    if (versionId && versionId !== result.currentVersion.id) {
      return NextResponse.json({ error: 'Cannot request changes on an outdated contract version.' }, { status: 400 });
    }

    if (!isValidContractStatusTransition(result.contract.status as any, 'changes_requested')) {
      return NextResponse.json(
        { error: `Cannot request changes when contract is in status '${result.contract.status}'.` },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const cleanFeedback = feedback.trim();

    // Update version with changes_requested_at & client_feedback
    const { data: updatedVersion } = await admin
      .from('contract_versions')
      .update({
        changes_requested_at: now,
        client_feedback: cleanFeedback,
      })
      .eq('id', result.currentVersion.id)
      .select()
      .single();

    // Transition contract status to 'changes_requested'
    const { data: updatedContract } = await admin
      .from('deal_contracts')
      .update({
        status: 'changes_requested',
        updated_at: now,
      })
      .eq('id', result.contract.id)
      .select()
      .single();

    // Log timeline event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'contract_changes_requested',
      actor_id: clientAuth.clientEmail || 'client',
      actor_name: deal.clientName || 'Client',
      actor_role: 'client',
      description: `${deal.clientName || 'Client'} requested changes to agreement v${result.currentVersion.versionNumber}: "${cleanFeedback}"`,
    });

    // Post system message
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'client',
      type: 'system',
      content: `Client requested agreement revisions: "${cleanFeedback}"`,
    });

    // Notify creator
    await admin.from('notifications').insert({
      user_id: deal.creatorId,
      type: 'contract_changes_requested',
      title: 'Agreement Revisions Requested',
      description: `${deal.clientName} requested changes to agreement v${result.currentVersion.versionNumber}: "${cleanFeedback}"`,
      deal_id: deal.id,
      deal_title: deal.title,
      read: false,
    });

    return NextResponse.json({
      success: true,
      contract: serializeContract(updatedContract),
      currentVersion: serializeContractVersion(updatedVersion),
    });
  } catch (error: any) {
    console.error('Error requesting contract changes:', error);
    return NextResponse.json({ error: error?.message || 'Failed to request changes.' }, { status: 500 });
  }
}
