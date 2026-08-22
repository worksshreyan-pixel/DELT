"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request) {
    try {
        const body = await request.json();
        const { dealId, deliverableId, action, feedback, clientName } = body;
        if (!dealId || !action || !['approve', 'request_changes'].includes(action)) {
            return server_1.NextResponse.json({ error: 'Invalid approval payload' }, { status: 400 });
        }
        const admin = (0, admin_1.createAdminClient)();
        const now = new Date().toISOString();
        const { data: deal } = await admin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .maybeSingle();
        if (!deal) {
            return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }
        if (action === 'approve') {
            if (deliverableId) {
                await admin
                    .from('deliverables')
                    .update({
                    status: 'approved',
                    approved_at: now,
                })
                    .eq('id', deliverableId);
            }
            else {
                await admin
                    .from('deliverables')
                    .update({
                    status: 'approved',
                    approved_at: now,
                })
                    .eq('deal_id', dealId);
            }
            await admin
                .from('file_versions')
                .update({
                status: 'approved',
                locked: false,
            })
                .eq('deal_id', dealId);
            await admin.from('deal_events').insert({
                deal_id: dealId,
                type: 'deliverable_approved',
                actor_name: clientName || deal.client_name,
                actor_role: 'client',
                description: `${clientName || deal.client_name} approved deliverables.`,
            });
            await admin.from('deal_messages').insert({
                deal_id: dealId,
                sender_id: 'client',
                sender_name: clientName || deal.client_name,
                sender_role: 'client',
                type: 'approval',
                content: `Approved deliverable files.`,
            });
            await admin.from('notifications').insert({
                user_id: deal.creator_id,
                type: 'deliverable_approved',
                title: 'Deliverable Approved',
                description: `${deal.client_name} approved deliverables for "${deal.title}"`,
                deal_id: deal.id,
                deal_title: deal.title,
                read: false,
            });
        }
        else {
            // Request changes
            if (deliverableId) {
                await admin
                    .from('deliverables')
                    .update({
                    status: 'changes_requested',
                })
                    .eq('id', deliverableId);
            }
            await admin.from('deal_events').insert({
                deal_id: dealId,
                type: 'change_requested',
                actor_name: clientName || deal.client_name,
                actor_role: 'client',
                description: `${clientName || deal.client_name} requested changes: "${feedback || 'Revisions needed'}"`,
            });
            await admin.from('deal_messages').insert({
                deal_id: dealId,
                sender_id: 'client',
                sender_name: clientName || deal.client_name,
                sender_role: 'client',
                type: 'change_request',
                content: `Change request: ${feedback || 'Please review changes.'}`,
            });
            await admin.from('notifications').insert({
                user_id: deal.creator_id,
                type: 'change_request',
                title: 'Change Requested',
                description: `${deal.client_name} requested changes on "${deal.title}": ${feedback || ''}`,
                deal_id: deal.id,
                deal_title: deal.title,
                read: false,
            });
        }
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error in deliverable approval route:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
exports.POST = POST;
