import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { serializeDescription } from '@/lib/utils';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal by token
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // 2. Authorize creator
    if (deal.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the creator of this Deal can update it.' }, { status: 403 });
    }

    // 3. Parse and validate updates
    const body = await request.json();
    const { title, description, client_name, client_email, scope, price, currency, deadline, preview_enabled } = body;

    // Check payment status or completion status constraint
    const isPaidOrCompleted = 
      deal.payment_status === 'paid' || 
      deal.payment_status === 'completed' || 
      deal.status === 'completed';

    if (isPaidOrCompleted && price !== undefined && Number(price) !== Number(deal.price)) {
      return NextResponse.json(
        { error: 'Cannot change the price of a deal that has already been paid or completed.' },
        { status: 400 }
      );
    }

    // Validate price if specified
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      return NextResponse.json({ error: 'Price must be a positive number.' }, { status: 400 });
    }

    // 4. Construct updates
    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined || preview_enabled !== undefined) {
      const desc = description !== undefined ? description : deal.description || '';
      const prevEnabled = preview_enabled !== undefined ? preview_enabled : (deal.preview_enabled || false);
      updates.description = serializeDescription(desc.trim() || null, prevEnabled);
      updates.preview_enabled = prevEnabled;
    }
    if (client_name !== undefined) updates.client_name = client_name.trim();
    if (client_email !== undefined) updates.client_email = client_email.trim().toLowerCase();
    if (scope !== undefined) {
      updates.scope = Array.isArray(scope) ? scope : [scope];
    }
    if (price !== undefined) updates.price = price;
    if (currency !== undefined) updates.currency = currency;
    if (deadline !== undefined) updates.deadline = deadline || null;

    updates.updated_at = new Date().toISOString();
    updates.last_activity_at = new Date().toISOString();

    // 5. Apply updates
    const { data: updatedDeal, error: updateError } = await admin
      .from('deals')
      .update(updates)
      .eq('id', deal.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 6. Create timeline event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'message_sent',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: `Deal details updated by creator.`,
    });

    // Also insert a system message in the chat
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'creator',
      type: 'system',
      content: `Deal details have been updated by the creator.`,
    });

    return NextResponse.json({
      success: true,
      deal: updatedDeal,
    });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
