import { NextResponse } from 'next/server';
import { requireCreatorDealAccess } from '@/lib/deal-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; milestoneId: string }> }
) {
  try {
    const { code, milestoneId } = await params;
    const resolution = await requireCreatorDealAccess(code);

    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 401 });
    }

    const { deal, creator } = resolution;
    const body = await request.json();
    const admin = createAdminClient();

    // Verify milestone belongs to deal
    const { data: existing } = await admin
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('deal_id', deal.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.order !== undefined) updates.order = body.order;
    if (body.dueDate !== undefined) updates.due_date = body.dueDate;
    
    let statusChanged = false;
    if (body.status !== undefined && body.status !== existing.status) {
      updates.status = body.status;
      statusChanged = true;
    }

    const { data: milestone, error: milestoneError } = await admin
      .from('milestones')
      .update(updates)
      .eq('id', milestoneId)
      .eq('deal_id', deal.id)
      .select('*')
      .single();

    if (milestoneError || !milestone) {
      console.error('Milestone update error:', milestoneError);
      return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
    }

    // Log the event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'milestone_updated',
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Milestone "${milestone.title}" was updated.`,
      metadata: { milestone_id: milestone.id, status_changed: statusChanged, new_status: milestone.status },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error: any) {
    console.error('Error in PATCH /milestones/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string; milestoneId: string }> }
) {
  try {
    const { code, milestoneId } = await params;
    const resolution = await requireCreatorDealAccess(code);

    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 401 });
    }

    const { deal, creator } = resolution;
    const admin = createAdminClient();

    // Verify milestone belongs to deal
    const { data: existing } = await admin
      .from('milestones')
      .select('id, title')
      .eq('id', milestoneId)
      .eq('deal_id', deal.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const { error: deleteError } = await admin
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('deal_id', deal.id);

    if (deleteError) {
      console.error('Milestone delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
    }

    // Log the event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'milestone_deleted',
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Milestone "${existing.title}" was deleted.`,
      metadata: { milestone_id: milestoneId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /milestones/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
