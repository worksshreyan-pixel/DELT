import { NextResponse } from 'next/server';
import { requireCreatorDealAccess } from '@/lib/deal-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const resolution = await requireCreatorDealAccess(code);

    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 401 });
    }

    const { deal, creator } = resolution;
    const body = await request.json();

    const { title, description, order, dueDate, status } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: milestone, error: milestoneError } = await admin
      .from('milestones')
      .insert({
        deal_id: deal.id,
        title,
        description: description || null,
        order: typeof order === 'number' ? order : 0,
        due_date: dueDate || null,
        status: status || 'pending',
      })
      .select('*')
      .single();

    if (milestoneError || !milestone) {
      console.error('Milestone creation error:', milestoneError);
      return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
    }

    // Log the event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'milestone_created',
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: `Milestone "${title}" was created.`,
      metadata: { milestone_id: milestone.id },
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error: any) {
    console.error('Error in POST /milestones:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
