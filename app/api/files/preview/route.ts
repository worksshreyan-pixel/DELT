import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireClientDealAccess } from '@/lib/deal-auth';
import { parseDescription, isUuid } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, token, fileVersionId, fileId } = body;

    if (!dealId || !token || !fileVersionId || !fileId) {
      return NextResponse.json(
        { error: 'Deal ID, token, fileVersionId, and fileId are required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch deal safely
    let dealQuery = admin.from('deals').select('*');
    if (isUuid(dealId)) {
      dealQuery = dealQuery.eq('id', dealId);
    } else {
      dealQuery = dealQuery.or(`deal_code.eq.${dealId},token.eq.${dealId}`);
    }
    if (token && token !== dealId) {
      dealQuery = dealQuery.or(`token.eq.${token},deal_code.eq.${token}`);
    }
    const { data: deal, error: dealError } = await dealQuery.maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found or invalid token' }, { status: 404 });
    }

    // 2. Validate Client / Creator Authorization
    const creatorId = deal.creator_id;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isCreator = Boolean(user && user.id === creatorId);
    const clientAuth = await requireClientDealAccess(request, deal.id);
    const isClient = Boolean(clientAuth.authorized);

    if (!isCreator && !isClient) {
      return NextResponse.json({ error: 'Unauthorized access to file preview' }, { status: 403 });
    }

    const parsed = parseDescription(deal.description);
    const isPreviewEnabled = Boolean(deal.preview_enabled || parsed.previewEnabled);
    if (!isCreator && !isPreviewEnabled) {
      return NextResponse.json({ error: 'Previews are disabled for this deal' }, { status: 403 });
    }

    // 3. Retrieve file version using canonical deal.id (UUID)
    const { data: version, error: versionError } = await admin
      .from('file_versions')
      .select('*')
      .eq('id', fileVersionId)
      .eq('deal_id', deal.id)
      .maybeSingle();

    if (versionError || !version) {
      return NextResponse.json({ error: 'File version not found' }, { status: 404 });
    }

    // Verify deliverable belongs to canonical deal.id (UUID)
    const { data: deliverable, error: delError } = await admin
      .from('deliverables')
      .select('*')
      .eq('id', version.deliverable_id)
      .eq('deal_id', deal.id)
      .maybeSingle();

    if (delError || !deliverable) {
      return NextResponse.json({ error: 'Deliverable does not belong to this deal' }, { status: 403 });
    }

    const files = Array.isArray(version.files) ? version.files : [];
    const fileItem = files.find((f: any) => f.id === fileId);

    if (!fileItem) {
      return NextResponse.json({ error: 'File not found in this version' }, { status: 404 });
    }

    const effectiveMode = fileItem.previewType || deal.preview_mode || (deal as any).previewMode || (deal.storage_provider === 'google_drive' ? 'EXTERNAL' : 'AUTO');

    // 4. Handle Direct Preview (OPEN_ORIGINAL or NONE when preview is enabled)
    if (effectiveMode === 'OPEN_ORIGINAL' || (effectiveMode === 'NONE' && isPreviewEnabled)) {
      const isPaid = deal.payment_status === 'paid' || deal.status === 'completed';
      const isDirectAllowed = isPreviewEnabled && (deal.preview_mode === 'OPEN_ORIGINAL' || effectiveMode === 'OPEN_ORIGINAL' || effectiveMode === 'NONE');

      if (!isCreator && !isPaid && !isDirectAllowed) {
        return NextResponse.json(
          { error: 'Files are locked. Complete payment to download deliverables.' },
          { status: 403 }
        );
      }

      const isGoogleDriveDirect =
        fileItem.previewProvider === 'google_drive' ||
        fileItem.provider === 'google_drive' ||
        deal.storage_provider === 'google_drive' ||
        Boolean(fileItem.externalId);

      if (isGoogleDriveDirect) {
        const externalObjectId = fileItem.externalId || fileItem.previewExternalId || (fileItem.path?.startsWith('google_drive://') ? fileItem.path.split('/').pop() : fileItem.path);
        if (!externalObjectId) {
          return NextResponse.json({ error: 'Google Drive file ID missing' }, { status: 400 });
        }
        const { GoogleDriveProvider } = await import('@/lib/storage/providers/google-drive-provider');
        const providerInstance = new GoogleDriveProvider();
        try {
          const accessUrl = await providerInstance.getAccessUrl(creatorId, externalObjectId);
          return NextResponse.json({ signedUrl: accessUrl, accessUrl });
        } catch (gdErr: any) {
          console.error('Google Drive preview access error:', gdErr);
          return NextResponse.json(
            { error: gdErr?.message || 'Failed to retrieve Google Drive file' },
            { status: 500 }
          );
        }
      }

      // Supabase direct preview of original file
      const filePath = fileItem.path || fileItem.url;
      if (!filePath || (!filePath.startsWith(`deals/${deal.id}/`) && !filePath.startsWith(`previews/${deal.id}/`))) {
        return NextResponse.json(
          { error: 'Original file path does not belong to this deal or path is invalid' },
          { status: 403 }
        );
      }

      const { data: signedUrlData, error: signError } = await admin.storage
        .from('deal-files')
        .createSignedUrl(filePath, 60);

      if (signError || !signedUrlData?.signedUrl) {
        console.error('Error signing original path for direct preview:', signError);
        return NextResponse.json({ error: 'Failed to generate preview link' }, { status: 500 });
      }

      return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
    }

    // 5. Handle Generated / Manual / External Previews
    if (fileItem.previewStatus !== 'ready' && effectiveMode !== 'EXTERNAL') {
      return NextResponse.json(
        { error: 'Preview is not ready for viewing' },
        { status: 400 }
      );
    }

    const previewPath = fileItem.previewPath || fileItem.path || '';
    const isGoogleDrivePreview =
      fileItem.previewProvider === 'google_drive' ||
      fileItem.provider === 'google_drive' ||
      previewPath.startsWith('google_drive://') ||
      Boolean(fileItem.previewExternalId);

    if (isGoogleDrivePreview) {
      const fileIdToAccess =
        fileItem.previewExternalId ||
        fileItem.externalId ||
        (previewPath.startsWith('google_drive://')
          ? previewPath.split('/').pop()
          : previewPath);

      if (!fileIdToAccess) {
        return NextResponse.json({ error: 'Google Drive preview ID missing' }, { status: 400 });
      }

      const { GoogleDriveProvider } = await import('@/lib/storage/providers/google-drive-provider');
      const providerInstance = new GoogleDriveProvider();

      try {
        const accessUrl = await providerInstance.getAccessUrl(creatorId, fileIdToAccess);
        return NextResponse.json({ signedUrl: accessUrl, accessUrl });
      } catch (gdErr: any) {
        console.error('Google Drive preview access error:', gdErr);
        return NextResponse.json(
          { error: gdErr?.message || 'Failed to retrieve Google Drive preview' },
          { status: 500 }
        );
      }
    }

    // Supabase preview access
    if (!previewPath || (!previewPath.startsWith(`previews/${deal.id}/`) && !previewPath.startsWith(`deals/${deal.id}/`))) {
      return NextResponse.json(
        { error: 'Preview file does not belong to this deal or path is invalid' },
        { status: 403 }
      );
    }

    const { data: signedUrlData, error: signError } = await admin.storage
      .from('deal-files')
      .createSignedUrl(previewPath, 60);

    if (signError || !signedUrlData?.signedUrl) {
      console.error('Error signing preview path:', signError);
      return NextResponse.json({ error: 'Failed to generate preview link' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (error: any) {
    console.error('Error in secure preview API:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
