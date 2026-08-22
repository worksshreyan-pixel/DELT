import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDescription } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const formData = await request.formData();

    const dealId = formData.get('dealId') as string;
    const deliverableId = formData.get('deliverableId') as string;
    const fileId = formData.get('fileId') as string;
    const file = formData.get('file') as File | null;
    const previewFile = formData.get('previewFile') as File | null;

    if (!dealId || !deliverableId || !fileId || !file) {
      return NextResponse.json({ error: 'Deal ID, deliverable ID, file ID, and file are required.' }, { status: 400 });
    }

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

    // 3. Check storage usage quota
    const { data: storageRecord } = await admin
      .from('storage_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (storageRecord) {
      const currentBytes = Number(storageRecord.total_bytes || 0);
      const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
      if (currentBytes + file.size > limitBytes) {
        return NextResponse.json(
          { error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' },
          { status: 413 }
        );
      }
    }

    // 4. Upload new file to private Supabase bucket 'deal-files'
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${dealId}/v${targetVersion.version}/replaced_${Date.now()}_${cleanFileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from('deal-files')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload new file to storage' }, { status: 500 });
    }

    let previewPath = '';
    let previewStatus = 'failed';

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isVideo = (file.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);

    if (previewFile) {
      const previewBuffer = Buffer.from(await previewFile.arrayBuffer());
      const previewCleanName = previewFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      previewPath = `previews/${dealId}/v${targetVersion.version}/replaced_${Date.now()}_${previewCleanName}`;

      const { error: previewUploadError } = await admin.storage
        .from('deal-files')
        .upload(previewPath, previewBuffer, {
          contentType: previewFile.type || 'application/octet-stream',
          upsert: true,
        });

      if (!previewUploadError) {
        previewStatus = 'ready';
      }
    } else if (previewEnabled && isVideo) {
      previewStatus = 'processing';
    }

    // Construct new file item
    const newFileItem = {
      id: `f_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      path: storagePath,
      previewPath: (previewEnabled && isVideo) ? undefined : (previewPath || undefined),
      previewType: (previewEnabled && isVideo) ? 'video/mp4' : (previewFile ? previewFile.type : undefined),
      previewStatus: (previewEnabled && isVideo) ? 'processing' : (previewFile ? (previewStatus as any) : undefined),
      previewGeneratedAt: previewFile ? new Date().toISOString() : undefined,
    };

    // Update old file item to retention status
    const oldFileItem = targetVersion.files[fileItemIndex];
    const { env } = await import('@/lib/env');
    const retentionDays = env.app.fileRetentionDays || 7;
    const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const updatedOldFileItem = {
      ...oldFileItem,
      deletionStatus: 'retention',
      retentionUntil,
    };

    // Update files array
    const updatedFiles = [...targetVersion.files];
    updatedFiles[fileItemIndex] = updatedOldFileItem;
    updatedFiles.push(newFileItem);

    // 5. Update DB record
    const { error: updateError } = await admin
      .from('file_versions')
      .update({ files: updatedFiles })
      .eq('id', targetVersion.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Trigger video preview generation if video and preview is enabled
    if (previewEnabled && isVideo) {
      const { generateVideoPreview } = await import('@/lib/video-preview');
      generateVideoPreview(dealId, targetVersion.id, newFileItem.id).catch((err) => {
        console.error('[VIDEO_PREVIEW] Background generation task error:', err);
      });
    }

    // Update storage usage
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

    // Create timeline event & system message
    await admin.from('deal_events').insert({
      deal_id: dealId,
      type: 'file_uploaded',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: `Replaced file "${oldFileItem.name}" with "${file.name}" in version v${targetVersion.version}.`,
    });

    await admin.from('deal_messages').insert({
      deal_id: dealId,
      sender_id: user.id,
      sender_name: user.user_metadata?.displayName || 'Creator',
      sender_role: 'creator',
      type: 'file',
      content: `Replaced deliverable file: ${file.name} (Version ${targetVersion.version})`,
    });

    return NextResponse.json({ success: true, file: newFileItem });
  } catch (error: any) {
    console.error('Error replacing file:', error);
    return NextResponse.json({ error: error?.message || 'File replacement failed' }, { status: 500 });
  }
}
