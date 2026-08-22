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
const server_2 = require("@/lib/supabase/server");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request, { params }) {
    try {
        const { token: idOrToken } = await params;
        if (!idOrToken) {
            return server_1.NextResponse.json({ error: 'Deal ID or token is required.' }, { status: 400 });
        }
        const supabase = await (0, server_2.createServerSupabaseClient)();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return server_1.NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }
        const admin = (0, admin_1.createAdminClient)();
        // 1. Fetch deal by id OR token
        let query = admin.from('deals').select('*');
        if (idOrToken.startsWith('dlt_') || idOrToken.startsWith('dl_')) {
            query = query.eq('token', idOrToken);
        }
        else {
            query = query.eq('id', idOrToken);
        }
        const { data: deal, error: dealError } = await query.maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
        }
        // 2. Authorize creator
        if (deal.creator_id !== user.id) {
            return server_1.NextResponse.json({ error: 'Only the creator of this Deal can close and delete it.' }, { status: 403 });
        }
        const dealId = deal.id;
        const now = new Date().toISOString();
        // 3. Update Deal status to 'closed'
        const { error: updateError } = await admin
            .from('deals')
            .update({
            status: 'closed',
            updated_at: now,
            last_activity_at: now,
        })
            .eq('id', dealId);
        if (updateError) {
            return server_1.NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        // 4. Retrieve all associated file versions and mark files for retention
        const { data: fileVersions } = await admin
            .from('file_versions')
            .select('*')
            .eq('deal_id', dealId);
        const { env } = await Promise.resolve().then(() => __importStar(require('@/lib/env')));
        const retentionDays = env.app.fileRetentionDays;
        const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
        if (fileVersions && fileVersions.length > 0) {
            for (const version of fileVersions) {
                const filesList = Array.isArray(version.files) ? version.files : [];
                const updatedFiles = filesList.map((f) => ({
                    ...f,
                    deletionStatus: 'retention',
                    retentionUntil: retentionUntil,
                }));
                await admin
                    .from('file_versions')
                    .update({
                    files: updatedFiles,
                })
                    .eq('id', version.id);
            }
        }
        // 5. Create timeline event & system message
        await admin.from('deal_events').insert({
            deal_id: dealId,
            type: 'deal_closed',
            actor_id: user.id,
            actor_name: user.user_metadata?.displayName || 'Creator',
            actor_role: 'creator',
            description: `Deal "${deal.title}" closed by creator. Files entered a ${retentionDays}-day retention period.`,
        });
        await admin.from('deal_messages').insert({
            deal_id: dealId,
            sender_id: 'system',
            sender_name: 'DELT System',
            sender_role: 'creator',
            type: 'system',
            content: `Deal has been closed by the creator. Files entered a ${retentionDays}-day retention period.`,
        });
        return server_1.NextResponse.json({
            success: true,
            message: 'Deal closed and files placed in retention.',
            dealId: dealId,
            status: 'closed',
        });
    }
    catch (error) {
        console.error('Error closing deal:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error closing deal.' }, { status: 500 });
    }
}
exports.POST = POST;
