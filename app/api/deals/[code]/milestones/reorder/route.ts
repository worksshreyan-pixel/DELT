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
      return NextResponse.json({ error: resolution.error || 'Unauthorized.' }, { status: 403 });
    }

    const { deal, creator } = resolution;
    const body = await request.json();
    
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Valid items array is required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify all item IDs belong strictly to this deal (IDOR protection)
    const itemIds = items.map((i: any) => i.id).filter(Boolean);
    const { data: validMilestones } = await admin
      .from('milestones')
      .select('id')
      .eq('deal_id', deal.id)
      .in('id', itemIds);

    const validIdSet = new Set((validMilestones || []).map((m: any) => m.id));
    if (validIdSet.size !== itemIds.length) {
      return NextResponse.json(
        { error: 'One or more milestone IDs do not belong to this deal.' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const updates = items.map(async (item: any) => {
      if (item.id && typeof item.order === 'number') {
        return admin
          .from('milestones')
          .update({ order: item.order, updated_at: now })
          .eq('id', item.id)
          .eq('deal_id', deal.id);
      }
    });

    await Promise.all(updates);

    // Log the event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'milestone_reordered',
      actor_id: creator?.email,
      actor_name: creator?.display_name || 'Creator',
      actor_role: 'creator',
      description: 'Milestones reordered.',
      metadata: { count: items.length },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /milestones/reorder:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
