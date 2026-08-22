import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check client session token from header
    const clientSessionHeader = request.headers.get('x-client-session-token');
    const { verifyClientSessionToken } = await import('@/lib/otp');
    const hasValidClientToken = clientSessionHeader && deal.token
      ? verifyClientSessionToken(clientSessionHeader, deal.token, deal.client_email)
      : false;

    const isCreator = user && user.id === deal.creator_id;
    const isClient = (user && user.email?.toLowerCase() === deal.client_email?.toLowerCase()) || hasValidClientToken;

    if (proposedByRole === 'client') {
      if (isCreator) {
        return NextResponse.json({ error: 'Creators cannot propose prices as client.' }, { status: 403 });
      }
      if (!isClient) {
        return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
      }
    } else if (proposedByRole === 'creator') {
      if (!isCreator) {
        return NextResponse.json({ error: 'Unauthorized creator access.' }, { status: 403 });
      }
    }

    // Concurrency Check: Check for active pending proposals for this deal
    const { data: existingPending, error: existError } = await admin
      .from('price_proposals')
      .select('id, state, direction')
      .eq('deal_id', deal.id)
      .eq('state', 'pending');

    if (existError) {
      return NextResponse.json({ error: 'Database verification failed' }, { status: 500 });
    }

    if (existingPending && existingPending.length > 0) {
      if (parentProposalId) {
        const matchesParent = existingPending.some((p) => p.id === parentProposalId);
        if (!matchesParent) {
          return NextResponse.json({ error: 'The proposal you are countering is no longer pending.' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'There is already an active price proposal. Please respond or counter it.' }, { status: 400 });
      }
    } else if (parentProposalId) {
      return NextResponse.json({ error: 'The proposal you are countering has already been resolved.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const priceNum = Number(proposedPrice);
    const direction = proposedByRole === 'creator' ? 'creator_to_client' : 'client_to_creator';

    let prevPrice = deal.price;
    if (parentProposalId) {
      const { data: parentProposal } = await admin
        .from('price_proposals')
        .select('proposed_price')
        .eq('id', parentProposalId)
        .maybeSingle();

      if (parentProposal) {
        prevPrice = Number(parentProposal.proposed_price);
      }
    }

    // 1. Create immutable proposal record
    const { data: proposal, error: propError } = await admin
      .from('price_proposals')
      .insert({
        deal_id: deal.id,
        direction,
        previous_price: prevPrice,
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

    // 1.5 Update parent proposal state to countered
    if (parentProposalId) {
      await admin
        .from('price_proposals')
        .update({
          state: 'countered',
          resolved_at: now,
        })
        .eq('id', parentProposalId);
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
