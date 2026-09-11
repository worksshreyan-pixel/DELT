import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireClientDealAccess } from '@/lib/deal-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, dealCode, deliverableId, action, feedback, clientName } = body;

    if (!dealId || !dealCode || !deliverableId || !action || !['approve', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: 'Invalid approval payload' }, { status: 400 });
    }

    const resolution = await requireClientDealAccess(request, dealCode);
    if (!resolution.authorized) {
      return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
    }
    
    const deal = resolution.deal;
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }
    if (deal.id !== dealId) {
       return NextResponse.json({ error: 'Deal ID mismatch.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { data: deliverable } = await admin
      .from('deliverables')
      .select('*')
      .eq('id', deliverableId)
      .eq('deal_id', dealId)
      .maybeSingle();

    if (!deliverable) {
      return NextResponse.json({ error: 'Deliverable not found' }, { status: 404 });
    }

    const { data: latestVersion } = await admin
      .from('file_versions')
      .select('id, status')
      .eq('deliverable_id', deliverableId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestVersion) {
      return NextResponse.json({ error: 'Cannot review a deliverable with no submitted files.' }, { status: 400 });
    }

    if (latestVersion.status !== 'pending_review') {
      return NextResponse.json({ error: 'Cannot review a deliverable that is not currently pending review.' }, { status: 400 });
    }

    if (action === 'approve') {
      await admin
        .from('deliverables')
        .update({
          status: 'approved',
          approved_at: now,
        })
        .eq('id', deliverableId);

      await admin
        .from('file_versions')
        .update({
          status: 'approved',
          reviewed_at: now,
          locked: false,
        })
        .eq('id', latestVersion.id);

      await admin.from('deal_events').insert({
        deal_id: dealId,
        type: 'deliverable_approved',
        actor_name: clientName || deal.clientName,
        actor_role: 'client',
        description: `${clientName || deal.clientName} approved deliverables.`,
      });

      await admin.from('deal_messages').insert({
        deal_id: dealId,
        sender_id: 'client',
        sender_name: clientName || deal.clientName,
        sender_role: 'client',
        type: 'approval',
        content: `Approved deliverable files.`,
      });

      await admin.from('notifications').insert({
        user_id: deal.creatorId,
        type: 'deliverable_approved',
        title: 'Deliverable Approved',
        description: `${deal.clientName} approved deliverables for "${deal.title}"`,
        deal_id: deal.id,
        deal_title: deal.title,
        read: false,
      });
    } else {
      // Request changes
      await admin
        .from('deliverables')
        .update({
          status: 'changes_requested',
        })
        .eq('id', deliverableId);

      await admin
        .from('file_versions')
        .update({
          status: 'changes_requested',
          client_feedback: feedback || 'Changes requested',
          reviewed_at: now,
        })
        .eq('id', latestVersion.id);

      await admin.from('deal_events').insert({
        deal_id: dealId,
        type: 'change_requested',
        actor_name: clientName || deal.clientName,
        actor_role: 'client',
        description: `${clientName || deal.clientName} requested changes: "${feedback || 'Revisions needed'}"`,
      });

      await admin.from('deal_messages').insert({
        deal_id: dealId,
        sender_id: 'client',
        sender_name: clientName || deal.clientName,
        sender_role: 'client',
        type: 'change_request',
        content: `Change request: ${feedback || 'Please review changes.'}`,
      });

      await admin.from('notifications').insert({
        user_id: deal.creatorId,
        type: 'change_request',
        title: 'Change Requested',
        description: `${deal.clientName} requested changes on "${deal.title}": ${feedback || ''}`,
        deal_id: deal.id,
        deal_title: deal.title,
        read: false,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in deliverable approval route:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
