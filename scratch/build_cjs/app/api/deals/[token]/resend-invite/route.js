"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
const deal_url_1 = require("@/lib/deal-url");
const email_1 = require("@/lib/email");
function maskEmail(email) {
    if (!email || !email.includes('@'))
        return '***';
    const [local, domain] = email.split('@');
    if (local.length <= 2)
        return `${local[0]}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
async function POST(request, { params }) {
    try {
        const { token } = await params;
        if (!token) {
            return server_1.NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }
        const admin = (0, admin_1.createAdminClient)();
        // 1. Fetch deal by token
        const { data: deal, error: dealError } = await admin
            .from('deals')
            .select('*')
            .eq('token', token)
            .maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }
        // 2. Fetch creator profile
        const { data: creatorProfile } = await admin
            .from('profiles')
            .select('display_name, email')
            .eq('id', deal.creator_id)
            .maybeSingle();
        const creatorName = creatorProfile?.display_name || 'Creator';
        const canonicalDealUrl = (0, deal_url_1.getDealPublicUrl)(deal.token);
        // 3. Send email
        console.log(`[INVITATION_EMAIL_START]`, JSON.stringify({
            dealId: deal.id,
            clientEmailMasked: maskEmail(deal.client_email),
            timestamp: new Date().toISOString()
        }));
        const emailResult = await (0, email_1.sendDealInvitationEmail)({
            clientName: deal.client_name,
            clientEmail: deal.client_email,
            creatorName,
            dealTitle: deal.title,
            dealPrice: Number(deal.price),
            dealCurrency: deal.currency || 'INR',
            dealUrl: canonicalDealUrl,
        });
        console.log(`[INVITATION_EMAIL_RESULT]`, JSON.stringify({
            dealId: deal.id,
            success: emailResult.success,
            delivered: emailResult.delivered,
            simulated: emailResult.simulated,
            messageId: emailResult.messageId || null,
            error: emailResult.error || null,
            timestamp: new Date().toISOString()
        }));
        // 4. Log event
        if (emailResult.delivered) {
            await admin.from('deal_events').insert({
                deal_id: deal.id,
                type: 'deal_shared',
                actor_name: creatorName,
                actor_role: 'creator',
                description: `Invitation email resent to ${deal.client_email}`,
            });
        }
        return server_1.NextResponse.json({
            success: true,
            emailResult,
        });
    }
    catch (error) {
        console.error('Error resending invitation:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Failed to resend invitation' }, { status: 500 });
    }
}
exports.POST = POST;
