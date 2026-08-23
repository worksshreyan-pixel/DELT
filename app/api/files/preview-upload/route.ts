import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// This route accepts JSON only — no file binary passes through Vercel.
//
// For VIDEO files: triggers server-side video preview generation via Render processor.
// For NON-VIDEO files: expects that the browser has already uploaded the preview directly to
// Supabase Storage using a signed URL from /api/files/preview-upload/init, and this route
// updates the DB metadata only.
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
        { error: 'Multipart uploads are not supported. Use JSON body.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { dealId, fileVersionId, fileId, previewPath, previewType, previewGeneratedAt } = body;

    if (!dealId || !fileVersionId || !fileId) {
      return NextResponse.json(
        { error: 'dealId, fileVersionId, and fileId are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Verify creator owns the deal
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .eq('creator_id', user.id)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 404 });
    }

    // 2. Fetch the file version record
    const { data: versionRecord, error: versionError } = await admin
      .from('file_versions')
      .select('*')
      .eq('id', fileVersionId)
      .eq('deal_id', dealId)
      .maybeSingle();

    if (versionError || !versionRecord) {
      return NextResponse.json({ error: 'File version not found' }, { status: 404 });
    }

    const files = Array.isArray(versionRecord.files) ? versionRecord.files : [];
    const fileIndex = files.findIndex((f: any) => f.id === fileId);

    if (fileIndex === -1) {
      return NextResponse.json({ error: 'File not found in this version' }, { status: 404 });
    }

    const targetFileItem = files[fileIndex];
    const ext = targetFileItem.name.split('.').pop()?.toLowerCase() || '';
    const isVideo = (targetFileItem.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);

    if (isVideo) {
      // For video files: update status to processing, then trigger the Render video processor.
      // No file binary touches Vercel.
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
        console.error('[PREVIEW_UPLOAD] Error marking video preview as processing:', updateError);
        return NextResponse.json({ error: 'Failed to initialize video processing' }, { status: 500 });
      }

      const { generateVideoPreview } = await import('@/lib/video-preview');
      generateVideoPreview(dealId, fileVersionId, fileId).catch((err) => {
        console.error('[VIDEO_PREVIEW] Retrospective generation task error:', err);
      });

      return NextResponse.json({ success: true, processing: true });
    }

    // For non-video files: the browser has already uploaded the preview to Supabase
    // using a signed URL from /api/files/preview-upload/init. Update DB metadata.
    if (!previewPath) {
      return NextResponse.json(
        { error: 'previewPath is required for non-video files (preview must be uploaded directly first)' },
        { status: 400 }
      );
    }

    // Validate that the preview path belongs to this deal
    if (!previewPath.startsWith(`previews/${dealId}/`)) {
      return NextResponse.json(
        { error: 'Invalid preview path — must belong to this deal' },
        { status: 403 }
      );
    }

    const updatedFiles = [...files];
    updatedFiles[fileIndex] = {
      ...updatedFiles[fileIndex],
      previewPath,
      previewType: previewType || 'image/jpeg',
      previewStatus: 'ready',
      previewGeneratedAt: previewGeneratedAt || new Date().toISOString(),
    };

    const { data: updatedRecord, error: updateError } = await admin
      .from('file_versions')
      .update({ files: updatedFiles })
      .eq('id', fileVersionId)
      .select()
      .single();

    if (updateError) {
      console.error('[PREVIEW_UPLOAD] Error updating file version metadata:', updateError);
      return NextResponse.json({ error: 'Failed to update file version metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, version: updatedRecord });
  } catch (error: any) {
    console.error('[PREVIEW_UPLOAD] Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
