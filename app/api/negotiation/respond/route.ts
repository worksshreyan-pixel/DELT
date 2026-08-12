import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, dealId, response, responderName, responderRole } = body;

    if (!proposalId || !dealId || !['accept', 'decline'].includes(response)) {
      return NextResponse.json({ error: 'Invalid proposal response data' }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    // 1. Fetch proposal
    const { data: proposal, error: propError } = await admin
      .from('price_proposals')
      .select('*')
      .eq('id', proposalId)
      .maybeSingle();

    if (propError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.state !== 'pending') {
      return NextResponse.json({ error: 'Proposal has already been resolved' }, { status: 400 });
    }

    // 2. Fetch deal
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // 3. Update proposal state
    const newState = response === 'accept' ? 'accepted' : 'declined';
    await admin
      .from('price_proposals')
      .update({
        state: newState,
        resolved_at: now,
      })
      .eq('id', proposal.id);

    if (response === 'accept') {
      // 4. Update deal authoritative agreed price
      await admin
        .from('deals')
        .update({
          price: proposal.proposed_price,
          status: 'agreed',
          updated_at: now,
          last_activity_at: now,
        })
        .eq('id', deal.id);

      // 5. Audit event
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'price_accepted',
        actor_name: responderName,
        actor_role: responderRole,
        description: `Price proposal of ${proposal.proposed_price} ${deal.currency} accepted by ${responderName}.`,
      });

      // 6. System message
      await admin.from('deal_messages').insert({
        deal_id: deal.id,
        sender_id: 'system',
        sender_name: 'DELT System',
        sender_role: 'creator',
        type: 'system',
        content: `Price agreement established at ${proposal.proposed_price} ${deal.currency}`,
      });
    } else {
      // Declined
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'price_declined',
        actor_name: responderName,
        actor_role: responderRole,
        description: `Price proposal of ${proposal.proposed_price} ${deal.currency} declined by ${responderName}.`,
      });

      await admin.from('deal_messages').insert({
        deal_id: deal.id,
        sender_id: 'system',
        sender_name: 'DELT System',
        sender_role: 'creator',
        type: 'system',
        content: `Price proposal of ${proposal.proposed_price} ${deal.currency} declined.`,
      });
    }

    return NextResponse.json({ success: true, state: newState });
  } catch (error: any) {
    console.error('Error responding to price proposal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
