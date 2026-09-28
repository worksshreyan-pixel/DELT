import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDescription } from '@/lib/utils';
import { resolveStorageProvider } from '@/lib/storage/resolver';
import { SupabaseStorageProvider } from '@/lib/storage/providers/supabase-provider';
import { storageRegistry } from '@/lib/storage/registry';

// Ensure provider is registered
storageRegistry.register(new SupabaseStorageProvider());

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    const admin = createAdminClient();

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { dealId, deliverableId, description, files, file } = body;

      if (!dealId) {
        return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
      }

      let filesToRegister: any[] = [];
      if (Array.isArray(files)) {
        filesToRegister = files;
      } else if (file) {
        filesToRegister = [file];
      }

      if (filesToRegister.length === 0) {
        return NextResponse.json({ error: 'No files to register' }, { status: 400 });
      }

      const { data: deal, error: dealError } = await admin
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .maybeSingle();

      if (dealError || !deal) {
        return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
      }

      // Check storage usage quota
      const { data: storageRecord } = await admin
        .from('storage_usage')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const totalUploadedBytes = filesToRegister.reduce((acc: number, f: any) => acc + Number(f.size || 0), 0);

      if (storageRecord) {
        const currentBytes = Number(storageRecord.total_bytes || 0);
        const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
        if (currentBytes + totalUploadedBytes > limitBytes) {
          return NextResponse.json(
            { error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' },
            { status: 413 }
          );
        }
      }

      // Determine deliverable ID
      let targetDeliverableId = deliverableId;
      if (!targetDeliverableId) {
        const { data: firstDeliv } = await admin
          .from('deliverables')
          .select('id')
          .eq('deal_id', dealId)
          .limit(1)
          .maybeSingle();
        targetDeliverableId = firstDeliv?.id;
      }

      if (!targetDeliverableId) {
        return NextResponse.json({ error: 'No deliverables found for this deal' }, { status: 400 });
      }

      // Fetch existing versions count for THIS specific deliverable
      const { count } = await admin
        .from('file_versions')
        .select('*', { count: 'exact', head: true })
        .eq('deliverable_id', targetDeliverableId);

      const versionNum = (count || 0) + 1;

      // Use explicit provider preference for this deal and enforce consistency
      const dealStorageProvider = deal.storage_provider || 'supabase';
      const provider = await resolveStorageProvider(user.id, dealId);
      if (provider.id !== dealStorageProvider) {
        return NextResponse.json(
          { error: `Mixed storage providers within a deal are not allowed. Deal requires ${dealStorageProvider}.` },
          { status: 400 }
        );
      }

      const uploadedFileItems = filesToRegister.map((f: any) => ({
        id: f.id || `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        size: Number(f.size || 0),
        type: f.type,
        path: f.path,
        previewPath: f.previewPath || undefined,
        previewType: f.previewType || undefined,
        previewStatus: f.previewStatus || undefined,
        previewProvider: f.previewProvider || (f.previewPath ? 'supabase' : undefined),
        previewGeneratedAt: f.previewGeneratedAt || (f.previewPath ? new Date().toISOString() : undefined),
        uploadSessionId: f.uploadSessionId,
        externalId: f.externalId,
      }));
      
      // 2. Verify Upload Sessions and call Provider's completeUpload
      const verifiedMetadata: any[] = [];
      const sessionIdsToComplete: string[] = [];
      
      for (const f of uploadedFileItems) {
        if (!f.uploadSessionId) {
          throw new Error(`Missing upload session ID for file ${f.name}`);
        }
        
        const { data: session } = await admin
          .from('upload_sessions')
          .select('*')
          .eq('id', f.uploadSessionId)
          .limit(1)
          .maybeSingle();

        if (!session) {
          throw new Error(`Upload session not found for file ${f.name}`);
        }
        
        if (session.status !== 'pending') {
           throw new Error(`Upload session ${f.uploadSessionId} is already ${session.status}`);
        }
        
        if (session.user_id !== user.id || session.deal_id !== dealId || session.deliverable_id !== targetDeliverableId) {
          throw new Error('Upload session ownership mismatch');
        }
        
        if (new Date() > new Date(session.expires_at)) {
          throw new Error('Upload session expired');
        }

        // Call Provider to verify external object (Google Drive verifies parent folder)
        const metadata = await provider.completeUpload(user.id, dealId, {
          signedUrl: session.session_uri,
          objectPath: (session.metadata as any)?.objectPath || f.path,
          externalObjectId: f.externalId,
        });

        verifiedMetadata.push({ fileItem: f, metadata, session });
        sessionIdsToComplete.push(session.id);
      }

      // 3. Database Sequential Operations (No generic cross-table RPC available)
      const { data: versionObj, error: verErr } = await admin.from('file_versions').insert({
        deliverable_id: targetDeliverableId,
        deal_id: dealId,
        version: versionNum,
        description: description?.trim() || 'Initial project deliverable files',
        uploader_id: user.id,
        uploader_name: user.user_metadata?.displayName || 'Creator',
        files: uploadedFileItems,
        status: 'pending_review',
        locked: true,
      }).select().single();

      if (verErr || !versionObj) {
        throw new Error(`Failed to create file version: ${verErr?.message}`);
      }

      const storageObjectInserts = verifiedMetadata.map(({ fileItem, metadata }) => ({
        deal_id: dealId,
        deliverable_id: targetDeliverableId,
        file_version_id: versionObj.id,
        provider: provider.id,
        ownership_type: provider.ownershipType,
        external_object_id: metadata.externalObjectId,
        external_url: metadata.externalUrl,
        object_path: metadata.objectPath || fileItem.path,
        name: fileItem.name,
        mime_type: fileItem.type,
        size: Number(fileItem.size || 0),
      }));

      const { error: soErr } = await admin.from('storage_objects').insert(storageObjectInserts);
      if (soErr) console.error('Failed to insert storage objects:', soErr);

      if (sessionIdsToComplete.length > 0) {
         await admin.from('upload_sessions')
           .update({ status: 'completed', updated_at: new Date().toISOString() })
           .in('id', sessionIdsToComplete);
      }

      await admin.from('deliverables')
        .update({ status: 'uploaded' })
        .eq('id', targetDeliverableId);

      const versionRecord = versionObj;

      // Trigger video preview generation
      for (const fileItem of uploadedFileItems) {
        if (fileItem.previewStatus === 'processing' && versionRecord) {
          const { generateVideoPreview } = await import('@/lib/video-preview');
          generateVideoPreview(dealId, versionRecord.id, fileItem.id).catch((err) => {
            console.error('[VIDEO_PREVIEW] Background generation task error:', err);
          });
        }
      }

      // Update storage usage
      if (storageRecord) {
        await admin
          .from('storage_usage')
          .update({
            total_bytes: Number(storageRecord.total_bytes || 0) + totalUploadedBytes,
            files_bytes: Number(storageRecord.files_bytes || 0) + totalUploadedBytes,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      // Deliverable status is updated in the transaction above

      // Create timeline event & system message
      await admin.from('deal_events').insert({
        deal_id: dealId,
        type: 'file_uploaded',
        actor_id: user.id,
        actor_name: user.user_metadata?.displayName || 'Creator',
        actor_role: 'creator',
        description: `Uploaded new version (v${versionNum}) of ${uploadedFileItems.map(f => f.name).join(', ')}.`,
      });

      await admin.from('deal_messages').insert({
        deal_id: dealId,
        sender_id: user.id,
        sender_name: user.user_metadata?.displayName || 'Creator',
        sender_role: 'creator',
        type: 'file',
        content: `Uploaded deliverable files (Version ${versionNum})`,
      });

      // Send client email notification
      try {
        if (deal?.client_email) {
          const { sendDeliverablesUploadedEmail } = await import('@/lib/email');
          const { getClientDealUrl, getCreatorUsername } = await import('@/lib/deal-url');
          const { data: creatorProfile } = await supabase.from('profiles').select('username, display_name, email').eq('id', deal.creator_id).maybeSingle();
          const creatorUsername = getCreatorUsername(creatorProfile);
          const canonicalDealUrl = getClientDealUrl(deal.code || deal.token || deal.id, creatorUsername);
          await sendDeliverablesUploadedEmail({
            clientName: deal.client_name || 'Client',
            clientEmail: deal.client_email,
            creatorName: user.user_metadata?.displayName || 'Creator',
            dealTitle: deal.title,
            versionNumber: versionNum,
            fileNames: uploadedFileItems.map(f => f.name),
            dealUrl: canonicalDealUrl,
          });
        }
      } catch (emailErr) {
        console.error('Error dispatching deliverable upload email:', emailErr);
      }

      return NextResponse.json({ success: true, version: versionRecord });
    }

    // Multipart form-data uploads are deprecated and disabled to prevent passing large file bytes through Vercel.
    // All uploads must use direct browser-to-Supabase Storage uploading via /api/files/upload/init
    return NextResponse.json(
      { error: 'Multipart file uploads are deprecated. Use direct storage upload flow.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in file upload route:', error);
    return NextResponse.json({ error: error?.message || 'File upload failed' }, { status: 500 });
  }
}
