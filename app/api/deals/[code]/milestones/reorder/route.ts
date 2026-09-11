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

    const { deal } = resolution;
    const body = await request.json();
    
    // items should be an array of { id: string, order: number }
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Since Supabase doesn't easily support bulk updates via JS client with different values per row,
    // we'll loop through and do updates. In a very high-traffic app we might use an RPC,
    // but for reordering 5-10 milestones this is perfectly fine.
    
    const updates = items.map(async (item: any) => {
      if (item.id && typeof item.order === 'number') {
        return admin
          .from('milestones')
          .update({ order: item.order, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('deal_id', deal.id);
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /milestones/reorder:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
