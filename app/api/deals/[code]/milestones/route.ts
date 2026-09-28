import { NextResponse } from 'next/server';
import { requireCreatorDealAccess, requireClientDealAccess } from '@/lib/deal-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    // Try creator access first, fallback to client access
    let dealId: string | null = null;
    const creatorRes = await requireCreatorDealAccess(code);
    if (creatorRes.authorized && creatorRes.deal) {
      dealId = creatorRes.deal.id;
    } else {
      const clientRes = await requireClientDealAccess(request, code);
      if (clientRes.authorized && clientRes.deal) {
        dealId = clientRes.deal.id;
      }
    }

    if (!dealId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: milestones, error } = await admin
      .from('milestones')
      .select('*')
      .eq('deal_id', dealId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return NextResponse.json({ error: 'Failed to fetch milestones.' }, { status: 500 });
    }

    const formattedMilestones = (milestones || []).map((m: any) => ({
      id: m.id,
      dealId: m.deal_id,
      title: m.title,
      description: m.description,
      order: m.order,
      dueDate: m.due_date,
      status: m.status,
      completedAt: m.completed_at,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return NextResponse.json({ success: true, milestones: formattedMilestones });
  } catch (error: any) {
    console.error('Error in GET /milestones:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const resolution = await requireCreatorDealAccess(code);

    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized.' }, { status: 403 });
    }

    const { deal, creator } = resolution;
    const body = await request.json();

    const { title, description, order, dueDate, status } = body;

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) {
      return NextResponse.json({ error: 'Milestone title is required.' }, { status: 400 });
    }

    const validStatus = (status && ['pending', 'in_progress', 'completed'].includes(status))
      ? status
      : 'pending';

    const admin = createAdminClient();

    // Calculate order if not provided
    let targetOrder = typeof order === 'number' ? order : 0;
    if (order === undefined) {
      const { data: existing } = await admin
        .from('milestones')
        .select('order')
        .eq('deal_id', deal.id)
        .order('order', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        targetOrder = (existing[0].order || 0) + 1;
      }
    }

    const now = new Date().toISOString();
    const { data: milestone, error: milestoneError } = await admin
      .from('milestones')
      .insert({
        deal_id: deal.id,
        title: cleanTitle,
        description: typeof description === 'string' ? description.trim() || null : null,
        order: targetOrder,
        due_date: dueDate || null,
        status: validStatus,
        completed_at: validStatus === 'completed' ? now : null,
      })
      .select('*')
      .single();

    if (milestoneError || !milestone) {
      console.error('Milestone creation error:', milestoneError);
      return NextResponse.json({ error: 'Failed to create milestone.' }, { status: 500 });
    }

    // Log the event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'milestone_created',
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Milestone "${cleanTitle}" created.`,
      metadata: { milestone_id: milestone.id, status: validStatus },
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
    console.error('Error in POST /milestones:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
