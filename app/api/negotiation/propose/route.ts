import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, proposedPrice, reason, proposedByRole, proposedByName, proposedById, parentProposalId } = body;

    if (!dealId || !proposedPrice || Number(proposedPrice) <= 0) {
      return NextResponse.json({ error: 'Valid proposed price is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch deal
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const priceNum = Number(proposedPrice);
    const direction = proposedByRole === 'creator' ? 'creator_to_client' : 'client_to_creator';

    // 1. Create immutable proposal record
    const { data: proposal, error: propError } = await admin
      .from('price_proposals')
      .insert({
        deal_id: deal.id,
        direction,
        previous_price: deal.price,
        proposed_price: priceNum,
        reason: reason?.trim() || null,
        state: 'pending',
        counter_proposal_id: parentProposalId || null,
        proposed_by: proposedById || 'participant',
        proposed_by_name: proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client'),
        proposed_by_role: proposedByRole,
      })
      .select()
      .single();

    if (propError || !proposal) {
      return NextResponse.json({ error: propError?.message || 'Failed to submit proposal' }, { status: 500 });
    }

    // 2. Update Deal status to negotiating
    await admin
      .from('deals')
      .update({
        status: 'negotiating',
        updated_at: now,
        last_activity_at: now,
      })
      .eq('id', deal.id);

    // 3. Post proposal message in deal_messages
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: proposedById || 'participant',
      sender_name: proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client'),
      sender_role: proposedByRole,
      type: 'proposal',
      content: `${proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client')} proposed price change to ${priceNum} ${deal.currency}`,
      proposal_id: proposal.id,
    });

    // 4. Create timeline audit event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'price_proposed',
      actor_id: proposedById || 'participant',
      actor_name: proposedByName,
      actor_role: proposedByRole,
      description: `${proposedByName} proposed price change to ${priceNum} ${deal.currency}`,
    });

    // 5. Send notification to creator if proposed by client
    if (proposedByRole === 'client') {
      await admin.from('notifications').insert({
        user_id: deal.creator_id,
        type: 'new_proposal',
        title: 'New Price Proposal',
        description: `${deal.client_name} proposed ${priceNum} ${deal.currency} for "${deal.title}"`,
        deal_id: deal.id,
        deal_title: deal.title,
        read: false,
      });
    }

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error('Error submitting price proposal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
