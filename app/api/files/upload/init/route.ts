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
    const { dealId, fileName, fileSize, isPreview } = body;

    if (!dealId || !fileName || typeof fileSize !== 'number') {
      return NextResponse.json({ error: 'Missing required parameters: dealId, fileName, fileSize' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify creator owns the deal
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .eq('creator_id', user.id)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 403 });
    }

    // Check storage usage quota
    const { data: storageRecord } = await admin
      .from('storage_usage')
      .select('*')
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

    // Fetch existing versions count for deliverable
    const { count } = await admin
      .from('file_versions')
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', dealId);

    const versionNum = (count || 0) + 1;

    // Clean file name
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = isPreview
      ? `previews/${dealId}/v${versionNum}/${Date.now()}_${cleanFileName}`
      : `${dealId}/v${versionNum}/${Date.now()}_${cleanFileName}`;

    const { data: uploadUrlData, error: uploadUrlError } = await admin.storage
      .from('deal-files')
      .createSignedUploadUrl(storagePath);

    if (uploadUrlError || !uploadUrlData?.signedUrl) {
      console.error('Error generating signed upload URL:', uploadUrlError);
      return NextResponse.json({ error: 'Failed to generate signed upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: uploadUrlData.signedUrl,
      filePath: storagePath,
      versionNum
    });
  } catch (error: any) {
    console.error('Error in file upload init route:', error);
    return NextResponse.json({ error: error?.message || 'Upload initialization failed' }, { status: 500 });
  }
}
