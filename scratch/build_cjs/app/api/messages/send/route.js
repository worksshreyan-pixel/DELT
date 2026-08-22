"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request) {
    try {
        const body = await request.json();
        const { dealId, senderId, senderName, senderRole, type = 'text', content, attachments = [] } = body;
        if (!dealId || !content?.trim()) {
            return server_1.NextResponse.json({ error: 'Deal ID and content are required' }, { status: 400 });
        }
        const admin = (0, admin_1.createAdminClient)();
        const now = new Date().toISOString();
        const { data: message, error: msgError } = await admin
            .from('deal_messages')
            .insert({
            deal_id: dealId,
            sender_id: senderId || 'user',
            sender_name: senderName || 'User',
            sender_role: senderRole || 'creator',
            type,
            content: content.trim(),
            attachments,
        })
            .select()
            .single();
        if (msgError || !message) {
            return server_1.NextResponse.json({ error: msgError?.message || 'Failed to send message' }, { status: 500 });
        }
        // Update deal activity
        await admin
            .from('deals')
            .update({
            last_activity_at: now,
            updated_at: now,
        })
            .eq('id', dealId);
        return server_1.NextResponse.json({ success: true, message });
    }
    catch (error) {
        console.error('Error sending message:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
exports.POST = POST;
