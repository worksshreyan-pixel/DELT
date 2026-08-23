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
    const { dealId, deliverableId, fileId, fileName, fileSize, isPreview } = body;

    if (!dealId || !deliverableId || !fileId || !fileName || typeof fileSize !== 'number') {
      return NextResponse.json(
        { error: 'Missing required parameters: dealId, deliverableId, fileId, fileName, fileSize' },
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

    // Find the file version containing the file being replaced to get version number
    const { data: fileVersions } = await admin
      .from('file_versions')
      .select('id, version, files')
      .eq('deal_id', dealId)
      .eq('deliverable_id', deliverableId);

    let targetVersionNum = 1;
    if (fileVersions) {
      for (const version of fileVersions) {
        const filesList = Array.isArray(version.files) ? version.files : [];
        const found = filesList.find((f: any) => f.id === fileId);
        if (found) {
          targetVersionNum = version.version || 1;
          break;
        }
      }
    }

    // Check storage usage quota
    const { data: storageRecord } = await admin
      .from('storage_usage')
      .select('total_bytes, limit_bytes')
      .eq('user_id', user.id)
      .maybeSingle();

    if (storageRecord) {
      const currentBytes = Number(storageRecord.total_bytes || 0);
      const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
      if (currentBytes + fileSize > limitBytes) {
        return NextResponse.json(
          { error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' },
          { status: 413 }
        );
      }
    }

    // Server-generated storage path — client cannot override this
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = isPreview
      ? `previews/${dealId}/v${targetVersionNum}/replaced_${Date.now()}_${cleanFileName}`
      : `${dealId}/v${targetVersionNum}/replaced_${Date.now()}_${cleanFileName}`;

    const { data: uploadUrlData, error: uploadUrlError } = await admin.storage
      .from('deal-files')
      .createSignedUploadUrl(storagePath);

    if (uploadUrlError || !uploadUrlData?.signedUrl) {
      console.error('[REPLACE_INIT] Error generating signed upload URL:', uploadUrlError);
      return NextResponse.json({ error: 'Failed to generate signed upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: uploadUrlData.signedUrl,
      filePath: storagePath,
      versionNum: targetVersionNum,
    });
  } catch (error: any) {
    console.error('[REPLACE_INIT] Error:', error);
    return NextResponse.json({ error: error?.message || 'Upload initialization failed' }, { status: 500 });
  }
}
