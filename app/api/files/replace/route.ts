import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDescription } from '@/lib/utils';

// This route accepts JSON metadata only.
// The browser must have already uploaded the file directly to Supabase Storage
// using a signed URL from /api/files/replace/init.
// No file binary should ever be sent through this Vercel function.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Multipart file uploads are not supported. Use direct storage upload via /api/files/replace/init.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      dealId,
      deliverableId,
      fileId,
      newFileName,
      newFileType,
      newFileSize,
      newFilePath,
      previewPath,
      previewType,
      previewStatus,
    } = body;

    if (!dealId || !deliverableId || !fileId || !newFileName || !newFilePath) {
      return NextResponse.json(
        { error: 'Required fields: dealId, deliverableId, fileId, newFileName, newFilePath' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch deal to verify creator ownership
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { previewEnabled } = parseDescription(deal.description);

    // 2. Fetch the file version containing this file
    const { data: fileVersions } = await admin
      .from('file_versions')
      .select('*')
      .eq('deal_id', dealId)
      .eq('deliverable_id', deliverableId);

    let targetVersion: any = null;
    let fileItemIndex = -1;

    if (fileVersions) {
      for (const version of fileVersions) {
        const filesList = Array.isArray(version.files) ? version.files : [];
        const idx = filesList.findIndex((f: any) => f.id === fileId);
        if (idx !== -1) {
          targetVersion = version;
          fileItemIndex = idx;
          break;
        }
      }
    }

    if (!targetVersion || fileItemIndex === -1) {
      return NextResponse.json({ error: 'File to replace not found.' }, { status: 404 });
    }

    // 3. Update storage usage quota tracking
    const { data: storageRecord } = await admin
      .from('storage_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const fileSize = Number(newFileSize || 0);
    if (storageRecord && fileSize > 0) {
      const currentBytes = Number(storageRecord.total_bytes || 0);
      const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
      if (currentBytes + fileSize > limitBytes) {
        return NextResponse.json(
          { error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' },
          { status: 413 }
        );
      }
    }

    const ext = newFileName.split('.').pop()?.toLowerCase() || '';
    const isVideo = (newFileType || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);

    // Determine effective preview status
    let effectivePreviewPath = previewPath || undefined;
    let effectivePreviewType = previewType || undefined;
    let effectivePreviewStatus = previewStatus || undefined;

    if (previewEnabled && isVideo && !previewPath) {
      effectivePreviewPath = undefined;
      effectivePreviewType = 'video/mp4';
      effectivePreviewStatus = 'processing';
    }

    // 4. Construct the new file item (file was already uploaded to Supabase by browser)
    const newFileItem = {
      id: `f_${Date.now()}`,
      name: newFileName,
      size: fileSize,
      type: newFileType || 'application/octet-stream',
      path: newFilePath,
      previewPath: effectivePreviewPath,
      previewType: effectivePreviewType,
      previewStatus: effectivePreviewStatus,
      previewGeneratedAt: previewPath ? new Date().toISOString() : undefined,
    };

    // 5. Set old file item to retention status
    const oldFileItem = targetVersion.files[fileItemIndex];
    const { env } = await import('@/lib/env');
    const retentionDays = env.app.fileRetentionDays || 7;
    const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const updatedOldFileItem = {
      ...oldFileItem,
      deletionStatus: 'retention',
      retentionUntil,
    };

    // 6. Update files array
    const updatedFiles = [...targetVersion.files];
    updatedFiles[fileItemIndex] = updatedOldFileItem;
    updatedFiles.push(newFileItem);

    // 7. Update DB record
    const { error: updateError } = await admin
      .from('file_versions')
      .update({ files: updatedFiles })
      .eq('id', targetVersion.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 8. Trigger video preview generation if applicable
    if (previewEnabled && isVideo && !previewPath) {
      const { generateVideoPreview } = await import('@/lib/video-preview');
      generateVideoPreview(dealId, targetVersion.id, newFileItem.id).catch((err) => {
        console.error('[VIDEO_PREVIEW] Background generation task error in replace:', err);
      });
    }

    // 9. Update storage usage
    if (storageRecord && fileSize > 0) {
      await admin
        .from('storage_usage')
        .update({
          total_bytes: Number(storageRecord.total_bytes || 0) + fileSize,
          files_bytes: Number(storageRecord.files_bytes || 0) + fileSize,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // 10. Create timeline event & system message
    await admin.from('deal_events').insert({
      deal_id: dealId,
      type: 'file_uploaded',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: `Replaced file "${oldFileItem.name}" with "${newFileName}" in version v${targetVersion.version}.`,
    });

    await admin.from('deal_messages').insert({
      deal_id: dealId,
      sender_id: user.id,
      sender_name: user.user_metadata?.displayName || 'Creator',
      sender_role: 'creator',
      type: 'file',
      content: `Replaced deliverable file: ${newFileName} (Version ${targetVersion.version})`,
    });

    return NextResponse.json({ success: true, file: newFileItem });
  } catch (error: any) {
    console.error('[FILE_REPLACE] Error:', error);
    return NextResponse.json({ error: error?.message || 'File replacement failed' }, { status: 500 });
  }
}
