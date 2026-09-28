import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveDealByCode, requireCreatorDealAccess, requireClientDealAccess } from '@/lib/deal-auth';
import { getClientDealUrl, getCreatorDealUrl, getCreatorUsername } from '@/lib/deal-url';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalId, dealId, response, responderName, responderRole } = body;

    if (!proposalId || !dealId || !['accept', 'decline'].includes(response)) {
      return NextResponse.json({ error: 'Invalid proposal response data' }, { status: 400 });
    }

    // 1. Canonical deal identity resolution
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

    // 3. Robust role-based authorization
    if (responderRole === 'client') {
      const clientAuth = await requireClientDealAccess(request, dealId);
      if (!clientAuth.authorized) {
        return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
      }
    } else if (responderRole === 'creator') {
      const creatorAuth = await requireCreatorDealAccess(dealId);
      if (!creatorAuth.authorized) {
        return NextResponse.json({ error: 'Unauthorized creator access.' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid responderRole parameter.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 4. Fetch proposal
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

    // 5. Update proposal state
    const newState = response === 'accept' ? 'accepted' : 'declined';
    await admin
      .from('price_proposals')
      .update({
        state: newState,
        resolved_at: now,
      })
      .eq('id', proposal.id);

    if (response === 'accept') {
      // 6. Update deal authoritative agreed price
      await admin
        .from('deals')
        .update({
          price: proposal.proposed_price,
          status: 'agreed',
          updated_at: now,
          last_activity_at: now,
        })
        .eq('id', deal.id);

      // 7. Audit event
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'price_accepted',
        actor_name: responderName,
        actor_role: responderRole,
        description: `Price proposal of ${proposal.proposed_price} ${deal.currency} accepted by ${responderName}.`,
      });

      // 8. System message
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

    // 9. Transactional Email Notification
    try {
      const isClientResponder = responderRole === 'client';
      const { sendProposalStatusEmail } = await import('@/lib/email');

      if (isClientResponder) {
        // Notify Creator
        const { data: creatorProfile } = await admin
          .from('profiles')
          .select('email, display_name')
          .eq('id', deal.creatorId)
          .maybeSingle();

        if (creatorProfile?.email) {
          await sendProposalStatusEmail({
            recipientName: creatorProfile.display_name || 'Creator',
            recipientEmail: creatorProfile.email,
            responderName: responderName || 'Client',
            dealTitle: deal.title,
            price: Number(proposal.proposed_price),
            currency: deal.currency || 'INR',
            accepted: response === 'accept',
            dealUrl: getCreatorDealUrl(deal.dealCode || deal.id),
          });
        }
      } else {
        // Notify Client
        if (deal.clientEmail) {
          await sendProposalStatusEmail({
            recipientName: deal.clientName || 'Client',
            recipientEmail: deal.clientEmail,
            responderName: responderName || 'Creator',
            dealTitle: deal.title,
            price: Number(proposal.proposed_price),
            currency: deal.currency || 'INR',
            accepted: response === 'accept',
            dealUrl: getClientDealUrl(deal.dealCode || deal.token || deal.id, getCreatorUsername(resolution.creator)),
          });
        }
      }
    } catch (emailErr) {
      console.error('Error sending proposal status email:', emailErr);
    }

    return NextResponse.json({ success: true, state: newState });
  } catch (error: any) {
    console.error('Error responding to price proposal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
