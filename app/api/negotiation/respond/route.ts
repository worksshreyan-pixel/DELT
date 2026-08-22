import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

    if (responderRole === 'client') {
      if (isCreator) {
        return NextResponse.json({ error: 'Creators cannot respond to proposals as client.' }, { status: 403 });
      }
      if (!isClient) {
        return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
      }
    } else if (responderRole === 'creator') {
      if (!isCreator) {
        return NextResponse.json({ error: 'Unauthorized creator access.' }, { status: 403 });
      }
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

    // 7. Transactional Email Notification
    try {
      const isClientResponder = responderRole === 'client';
      const { sendProposalStatusEmail } = await import('@/lib/email');

      if (isClientResponder) {
        // Notify Creator
        const { data: creatorProfile } = await admin
          .from('profiles')
          .select('email, display_name')
          .eq('id', deal.creator_id)
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
            dealUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deals/${deal.id}`,
          });
        }
      } else {
        // Notify Client
        if (deal.client_email) {
          await sendProposalStatusEmail({
            recipientName: deal.client_name || 'Client',
            recipientEmail: deal.client_email,
            responderName: responderName || 'Creator',
            dealTitle: deal.title,
            price: Number(proposal.proposed_price),
            currency: deal.currency || 'INR',
            accepted: response === 'accept',
            dealUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${deal.token}`,
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
