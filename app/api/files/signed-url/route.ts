import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyClientSessionToken } from '@/lib/otp';
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
      const { data: deal, error: dealError } = await admin
        .from('deals')
        .select('*')
        .eq('id', dealId)
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
    const expectedClientEmail = (deal.client_email || '').trim().toLowerCase();
    const creatorId = deal.creator_id;

    // Check creator session
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check client session token
    const clientSessionHeader = request.headers.get('x-client-session-token');
    const hasValidClientToken = clientSessionHeader
      ? verifyClientSessionToken(clientSessionHeader, deal.token, expectedClientEmail)
      : false;

    let isAuthorizedCreator = false;
    let isAuthorizedClient = false;

    if (user) {
      const userEmail = (user.email || '').trim().toLowerCase();
      isAuthorizedClient = userEmail === expectedClientEmail;
      isAuthorizedCreator = user.id === creatorId;
    } else if (hasValidClientToken) {
      isAuthorizedClient = true;
    }

    // Guard access
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
      .eq('deal_id', dealId);

    let targetFileItem: any = null;
    if (fileVersions) {
      for (const version of fileVersions) {
        const filesList = Array.isArray(version.files) ? version.files : [];
        const found = filesList.find((f: any) => f.path === filePath);
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

    // 4. Check payment authorization for clients
    const isPaid = deal.payment_status === 'paid' || deal.status === 'completed';
    if (!isCreator && !isAuthorizedCreator && !isPaid) {
      return NextResponse.json(
        { error: 'Files are locked. Complete payment to download deliverables.' },
        { status: 403 }
      );
    }

    // 5. Generate short-lived signed URL (60 seconds) from provider
    // Check if targetFileItem specifies ownership/provider
    const ownershipType = targetFileItem?.ownershipType || 'DELT_MANAGED';
    const providerId = targetFileItem?.provider || 'supabase';
    
    const provider = storageRegistry.getProvider(providerId);
    
    // The provider's getAccessUrl returns a temporary URL
    const accessUrl = await provider.getAccessUrl('system', filePath);

    return NextResponse.json({ signedUrl: accessUrl });
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
