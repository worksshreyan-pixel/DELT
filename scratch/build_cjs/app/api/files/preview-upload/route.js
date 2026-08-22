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
async function POST(request) {
    try {
        const supabase = await (0, server_2.createServerSupabaseClient)();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const formData = await request.formData();
        const dealId = formData.get('dealId');
        const fileVersionId = formData.get('fileVersionId');
        const fileId = formData.get('fileId');
        const previewFile = formData.get('previewFile');
        if (!dealId || !fileVersionId || !fileId) {
            return server_1.NextResponse.json({ error: 'dealId, fileVersionId, and fileId are required' }, { status: 400 });
        }
        const admin = (0, admin_1.createAdminClient)();
        // 1. Verify creator owns the deal
        const { data: deal, error: dealError } = await admin
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .eq('creator_id', user.id)
            .maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 404 });
        }
        // 2. Fetch the file version record
        const { data: versionRecord, error: versionError } = await admin
            .from('file_versions')
            .select('*')
            .eq('id', fileVersionId)
            .eq('deal_id', dealId)
            .maybeSingle();
        if (versionError || !versionRecord) {
            return server_1.NextResponse.json({ error: 'File version not found' }, { status: 404 });
        }
        const files = Array.isArray(versionRecord.files) ? versionRecord.files : [];
        const fileIndex = files.findIndex((f) => f.id === fileId);
        if (fileIndex === -1) {
            return server_1.NextResponse.json({ error: 'File not found in this version' }, { status: 404 });
        }
        const targetFileItem = files[fileIndex];
        const ext = targetFileItem.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = (targetFileItem.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
        if (isVideo) {
            // Trigger server-side video preview generation
            const updatedFiles = [...files];
            updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                previewStatus: 'processing',
            };
            const { error: updateError } = await admin
                .from('file_versions')
                .update({ files: updatedFiles })
                .eq('id', fileVersionId);
            if (updateError) {
                console.error('Error marking video preview as processing:', updateError);
                return server_1.NextResponse.json({ error: 'Failed to initialize video processing' }, { status: 500 });
            }
            const { generateVideoPreview } = await Promise.resolve().then(() => __importStar(require('@/lib/video-preview')));
            generateVideoPreview(dealId, fileVersionId, fileId).catch((err) => {
                console.error('[VIDEO_PREVIEW] Retrospective generation task error:', err);
            });
            return server_1.NextResponse.json({ success: true, processing: true });
        }
        if (!previewFile) {
            return server_1.NextResponse.json({ error: 'previewFile is required' }, { status: 400 });
        }
        // 3. Upload the preview file to storage
        const previewBuffer = Buffer.from(await previewFile.arrayBuffer());
        const cleanPreviewName = previewFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const versionNum = versionRecord.version || 1;
        const previewPath = `previews/${dealId}/v${versionNum}/${Date.now()}_${cleanPreviewName}`;
        const { error: uploadError } = await admin.storage
            .from('deal-files')
            .upload(previewPath, previewBuffer, {
            contentType: previewFile.type || 'application/octet-stream',
            upsert: true,
        });
        if (uploadError) {
            console.error('Preview upload error:', uploadError);
            return server_1.NextResponse.json({ error: 'Failed to upload preview to storage' }, { status: 500 });
        }
        // 4. Update the files array
        const updatedFiles = [...files];
        updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            previewPath,
            previewType: previewFile.type,
            previewStatus: 'ready',
            previewGeneratedAt: new Date().toISOString(),
        };
        const { data: updatedRecord, error: updateError } = await admin
            .from('file_versions')
            .update({ files: updatedFiles })
            .eq('id', fileVersionId)
            .select()
            .single();
        if (updateError) {
            console.error('Error updating file version metadata:', updateError);
            return server_1.NextResponse.json({ error: 'Failed to update file version metadata' }, { status: 500 });
        }
        return server_1.NextResponse.json({ success: true, version: updatedRecord });
    }
    catch (error) {
        console.error('Error in preview upload API:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
exports.POST = POST;
