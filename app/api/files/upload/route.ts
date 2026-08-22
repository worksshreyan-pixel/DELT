import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDescription } from '@/lib/utils';

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

      // Fetch existing versions count for deliverable
      const { count } = await admin
        .from('file_versions')
        .select('*', { count: 'exact', head: true })
        .eq('deal_id', dealId);

      const versionNum = (count || 0) + 1;

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

      const uploadedFileItems = filesToRegister.map((f: any) => ({
        id: f.id || `f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        size: Number(f.size || 0),
        type: f.type,
        path: f.path,
        previewPath: f.previewPath || undefined,
        previewType: f.previewType || undefined,
        previewStatus: f.previewStatus || undefined,
        previewGeneratedAt: f.previewGeneratedAt || (f.previewPath ? new Date().toISOString() : undefined),
      }));

      // Insert file_version record
      const { data: versionRecord, error: versionError } = await admin
        .from('file_versions')
        .insert({
          deliverable_id: targetDeliverableId,
          deal_id: dealId,
          version: versionNum,
          description: description?.trim() || 'Initial project deliverable files',
          uploader_id: user.id,
          uploader_name: user.user_metadata?.displayName || 'Creator',
          files: uploadedFileItems,
          status: 'pending_review',
          locked: true,
        })
        .select()
        .single();

      if (versionError) {
        return NextResponse.json({ error: versionError.message }, { status: 500 });
      }

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
          const canonicalDealUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${deal.token}`;
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
