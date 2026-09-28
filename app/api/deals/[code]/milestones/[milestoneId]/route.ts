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
      return NextResponse.json({ error: resolution.error || 'Unauthorized.' }, { status: 403 });
    }

    const { deal, creator } = resolution;
    const body = await request.json();
    const admin = createAdminClient();

    // Verify milestone belongs strictly to this deal (IDOR protection)
    const { data: existing } = await admin
      .from('milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('deal_id', deal.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: any = { updated_at: now };

    if (body.title !== undefined) {
      const cleanTitle = typeof body.title === 'string' ? body.title.trim() : '';
      if (!cleanTitle) {
        return NextResponse.json({ error: 'Title cannot be empty.' }, { status: 400 });
      }
      updates.title = cleanTitle;
    }

    if (body.description !== undefined) {
      updates.description = typeof body.description === 'string' ? body.description.trim() || null : null;
    }

    if (body.order !== undefined) {
      if (typeof body.order !== 'number' || body.order < 0) {
        return NextResponse.json({ error: 'Order must be a non-negative integer.' }, { status: 400 });
      }
      updates.order = body.order;
    }

    if (body.dueDate !== undefined) {
      updates.due_date = body.dueDate || null;
    }

    let statusChanged = false;
    let isCompletedTransition = false;

    if (body.status !== undefined && body.status !== existing.status) {
      if (!['pending', 'in_progress', 'completed'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid milestone status. Allowed values are pending, in_progress, completed.' },
          { status: 400 }
        );
      }
      updates.status = body.status;
      statusChanged = true;

      if (body.status === 'completed') {
        updates.completed_at = now;
        isCompletedTransition = true;
      } else {
        updates.completed_at = null;
      }
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
      return NextResponse.json({ error: 'Failed to update milestone.' }, { status: 500 });
    }

    // Log event
    const eventType = isCompletedTransition ? 'milestone_completed' : 'milestone_updated';
    const eventDesc = isCompletedTransition
      ? `Milestone "${milestone.title}" completed.`
      : `Milestone "${milestone.title}" updated.`;

    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: eventType,
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: eventDesc,
      metadata: {
        milestone_id: milestone.id,
        status_changed: statusChanged,
        new_status: milestone.status,
      },
    });

    const formatted = {
      id: milestone.id,
      dealId: milestone.deal_id,
      title: milestone.title,
      description: milestone.description,
      order: milestone.order,
      dueDate: milestone.due_date,
      status: milestone.status,
      completedAt: milestone.completed_at,
      createdAt: milestone.created_at,
      updatedAt: milestone.updated_at,
    };

    return NextResponse.json({ success: true, milestone: formatted });
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
      return NextResponse.json({ error: resolution.error || 'Unauthorized.' }, { status: 403 });
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
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }

    const { error: deleteError } = await admin
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('deal_id', deal.id);

    if (deleteError) {
      console.error('Milestone delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete milestone.' }, { status: 500 });
    }

    // Log the event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'milestone_deleted',
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Milestone "${existing.title}" deleted.`,
      metadata: { milestone_id: milestoneId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /milestones/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
