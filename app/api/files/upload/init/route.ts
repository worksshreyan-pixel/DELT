import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { storageRegistry } from '@/lib/storage/registry';
import { SupabaseStorageProvider } from '@/lib/storage/providers/supabase-provider';
import { resolveStorageProvider } from '@/lib/storage/resolver';
import { addHours } from 'date-fns';

// Ensure the provider is registered
storageRegistry.register(new SupabaseStorageProvider());

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dealId, deliverableId, fileName, fileSize, isPreview } = body;

    if (!dealId || !deliverableId || !fileName || typeof fileSize !== 'number') {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

    // Use explicit provider preference for this deal
    const provider = await resolveStorageProvider(user.id, dealId);
    
    if (!provider.capabilities.canUpload) {
       return NextResponse.json({ error: 'Selected provider does not support uploads' }, { status: 400 });
    }

    const uploadInit = await provider.initializeUpload(
      user.id,
      dealId,
      { name: fileName, size: fileSize },
      { isPreview, versionNum }
    );

    // Create a pending upload session
    const { data: newSession, error: insertError } = await admin.from('upload_sessions').insert({
      user_id: user.id,
      deal_id: dealId,
      deliverable_id: deliverableId,
      provider: provider.id,
      session_uri: uploadInit.signedUrl || '',
      status: 'pending',
      metadata: {
        fileName,
        fileSize,
        isPreview,
        versionNum,
        objectPath: uploadInit.objectPath,
      },
      expires_at: addHours(new Date(), 24).toISOString() // 24 hours expiry for sessions
    }).select('id').single();
    
    if (insertError || !newSession) {
      throw new Error(`Failed to create upload session: ${insertError?.message || 'Unknown error'}`);
    }

    return NextResponse.json({
      signedUrl: uploadInit.signedUrl,
      filePath: uploadInit.objectPath,
      provider: provider.id,
      versionNum,
      uploadSessionId: newSession.id
    });
  } catch (error: any) {
    console.error('Error in file upload init route:', error);
    return NextResponse.json({ error: error?.message || 'Upload initialization failed' }, { status: 500 });
  }
}
