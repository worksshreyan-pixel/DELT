import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireClientDealAccess } from '@/lib/deal-auth';
import {
  getDealContractWithVersions,
  isValidContractStatusTransition,
  serializeContract,
  serializeContractVersion,
  AcceptanceMetadata,
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
    const body = await request.json().catch(() => ({}));
    const { versionId } = body;

    const result = await getDealContractWithVersions(deal.id);
    if (!result || !result.contract || !result.currentVersion) {
      return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
    }

    // Stale version check: versionId passed must match the current active version
    if (versionId && versionId !== result.currentVersion.id) {
      return NextResponse.json(
        { error: 'Cannot accept an outdated agreement version. A newer version exists.' },
        { status: 400 }
      );
    }

    // Idempotent check: if already accepted, return success
    if (result.contract.status === 'accepted' && result.currentVersion.acceptedAt) {
      return NextResponse.json({
        success: true,
        contract: result.contract,
        currentVersion: result.currentVersion,
        idempotent: true,
      });
    }

    if (!isValidContractStatusTransition(result.contract.status as any, 'accepted')) {
      return NextResponse.json(
        { error: `Cannot accept contract when status is '${result.contract.status}'.` },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Extract request IP and user agent for audit record
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    const metadata: AcceptanceMetadata = {
      acceptedByEmail: clientAuth.clientEmail,
      clientName: deal.clientName || 'Client',
      ipAddress: clientIp,
      userAgent,
      dealId: deal.id,
      contractId: result.contract.id,
      versionId: result.currentVersion.id,
      versionNumber: result.currentVersion.versionNumber,
      acceptedAt: now,
    };

    // Atomic update of current contract version with immutable acceptance record
    const { data: acceptedVersion, error: vErr } = await admin
      .from('contract_versions')
      .update({
        accepted_at: now,
        acceptance_metadata: metadata,
      })
      .eq('id', result.currentVersion.id)
      .is('accepted_at', null)
      .select()
      .maybeSingle();

    if (vErr) {
      return NextResponse.json({ error: vErr?.message || 'Failed to record acceptance.' }, { status: 500 });
    }

    if (!acceptedVersion) {
      // Re-fetch contract/version to check if it was accepted concurrently
      const recheck = await getDealContractWithVersions(deal.id);
      if (recheck?.contract?.status === 'accepted' && recheck?.currentVersion?.acceptedAt) {
        return NextResponse.json({
          success: true,
          contract: recheck.contract,
          currentVersion: recheck.currentVersion,
          idempotent: true,
        });
      }
      return NextResponse.json({ error: 'Contract state was modified concurrently or already accepted.' }, { status: 400 });
    }

    // Transition contract status to 'accepted'
    const { data: acceptedContract } = await admin
      .from('deal_contracts')
      .update({
        status: 'accepted',
        updated_at: now,
      })
      .eq('id', result.contract.id)
      .in('status', ['sent', 'viewed'])
      .select()
      .maybeSingle();

    // Insert timeline audit event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'contract_accepted',
      actor_id: clientAuth.clientEmail,
      actor_name: deal.clientName || 'Client',
      actor_role: 'client',
      description: `${deal.clientName || 'Client'} accepted Agreement v${result.currentVersion.versionNumber}.`,
      metadata,
    });

    // Insert system message in chat
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'client',
      type: 'system',
      content: `Agreement v${result.currentVersion.versionNumber} formally accepted by ${deal.clientName || 'Client'}. Acceptance record locked.`,
    });

    // Notify creator
    await admin.from('notifications').insert({
      user_id: deal.creatorId,
      type: 'contract_accepted',
      title: 'Agreement Accepted!',
      description: `${deal.clientName} formally accepted agreement v${result.currentVersion.versionNumber} for "${deal.title}"`,
      deal_id: deal.id,
      deal_title: deal.title,
      read: false,
    });

    return NextResponse.json({
      success: true,
      contract: serializeContract(acceptedContract || result.contract),
      currentVersion: serializeContractVersion(acceptedVersion),
    });
  } catch (error: any) {
    console.error('Error accepting contract:', error);
    return NextResponse.json({ error: error?.message || 'Failed to accept contract.' }, { status: 500 });
  }
}
