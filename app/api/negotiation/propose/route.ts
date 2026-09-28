import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveDealByCode, requireCreatorDealAccess, requireClientDealAccess } from '@/lib/deal-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, proposedPrice, reason, proposedByRole, proposedByName, proposedById, parentProposalId } = body;

    if (!dealId || !proposedPrice || Number(proposedPrice) <= 0) {
      return NextResponse.json({ error: 'Valid proposed price is required' }, { status: 400 });
    }

    // 1. Canonical deal identity resolution (supports deal.id UUID, deal_code, or token)
    const resolution = await resolveDealByCode(dealId);
    if (!resolution || !resolution.deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = resolution.deal;
    const admin = createAdminClient();

    // 2. Agreement status check: Negotiation closed once agreement is accepted
    const { data: acceptedContract } = await admin
      .from('deal_contracts')
      .select('id, status')
      .eq('deal_id', deal.id)
      .eq('status', 'accepted')
      .maybeSingle();

    if (acceptedContract) {
      return NextResponse.json(
        { error: 'Negotiation is closed because the agreement has already been accepted.' },
        { status: 400 }
      );
    }

    // 3. Robust role-based access authorization
    if (proposedByRole === 'client') {
      const clientAuth = await requireClientDealAccess(request, dealId);
      if (!clientAuth.authorized) {
        return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
      }
    } else if (proposedByRole === 'creator') {
      const creatorAuth = await requireCreatorDealAccess(dealId);
      if (!creatorAuth.authorized) {
        return NextResponse.json({ error: 'Unauthorized creator access.' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid proposedByRole parameter.' }, { status: 400 });
    }

    // 4. Concurrency check: Check for active pending proposals for this deal
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

    // 5. Create immutable proposal record
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

    // 5.5 Update parent proposal state to countered
    if (parentProposalId) {
      await admin
        .from('price_proposals')
        .update({
          state: 'countered',
          resolved_at: now,
        })
        .eq('id', parentProposalId);
    }

    // 6. Update Deal status to negotiating
    await admin
      .from('deals')
      .update({
        status: 'negotiating',
        updated_at: now,
        last_activity_at: now,
      })
      .eq('id', deal.id);

    // 7. Post proposal message in deal_messages
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: proposedById || 'participant',
      sender_name: proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client'),
      sender_role: proposedByRole,
      type: 'proposal',
      content: `${proposedByName || (proposedByRole === 'creator' ? 'Creator' : 'Client')} proposed price change to ${priceNum} ${deal.currency}`,
      proposal_id: proposal.id,
    });

    // 8. Create timeline audit event
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'price_proposed',
      actor_id: proposedById || 'participant',
      actor_name: proposedByName,
      actor_role: proposedByRole,
      description: `${proposedByName} proposed price change to ${priceNum} ${deal.currency}`,
    });

    // 9. Send notification to creator if proposed by client
    if (proposedByRole === 'client') {
      await admin.from('notifications').insert({
        user_id: deal.creatorId,
        type: 'new_proposal',
        title: 'New Price Proposal',
        description: `${deal.clientName} proposed ${priceNum} ${deal.currency} for "${deal.title}"`,
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
