"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request) {
    try {
        const body = await request.json();
        const { proposalId, dealId, response, responderName, responderRole } = body;
        if (!proposalId || !dealId || !['accept', 'decline'].includes(response)) {
            return server_1.NextResponse.json({ error: 'Invalid proposal response data' }, { status: 400 });
        }
        const admin = (0, admin_1.createAdminClient)();
        const now = new Date().toISOString();
        // 1. Fetch proposal
        const { data: proposal, error: propError } = await admin
            .from('price_proposals')
            .select('*')
            .eq('id', proposalId)
            .maybeSingle();
        if (propError || !proposal) {
            return server_1.NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
        }
        if (proposal.state !== 'pending') {
            return server_1.NextResponse.json({ error: 'Proposal has already been resolved' }, { status: 400 });
        }
        // 2. Fetch deal
        const { data: deal, error: dealError } = await admin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
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
        }
        else {
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
            const { sendProposalStatusEmail } = await Promise.resolve().then(() => __importStar(require('@/lib/email')));
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
            }
            else {
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
        }
        catch (emailErr) {
            console.error('Error sending proposal status email:', emailErr);
        }
        return server_1.NextResponse.json({ success: true, state: newState });
    }
    catch (error) {
        console.error('Error responding to price proposal:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
exports.POST = POST;
