"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request) {
    try {
        const body = await request.json();
        const { dealId, proposedPrice, reason, proposedByRole, proposedByName, proposedById, parentProposalId } = body;
        if (!dealId || !proposedPrice || Number(proposedPrice) <= 0) {
            return server_1.NextResponse.json({ error: 'Valid proposed price is required' }, { status: 400 });
        }
        const admin = (0, admin_1.createAdminClient)();
        // Fetch deal
        const { data: deal, error: dealError } = await admin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }
        // Concurrency Check: Check for active pending proposals for this deal
        const { data: existingPending, error: existError } = await admin
            .from('price_proposals')
            .select('id, state, direction')
            .eq('deal_id', deal.id)
            .eq('state', 'pending');
        if (existError) {
            return server_1.NextResponse.json({ error: 'Database verification failed' }, { status: 500 });
        }
        if (existingPending && existingPending.length > 0) {
            if (parentProposalId) {
                const matchesParent = existingPending.some((p) => p.id === parentProposalId);
                if (!matchesParent) {
                    return server_1.NextResponse.json({ error: 'The proposal you are countering is no longer pending.' }, { status: 400 });
                }
            }
            else {
                return server_1.NextResponse.json({ error: 'There is already an active price proposal. Please respond or counter it.' }, { status: 400 });
            }
        }
        else if (parentProposalId) {
            return server_1.NextResponse.json({ error: 'The proposal you are countering has already been resolved.' }, { status: 400 });
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
            return server_1.NextResponse.json({ error: propError?.message || 'Failed to submit proposal' }, { status: 500 });
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
        return server_1.NextResponse.json({ success: true, proposal });
    }
    catch (error) {
        console.error('Error submitting price proposal:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
exports.POST = POST;
