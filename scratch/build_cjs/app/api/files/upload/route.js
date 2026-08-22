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
const utils_1 = require("@/lib/utils");
async function POST(request) {
    try {
        const supabase = await (0, server_2.createServerSupabaseClient)();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const contentType = request.headers.get('content-type') || '';
        const admin = (0, admin_1.createAdminClient)();
        if (contentType.includes('application/json')) {
            const body = await request.json();
            const { dealId, deliverableId, description, files, file } = body;
            if (!dealId) {
                return server_1.NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
            }
            let filesToRegister = [];
            if (Array.isArray(files)) {
                filesToRegister = files;
            }
            else if (file) {
                filesToRegister = [file];
            }
            if (filesToRegister.length === 0) {
                return server_1.NextResponse.json({ error: 'No files to register' }, { status: 400 });
            }
            const { data: deal, error: dealError } = await admin
                .from('deals')
                .select('*')
                .eq('id', dealId)
                .maybeSingle();
            if (dealError || !deal) {
                return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
            }
            // Check storage usage quota
            const { data: storageRecord } = await admin
                .from('storage_usage')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            const totalUploadedBytes = filesToRegister.reduce((acc, f) => acc + Number(f.size || 0), 0);
            if (storageRecord) {
                const currentBytes = Number(storageRecord.total_bytes || 0);
                const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
                if (currentBytes + totalUploadedBytes > limitBytes) {
                    return server_1.NextResponse.json({ error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' }, { status: 413 });
                }
            }
            // Fetch existing versions count for deliverable
            const { count } = await admin
                .from('file_versions')
                .select('*', { count: 'exact', head: true })
                .eq('deal_id', dealId);
            const versionNum = (count || 0) + 1;
            // Determine deliverable ID
            let targetDeliverableId = deliverableId;
            if (!targetDeliverableId) {
                const { data: firstDeliv } = await admin
                    .from('deliverables')
                    .select('id')
                    .eq('deal_id', dealId)
                    .limit(1)
                    .maybeSingle();
                targetDeliverableId = firstDeliv?.id;
            }
            if (!targetDeliverableId) {
                return server_1.NextResponse.json({ error: 'No deliverables found for this deal' }, { status: 400 });
            }
            const uploadedFileItems = filesToRegister.map((f) => ({
                id: f.id || `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                name: f.name,
                size: Number(f.size || 0),
                type: f.type,
                path: f.path,
                previewPath: f.previewPath || undefined,
                previewType: f.previewType || undefined,
                previewStatus: f.previewStatus || undefined,
                previewGeneratedAt: f.previewGeneratedAt || (f.previewPath ? new Date().toISOString() : undefined),
            }));
            // Insert file_version record
            const { data: versionRecord, error: versionError } = await admin
                .from('file_versions')
                .insert({
                deliverable_id: targetDeliverableId,
                deal_id: dealId,
                version: versionNum,
                description: description?.trim() || 'Initial project deliverable files',
                uploader_id: user.id,
                uploader_name: user.user_metadata?.displayName || 'Creator',
                files: uploadedFileItems,
                status: 'pending_review',
                locked: true,
            })
                .select()
                .single();
            if (versionError) {
                return server_1.NextResponse.json({ error: versionError.message }, { status: 500 });
            }
            // Trigger video preview generation
            for (const fileItem of uploadedFileItems) {
                if (fileItem.previewStatus === 'processing' && versionRecord) {
                    const { generateVideoPreview } = await Promise.resolve().then(() => __importStar(require('@/lib/video-preview')));
                    generateVideoPreview(dealId, versionRecord.id, fileItem.id).catch((err) => {
                        console.error('[VIDEO_PREVIEW] Background generation task error:', err);
                    });
                }
            }
            // Update storage usage
            if (storageRecord) {
                await admin
                    .from('storage_usage')
                    .update({
                    total_bytes: Number(storageRecord.total_bytes || 0) + totalUploadedBytes,
                    files_bytes: Number(storageRecord.files_bytes || 0) + totalUploadedBytes,
                    updated_at: new Date().toISOString(),
                })
                    .eq('user_id', user.id);
            }
            // Create timeline event & system message
            await admin.from('deal_events').insert({
                deal_id: dealId,
                type: 'file_uploaded',
                actor_id: user.id,
                actor_name: user.user_metadata?.displayName || 'Creator',
                actor_role: 'creator',
                description: `Uploaded new version (v${versionNum}) of ${uploadedFileItems.map(f => f.name).join(', ')}.`,
            });
            await admin.from('deal_messages').insert({
                deal_id: dealId,
                sender_id: user.id,
                sender_name: user.user_metadata?.displayName || 'Creator',
                sender_role: 'creator',
                type: 'file',
                content: `Uploaded deliverable files (Version ${versionNum})`,
            });
            // Send client email notification
            try {
                if (deal?.client_email) {
                    const { sendDeliverablesUploadedEmail } = await Promise.resolve().then(() => __importStar(require('@/lib/email')));
                    const canonicalDealUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${deal.token}`;
                    await sendDeliverablesUploadedEmail({
                        clientName: deal.client_name || 'Client',
                        clientEmail: deal.client_email,
                        creatorName: user.user_metadata?.displayName || 'Creator',
                        dealTitle: deal.title,
                        versionNumber: versionNum,
                        fileNames: uploadedFileItems.map(f => f.name),
                        dealUrl: canonicalDealUrl,
                    });
                }
            }
            catch (emailErr) {
                console.error('Error dispatching deliverable upload email:', emailErr);
            }
            return server_1.NextResponse.json({ success: true, version: versionRecord });
        }
        const formData = await request.formData();
        const dealId = formData.get('dealId');
        const deliverableId = formData.get('deliverableId');
        const description = formData.get('description');
        const file = formData.get('file');
        const previewFile = formData.get('previewFile');
        if (!dealId || !file) {
            return server_1.NextResponse.json({ error: 'Deal ID and file are required' }, { status: 400 });
        }
        // Fetch deal early to get previewEnabled status
        const { data: deal, error: dealError } = await admin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }
        const { previewEnabled } = (0, utils_1.parseDescription)(deal.description);
        // 1. Check storage usage quota
        const { data: storageRecord } = await admin
            .from('storage_usage')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        if (storageRecord) {
            const currentBytes = Number(storageRecord.total_bytes || 0);
            const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
            if (currentBytes + file.size > limitBytes) {
                return server_1.NextResponse.json({ error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' }, { status: 413 });
            }
        }
        // 2. Fetch existing versions count for deliverable
        const { count } = await admin
            .from('file_versions')
            .select('*', { count: 'exact', head: true })
            .eq('deal_id', dealId);
        const versionNum = (count || 0) + 1;
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${dealId}/v${versionNum}/${Date.now()}_${cleanFileName}`;
        // 3. Upload to private Supabase bucket 'deal-files'
        const { error: uploadError } = await admin.storage
            .from('deal-files')
            .upload(storagePath, fileBuffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,
        });
        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return server_1.NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }
        // Debug logging for upload process
        console.log(`[PREVIEW_UPLOAD]
originalName=${file.name}
originalMimeType=${file.type}
previewFilePresent=${!!previewFile}
previewFileName=${previewFile ? previewFile.name : ''}
previewMimeType=${previewFile ? previewFile.type : ''}
previewSize=${previewFile ? previewFile.size : 0}`);
        let previewPath = '';
        let previewStatus = 'failed';
        let previewUploadErrMessage = '';
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = (file.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
        if (previewFile) {
            const previewBuffer = Buffer.from(await previewFile.arrayBuffer());
            const previewCleanName = previewFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            previewPath = `previews/${dealId}/v${versionNum}/${Date.now()}_${previewCleanName}`;
            const { error: previewUploadError } = await admin.storage
                .from('deal-files')
                .upload(previewPath, previewBuffer, {
                contentType: previewFile.type || 'application/octet-stream',
                upsert: true,
            });
            if (!previewUploadError) {
                previewStatus = 'ready';
            }
            else {
                previewUploadErrMessage = previewUploadError.message || JSON.stringify(previewUploadError);
                console.error('Preview upload error:', previewUploadError);
            }
        }
        else if (previewEnabled && isVideo) {
            previewStatus = 'processing';
        }
        console.log(`[PREVIEW_STORAGE]
previewPath=${previewPath}
uploadSuccess=${previewStatus === 'ready'}
uploadError=${previewUploadErrMessage}`);
        console.log(`[PREVIEW_METADATA]
deliverableId=${deliverableId}
previewPath=${previewPath}
previewType=${previewFile ? previewFile.type : (isVideo ? 'video/mp4' : '')}
previewStatus=${previewFile || (previewEnabled && isVideo) ? previewStatus : ''}`);
        const fileItem = {
            id: `f_${Date.now()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            path: storagePath,
            previewPath: (previewEnabled && isVideo) ? undefined : (previewPath || undefined),
            previewType: (previewEnabled && isVideo) ? 'video/mp4' : (previewFile ? previewFile.type : undefined),
            previewStatus: (previewEnabled && isVideo) ? 'processing' : (previewFile ? previewStatus : undefined),
            previewGeneratedAt: previewFile ? new Date().toISOString() : undefined,
        };
        // 4. Insert file_version record
        const { data: versionRecord, error: versionError } = await admin
            .from('file_versions')
            .insert({
            deliverable_id: deliverableId,
            deal_id: dealId,
            version: versionNum,
            description: description?.trim() || null,
            uploader_id: user.id,
            uploader_name: user.user_metadata?.displayName || 'Creator',
            files: [fileItem],
            status: 'pending_review',
            locked: true,
        })
            .select()
            .single();
        if (versionError) {
            return server_1.NextResponse.json({ error: versionError.message }, { status: 500 });
        }
        // Trigger video preview generation in the background if video and preview is enabled
        if (previewEnabled && isVideo && versionRecord) {
            const { generateVideoPreview } = await Promise.resolve().then(() => __importStar(require('@/lib/video-preview')));
            generateVideoPreview(dealId, versionRecord.id, fileItem.id).catch((err) => {
                console.error('[VIDEO_PREVIEW] Background generation task error:', err);
            });
        }
        // 5. Update user storage usage
        if (storageRecord) {
            await admin
                .from('storage_usage')
                .update({
                total_bytes: Number(storageRecord.total_bytes || 0) + file.size,
                files_bytes: Number(storageRecord.files_bytes || 0) + file.size,
                updated_at: new Date().toISOString(),
            })
                .eq('user_id', user.id);
        }
        // 6. Create timeline event & system message
        await admin.from('deal_events').insert({
            deal_id: dealId,
            type: 'file_uploaded',
            actor_id: user.id,
            actor_name: user.user_metadata?.displayName || 'Creator',
            actor_role: 'creator',
            description: `Uploaded new version (v${versionNum}) of ${file.name}.`,
        });
        await admin.from('deal_messages').insert({
            deal_id: dealId,
            sender_id: user.id,
            sender_name: user.user_metadata?.displayName || 'Creator',
            sender_role: 'creator',
            type: 'file',
            content: `Uploaded deliverable files (Version ${versionNum})`,
        });
        // 7. Send client email notification
        try {
            if (deal?.client_email) {
                const { sendDeliverablesUploadedEmail } = await Promise.resolve().then(() => __importStar(require('@/lib/email')));
                const canonicalDealUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${deal.token}`;
                await sendDeliverablesUploadedEmail({
                    clientName: deal.client_name || 'Client',
                    clientEmail: deal.client_email,
                    creatorName: user.user_metadata?.displayName || 'Creator',
                    dealTitle: deal.title,
                    versionNumber: versionNum,
                    fileNames: [file.name],
                    dealUrl: canonicalDealUrl,
                });
            }
        }
        catch (emailErr) {
            console.error('Error dispatching deliverable upload email:', emailErr);
        }
        return server_1.NextResponse.json({ success: true, version: versionRecord });
    }
    catch (error) {
        console.error('Error in file upload route:', error);
        return server_1.NextResponse.json({ error: error?.message || 'File upload failed' }, { status: 500 });
    }
}
exports.POST = POST;
