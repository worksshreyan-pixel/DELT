import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyClientSessionToken } from '@/lib/otp';
import { parseDescription } from '@/lib/utils';

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

    // 1. Fetch deal to verify existence and retrieve expected email
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .eq('token', token)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found or invalid token' }, { status: 404 });
    }

    // 2. Validate Client Authorization
    const expectedClientEmail = (deal.client_email || '').trim().toLowerCase();
    const creatorId = deal.creator_id;

    // Check creator session
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check client session token
    const clientSessionHeader = request.headers.get('x-client-session-token');
    const { verifyClientSessionToken: verifyToken } = await import('@/lib/otp');
    const hasValidClientToken = clientSessionHeader
      ? verifyToken(clientSessionHeader, token, expectedClientEmail)
      : false;

    let isCreator = false;
    let isClient = false;

    if (user) {
      const userEmail = (user.email || '').trim().toLowerCase();
      isClient = userEmail === expectedClientEmail;
      isCreator = user.id === creatorId;
    } else if (hasValidClientToken) {
      isClient = true;
    }

    if (!isCreator && !isClient) {
      return NextResponse.json({ error: 'Unauthorized access to file preview' }, { status: 403 });
    }

    const parsed = parseDescription(deal.description);
    if (!isCreator && !parsed.previewEnabled) {
      return NextResponse.json({ error: 'Previews are disabled for this deal' }, { status: 403 });
    }

    // 3. Retrieve file version and verify preview path
    const { data: version, error: versionError } = await admin
      .from('file_versions')
      .select('*')
      .eq('id', fileVersionId)
      .eq('deal_id', dealId)
      .maybeSingle();

    if (versionError || !version) {
      console.log(`[PREVIEW_REQUEST]\ndeliverableId=`);
      return NextResponse.json({ error: 'File version not found' }, { status: 404 });
    }

    // Verify deliverable belongs to the deal
    const { data: deliverable, error: delError } = await admin
      .from('deliverables')
      .select('*')
      .eq('id', version.deliverable_id)
      .eq('deal_id', dealId)
      .maybeSingle();

    if (delError || !deliverable) {
      return NextResponse.json({ error: 'Deliverable does not belong to this deal' }, { status: 403 });
    }

    console.log(`[PREVIEW_REQUEST]
deliverableId=${version.deliverable_id || ''}`);

    const files = Array.isArray(version.files) ? version.files : [];
    const fileItem = files.find((f: any) => f.id === fileId);

    if (!fileItem) {
      return NextResponse.json({ error: 'File not found in this version' }, { status: 404 });
    }

    console.log(`[PREVIEW_RESOLUTION]
dealId=${dealId}
previewPath=${fileItem.previewPath || ''}
previewType=${fileItem.previewType || ''}
previewStatus=${fileItem.previewStatus || ''}`);

    if (fileItem.previewStatus !== 'ready') {
      return NextResponse.json(
        { error: 'Preview is not ready for viewing' },
        { status: 400 }
      );
    }

    if (!fileItem.previewPath || !fileItem.previewPath.startsWith(`previews/${dealId}/`)) {
      return NextResponse.json(
        { error: 'Preview file does not belong to this deal or path is invalid' },
        { status: 403 }
      );
    }

    // 4. Generate signed URL for preview (60 seconds expiry)
    const { data: signedUrlData, error: signError } = await admin.storage
      .from('deal-files')
      .createSignedUrl(fileItem.previewPath, 60);

    console.log(`[PREVIEW_SIGNED_URL]
success=${!!signedUrlData?.signedUrl}
error=${signError ? (signError.message || JSON.stringify(signError)) : ''}`);

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
