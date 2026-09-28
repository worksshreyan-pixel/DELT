import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { storageRegistry } from '@/lib/storage/registry';
import { SupabaseStorageProvider } from '@/lib/storage/providers/supabase-provider';
import { resolveStorageProvider } from '@/lib/storage/resolver';
import { isUuid } from '@/lib/utils';
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

    if (!dealId || !fileName || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json({ error: 'Missing or invalid upload parameters' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Resolve authorized deal & internal UUID (accepts deals.id UUID or deal_code)
    let dealQuery = admin.from('deals').select('*').eq('creator_id', user.id);
    if (isUuid(dealId)) {
      dealQuery = dealQuery.eq('id', dealId);
    } else {
      dealQuery = dealQuery.eq('deal_code', dealId);
    }

    const { data: deal, error: dealError } = await dealQuery.maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found or unauthorized' }, { status: 403 });
    }

    const canonicalDealId = deal.id; // Guaranteed to be the internal database UUID

    // 2. Resolve authorized deliverable UUID
    let canonicalDeliverableId = deliverableId;

    if (!isUuid(canonicalDeliverableId)) {
      // Find an existing active deliverable for this deal
      const { data: existingDelivs } = await admin
        .from('deliverables')
        .select('id')
        .eq('deal_id', canonicalDealId)
        .not('name', 'like', '[DELETED]%')
        .order('created_at', { ascending: true });

      if (existingDelivs && existingDelivs.length > 0) {
        canonicalDeliverableId = existingDelivs[0].id;
      } else {
        // Auto-create a primary deliverable row for this deal
        const { data: newDeliv, error: delivErr } = await admin
          .from('deliverables')
          .insert({
            deal_id: canonicalDealId,
            name: 'Project Deliverables',
            status: 'pending',
          })
          .select('id')
          .single();

        if (delivErr || !newDeliv) {
          return NextResponse.json({ error: 'Failed to resolve or create deliverable for upload' }, { status: 500 });
        }
        canonicalDeliverableId = newDeliv.id;
      }
    } else {
      // Verify deliverable belongs to this deal
      const { data: delivCheck } = await admin
        .from('deliverables')
        .select('id')
        .eq('id', canonicalDeliverableId)
        .eq('deal_id', canonicalDealId)
        .maybeSingle();

      if (!delivCheck) {
        const { data: existingDelivs } = await admin
          .from('deliverables')
          .select('id')
          .eq('deal_id', canonicalDealId)
          .not('name', 'like', '[DELETED]%')
          .order('created_at', { ascending: true });

        if (existingDelivs && existingDelivs.length > 0) {
          canonicalDeliverableId = existingDelivs[0].id;
        } else {
          const { data: newDeliv } = await admin
            .from('deliverables')
            .insert({
              deal_id: canonicalDealId,
              name: 'Project Deliverables',
              status: 'pending',
            })
            .select('id')
            .single();
          if (newDeliv) canonicalDeliverableId = newDeliv.id;
        }
      }
    }

    if (!isUuid(canonicalDealId) || !isUuid(canonicalDeliverableId)) {
      return NextResponse.json({ error: 'Invalid deal or deliverable identity' }, { status: 400 });
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

    // Fetch existing versions count for this specific deliverable
    const { count } = await admin
      .from('file_versions')
      .select('*', { count: 'exact', head: true })
      .eq('deliverable_id', canonicalDeliverableId);

    const versionNum = (count || 0) + 1;

    // Fetch authoritative deal storage provider
    const { data: dealRow } = await admin
      .from('deals')
      .select('storage_provider')
      .eq('id', canonicalDealId)
      .maybeSingle();

    const dealStorageProvider = dealRow?.storage_provider || 'supabase';

    // Use explicit provider preference for this deal (previews use DELT Storage / Supabase)
    const provider = isPreview
      ? storageRegistry.getProvider('supabase')
      : await resolveStorageProvider(user.id, canonicalDealId);

    if (!isPreview && provider.id !== dealStorageProvider) {
      return NextResponse.json(
        { error: `Mixed storage providers within a deal are not allowed. Deal requires ${dealStorageProvider}.` },
        { status: 400 }
      );
    }
    
    if (!provider.capabilities.canUpload) {
       return NextResponse.json({ error: 'Selected provider does not support uploads' }, { status: 400 });
    }

    const uploadInit = await provider.initializeUpload(
      user.id,
      canonicalDealId,
      { name: fileName, size: fileSize },
      { isPreview, versionNum }
    );

    // Create a pending upload session with REAL database UUIDs
    const { data: newSession, error: insertError } = await admin.from('upload_sessions').insert({
      user_id: user.id,
      deal_id: canonicalDealId,
      deliverable_id: canonicalDeliverableId,
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
      expires_at: addHours(new Date(), 24).toISOString()
    }).select('id').single();
    
    if (insertError || !newSession) {
      console.error('Error creating upload session:', insertError);
      return NextResponse.json(
        { error: 'Unable to start this upload session. Please retry.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: uploadInit.signedUrl,
      filePath: uploadInit.objectPath,
      provider: provider.id,
      versionNum,
      uploadSessionId: newSession.id,
      dealId: canonicalDealId,
      deliverableId: canonicalDeliverableId
    });
  } catch (error: any) {
    console.error('Error in file upload init route:', error);
    return NextResponse.json({ error: 'Unable to start this upload. Please retry.' }, { status: 500 });
  }
}
