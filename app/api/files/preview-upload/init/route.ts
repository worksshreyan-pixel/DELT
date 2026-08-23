import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dealId, fileVersionId, fileId, previewFileName, previewFileSize } = body;

    if (!dealId || !fileVersionId || !fileId || !previewFileName || typeof previewFileSize !== 'number') {
      return NextResponse.json(
        { error: 'Missing required parameters: dealId, fileVersionId, fileId, previewFileName, previewFileSize' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify creator owns the deal
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('id, creator_id')
      .eq('id', dealId)
      .eq('creator_id', user.id)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 403 });
    }

    // Fetch the file version to get version number
    const { data: versionRecord, error: versionError } = await admin
      .from('file_versions')
      .select('id, version')
      .eq('id', fileVersionId)
      .eq('deal_id', dealId)
      .maybeSingle();

    if (versionError || !versionRecord) {
      return NextResponse.json({ error: 'File version not found' }, { status: 404 });
    }

    const versionNum = versionRecord.version || 1;

    // Server-generated storage path for the preview — client cannot override this
    const cleanPreviewName = previewFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const previewPath = `previews/${dealId}/v${versionNum}/${Date.now()}_${cleanPreviewName}`;

    const { data: uploadUrlData, error: uploadUrlError } = await admin.storage
      .from('deal-files')
      .createSignedUploadUrl(previewPath);

    if (uploadUrlError || !uploadUrlData?.signedUrl) {
      console.error('[PREVIEW_UPLOAD_INIT] Error generating signed upload URL:', uploadUrlError);
      return NextResponse.json({ error: 'Failed to generate signed upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: uploadUrlData.signedUrl,
      previewPath,
    });
  } catch (error: any) {
    console.error('[PREVIEW_UPLOAD_INIT] Error:', error);
    return NextResponse.json({ error: error?.message || 'Preview upload initialization failed' }, { status: 500 });
  }
}
