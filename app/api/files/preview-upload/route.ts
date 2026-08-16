import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const dealId = formData.get('dealId') as string;
    const fileVersionId = formData.get('fileVersionId') as string;
    const fileId = formData.get('fileId') as string;
    const previewFile = formData.get('previewFile') as File | null;

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
      .select('*')
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
        return NextResponse.json({ error: 'Failed to initialize video processing' }, { status: 500 });
      }

      const { generateVideoPreview } = await import('@/lib/video-preview');
      generateVideoPreview(dealId, fileVersionId, fileId).catch((err) => {
        console.error('[VIDEO_PREVIEW] Retrospective generation task error:', err);
      });

      return NextResponse.json({ success: true, processing: true });
    }

    if (!previewFile) {
      return NextResponse.json({ error: 'previewFile is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Failed to upload preview to storage' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to update file version metadata' }, { status: 500 });
    }

    return NextResponse.json({ success: true, version: updatedRecord });
  } catch (error: any) {
    console.error('Error in preview upload API:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
