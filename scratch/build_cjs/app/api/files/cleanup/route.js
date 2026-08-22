"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request) {
    try {
        // Basic Auth Check (compare header with SUPABASE_SERVICE_ROLE_KEY for safety)
        const authHeader = request.headers.get('authorization');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey && authHeader !== `Bearer ${serviceKey}`) {
            // Allow local development triggers without error if key is unset, but enforce in production
            if (process.env.NODE_ENV === 'production') {
                return server_1.NextResponse.json({ error: 'Unauthorized system service call' }, { status: 401 });
            }
        }
        const admin = (0, admin_1.createAdminClient)();
        const now = new Date();
        const nowString = now.toISOString();
        // 1. Fetch all file versions that might have files in retention
        const { data: fileVersions, error: fetchErr } = await admin
            .from('file_versions')
            .select('*, deals(status, creator_id)');
        if (fetchErr) {
            console.error('Error fetching file versions for cleanup:', fetchErr);
            return server_1.NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
        }
        const logs = [];
        let filesDeletedCount = 0;
        let totalBytesFreed = 0;
        if (fileVersions && fileVersions.length > 0) {
            for (const version of fileVersions) {
                const filesList = Array.isArray(version.files) ? version.files : [];
                let hasChanges = false;
                // Parent deal validation
                const deal = version.deals;
                if (!deal || deal.status !== 'closed') {
                    // If the deal is not closed, we cannot clean up files even if retention date passed!
                    continue;
                }
                const updatedFiles = await Promise.all(filesList.map(async (f) => {
                    // Check if file is in retention and has expired
                    const isRetention = f.deletionStatus === 'retention';
                    const isExpired = f.retentionUntil && new Date(f.retentionUntil) <= now;
                    if (isRetention && isExpired) {
                        logs.push(`Processing expired file: ${f.name} (id: ${f.id})`);
                        // A. Delete Original File from Supabase Storage
                        try {
                            const { error: delOriginalErr } = await admin.storage
                                .from('deal-files')
                                .remove([f.path]);
                            if (delOriginalErr) {
                                console.error(`Failed to delete original file ${f.path}:`, delOriginalErr);
                                // Do not fail the whole transaction, but mark it for retry
                                return f;
                            }
                            logs.push(`Deleted original storage object: ${f.path}`);
                        }
                        catch (storageErr) {
                            console.error(`Storage error removing original ${f.path}:`, storageErr);
                            return f;
                        }
                        // B. Delete Preview File if it exists
                        if (f.previewPath) {
                            try {
                                const { error: delPreviewErr } = await admin.storage
                                    .from('deal-files')
                                    .remove([f.previewPath]);
                                if (delPreviewErr) {
                                    console.error(`Failed to delete preview file ${f.previewPath}:`, delPreviewErr);
                                }
                                else {
                                    logs.push(`Deleted preview storage object: ${f.previewPath}`);
                                }
                            }
                            catch (previewErr) {
                                console.error(`Storage error removing preview ${f.previewPath}:`, previewErr);
                            }
                        }
                        // C. Decrement uploader/creator storage usage
                        const creatorId = deal.creator_id;
                        if (creatorId && f.size) {
                            const { data: storageRecord } = await admin
                                .from('storage_usage')
                                .select('*')
                                .eq('user_id', creatorId)
                                .maybeSingle();
                            if (storageRecord) {
                                const newTotalBytes = Math.max(0, Number(storageRecord.total_bytes || 0) - f.size);
                                const newFilesBytes = Math.max(0, Number(storageRecord.files_bytes || 0) - f.size);
                                await admin
                                    .from('storage_usage')
                                    .update({
                                    total_bytes: newTotalBytes,
                                    files_bytes: newFilesBytes,
                                    updated_at: nowString,
                                })
                                    .eq('user_id', creatorId);
                                totalBytesFreed += f.size;
                                logs.push(`Decremented storage allocation for creator ${creatorId} by ${f.size} bytes`);
                            }
                        }
                        // D. Record audit trail event
                        await admin.from('deal_events').insert({
                            deal_id: version.deal_id,
                            type: 'files_deleted',
                            actor_id: 'system',
                            actor_name: 'DELT System',
                            actor_role: 'creator',
                            description: `File "${f.name}" permanently deleted after retention period expired.`,
                            metadata: { fileId: f.id, fileSize: f.size },
                        });
                        filesDeletedCount++;
                        hasChanges = true;
                        // E. Update metadata values
                        return {
                            ...f,
                            deletionStatus: 'deleted',
                            deletedAt: nowString,
                        };
                    }
                    return f;
                }));
                if (hasChanges) {
                    // Update version record in the database
                    await admin
                        .from('file_versions')
                        .update({
                        files: updatedFiles,
                    })
                        .eq('id', version.id);
                }
            }
        }
        return server_1.NextResponse.json({
            success: true,
            filesDeleted: filesDeletedCount,
            bytesFreed: totalBytesFreed,
            logs: logs,
        });
    }
    catch (error) {
        console.error('Error executing database file cleanup:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error executing cleanup' }, { status: 500 });
    }
}
exports.POST = POST;
