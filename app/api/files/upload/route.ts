import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const dealId = formData.get('dealId') as string;
    const deliverableId = formData.get('deliverableId') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File | null;

    if (!dealId || !file) {
      return NextResponse.json({ error: 'Deal ID and file are required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Check storage usage quota
    const { data: storageRecord } = await admin
      .from('storage_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (storageRecord) {
      const currentBytes = Number(storageRecord.total_bytes || 0);
      const limitBytes = Number(storageRecord.limit_bytes || 1073741824);
      if (currentBytes + file.size > limitBytes) {
        return NextResponse.json(
          { error: 'Storage quota exceeded. Please upgrade your plan or add storage to upload more files.' },
          { status: 413 }
        );
      }
    }

    // 2. Fetch existing versions count for deliverable
    const { count } = await admin
      .from('file_versions')
      .select('*', { count: 'exact', head: true })
      .eq('deal_id', dealId);

    const versionNum = (count || 0) + 1;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${dealId}/v${versionNum}/${Date.now()}_${cleanFileName}`;

    // 3. Upload to private Supabase bucket 'deal-files'
    const { error: uploadError } = await admin.storage
      .from('deal-files')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    const fileItem = {
      id: `f_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      path: storagePath,
    };

    // 4. Insert file_version record
    const { data: versionRecord, error: versionError } = await admin
      .from('file_versions')
      .insert({
        deliverable_id: deliverableId,
        deal_id: dealId,
        version: versionNum,
        description: description?.trim() || null,
        uploader_id: user.id,
        uploader_name: user.user_metadata?.displayName || 'Creator',
        files: [fileItem],
        status: 'pending_review',
        locked: true,
      })
      .select()
      .single();

    if (versionError) {
      return NextResponse.json({ error: versionError.message }, { status: 500 });
    }

    // 5. Update user storage usage
    if (storageRecord) {
      await admin
        .from('storage_usage')
        .update({
          total_bytes: Number(storageRecord.total_bytes || 0) + file.size,
          files_bytes: Number(storageRecord.files_bytes || 0) + file.size,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // 6. Create timeline event & system message
    await admin.from('deal_events').insert({
      deal_id: dealId,
      type: 'file_uploaded',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: `Uploaded new version (v${versionNum}) of ${file.name}.`,
    });

    await admin.from('deal_messages').insert({
      deal_id: dealId,
      sender_id: user.id,
      sender_name: user.user_metadata?.displayName || 'Creator',
      sender_role: 'creator',
      type: 'file',
      content: `Uploaded deliverable files (Version ${versionNum})`,
    });

    return NextResponse.json({ success: true, version: versionRecord });
  } catch (error: any) {
    console.error('Error in file upload route:', error);
    return NextResponse.json({ error: error?.message || 'File upload failed' }, { status: 500 });
  }
}
