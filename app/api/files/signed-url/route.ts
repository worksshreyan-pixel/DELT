import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireClientDealAccess } from '@/lib/deal-auth';
import { isUuid } from '@/lib/utils';
import { storageRegistry } from '@/lib/storage/registry';
import { SupabaseStorageProvider } from '@/lib/storage/providers/supabase-provider';

// Ensure provider is registered
storageRegistry.register(new SupabaseStorageProvider());

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, isUpload } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    if (isUpload) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const admin = createAdminClient();
      let dealQuery = admin.from('deals').select('*');
      if (isUuid(dealId)) {
        dealQuery = dealQuery.eq('id', dealId);
      } else {
        dealQuery = dealQuery.or(`deal_code.eq.${dealId},token.eq.${dealId}`);
      }
      const { data: deal, error: dealError } = await dealQuery
        .eq('creator_id', user.id)
        .maybeSingle();

      if (dealError || !deal) {
        return NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 403 });
      }

      const fileName = body.fileName || 'file';
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const isPreview = body.isPreview === true;
      const version = body.version || 1;
      const provider = storageRegistry.getDefaultProvider();
      const uploadInit = await provider.initializeUpload(
        user.id,
        dealId,
        { name: fileName, size: 0 },
        { isPreview, versionNum: version }
      );

      return NextResponse.json({
        signedUrl: uploadInit.signedUrl,
        filePath: uploadInit.objectPath,
        provider: provider.id
      });
    }

    const { token, filePath, isCreator } = body;
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal to verify existence and retrieve expected email/status
    let query = admin.from('deals').select('*');
    if (dealId) {
      query = query.eq('id', dealId);
    }
    if (token) {
      query = query.or(`token.eq.${token},deal_code.eq.${token}`);
    }
    const { data: deal, error: dealError } = await query.maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // 2. Validate Authorization
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthorizedCreator = Boolean(user && user.id === deal.creator_id);
    const clientAuth = await requireClientDealAccess(request, deal.id);
    const isAuthorizedClient = Boolean(clientAuth.authorized);

    if (isCreator && !isAuthorizedCreator) {
      return NextResponse.json({ error: 'Unauthorized creator access' }, { status: 403 });
    }
    if (!isCreator && !isAuthorizedClient && !isAuthorizedCreator) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    // 3. Find file in versions to check retention/deletion status
    const { data: fileVersions } = await admin
      .from('file_versions')
      .select('*')
      .eq('deal_id', deal.id);

    let targetFileItem: any = null;
    if (fileVersions) {
      for (const version of fileVersions) {
        const filesList = Array.isArray(version.files) ? version.files : [];
        const found = filesList.find((f: any) => f.path === filePath || f.externalId === filePath || f.id === filePath);
        if (found) {
          targetFileItem = found;
          break;
        }
      }
    }

    if (targetFileItem) {
      if (targetFileItem.deletionStatus === 'deleted') {
        return NextResponse.json(
          { error: 'File has been deleted according to the retention policy.' },
          { status: 410 }
        );
      }
    }

    // 4. Check payment authorization or OPEN_ORIGINAL preview mode authorization for clients
    const isPaid = deal.payment_status === 'paid' || deal.status === 'completed';
    const parsedDesc = typeof deal.description === 'string' ? deal.description : '';
    const isPreviewEnabled = Boolean(deal.preview_enabled || parsedDesc.includes('[PREVIEW_ENABLED:true]'));
    const isOriginalDownloadAllowedForUnpaid = isPreviewEnabled && deal.preview_mode === 'OPEN_ORIGINAL';

    if (!isCreator && !isAuthorizedCreator && !isPaid && !isOriginalDownloadAllowedForUnpaid) {
      return NextResponse.json(
        { error: 'Files are locked. Complete payment to download deliverables.' },
        { status: 403 }
      );
    }

    // 5. Query storage_objects to resolve authoritative provider & external details
    const { data: storageObjects } = await admin
      .from('storage_objects')
      .select('*')
      .eq('deal_id', deal.id);

    let storageObj = storageObjects?.find(
      (so: any) =>
        so.object_path === filePath ||
        so.external_object_id === filePath ||
        (targetFileItem && targetFileItem.externalId && so.external_object_id === targetFileItem.externalId) ||
        (targetFileItem && targetFileItem.id && so.id === targetFileItem.id)
    );

    const providerId = storageObj?.provider || targetFileItem?.provider || deal.storage_provider || 'supabase';

    if (providerId === 'google_drive') {
      const externalObjectId = storageObj?.external_object_id || targetFileItem?.externalId || filePath;
      const provider = storageRegistry.getProvider('google_drive');
      
      try {
        const accessUrl = await provider.getAccessUrl(deal.creator_id, externalObjectId);
        return NextResponse.json({
          type: 'external_url',
          signedUrl: accessUrl,
          url: accessUrl,
          provider: 'google_drive',
        });
      } catch (gdErr: any) {
        return NextResponse.json(
          { error: gdErr?.message || 'This Google Drive file is no longer available.' },
          { status: 404 }
        );
      }
    }

    // Default: Supabase storage provider
    try {
      const provider = storageRegistry.getProvider('supabase');
      const accessUrl = await provider.getAccessUrl(deal.creator_id, filePath);

      return NextResponse.json({
        type: 'signed_url',
        signedUrl: accessUrl,
        url: accessUrl,
        provider: 'supabase',
      });
    } catch (spErr: any) {
      return NextResponse.json(
        { error: 'This DELT file is no longer available.' },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
