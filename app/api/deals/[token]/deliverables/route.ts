import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal by token
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // 2. Authorize creator
    if (deal.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the creator of this Deal can add deliverables.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Deliverable name is required.' }, { status: 400 });
    }

    // 3. Create deliverable
    const { data: newDeliv, error: createError } = await admin
      .from('deliverables')
      .insert({
        deal_id: deal.id,
        name: name.trim(),
        description: description?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 4. Create timeline event & system message
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: 'message_sent',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: `New deliverable "${newDeliv.name}" added by creator.`,
    });

    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'creator',
      type: 'system',
      content: `Deliverable "${newDeliv.name}" has been added by the creator.`,
    });

    return NextResponse.json({ success: true, deliverable: newDeliv });
  } catch (error: any) {
    console.error('Error adding deliverable:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Deal token is required.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal by token
    const { data: deal, error: dealError } = await admin
      .from('deals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // 2. Authorize creator
    if (deal.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the creator of this Deal can modify deliverables.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, deliverableId, name, description } = body;

    if (!deliverableId) {
      return NextResponse.json({ error: 'Deliverable ID is required.' }, { status: 400 });
    }

    // Fetch deliverable
    const { data: deliverable, error: delError } = await admin
      .from('deliverables')
      .select('*')
      .eq('id', deliverableId)
      .eq('deal_id', deal.id)
      .maybeSingle();

    if (delError || !deliverable) {
      return NextResponse.json({ error: 'Deliverable not found.' }, { status: 404 });
    }

    if (action === 'rename') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Deliverable name is required.' }, { status: 400 });
      }

      const { data: updatedDel, error: updateError } = await admin
        .from('deliverables')
        .update({
          name: name.trim(),
          description: description !== undefined ? (description.trim() || null) : deliverable.description,
        })
        .eq('id', deliverableId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Create event and message
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'message_sent',
        actor_id: user.id,
        actor_name: user.user_metadata?.displayName || 'Creator',
        actor_role: 'creator',
        description: `Deliverable renamed from "${deliverable.name}" to "${updatedDel.name}".`,
      });

      await admin.from('deal_messages').insert({
        deal_id: deal.id,
        sender_id: 'system',
        sender_name: 'DELT System',
        sender_role: 'creator',
        type: 'system',
        content: `Deliverable "${deliverable.name}" was renamed to "${updatedDel.name}".`,
      });

      return NextResponse.json({ success: true, deliverable: updatedDel });
    } else if (action === 'delete') {
      const { env } = await import('@/lib/env');
      const retentionDays = env.app.fileRetentionDays || 7;
      const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

      // 1. Mark files of all associated versions as retention
      const { data: fileVersions } = await admin
        .from('file_versions')
        .select('*')
        .eq('deliverable_id', deliverableId);

      if (fileVersions) {
        for (const version of fileVersions) {
          const filesList = Array.isArray(version.files) ? version.files : [];
          const updatedFiles = filesList.map((f: any) => ({
            ...f,
            deletionStatus: 'retention',
            retentionUntil,
          }));
          await admin
            .from('file_versions')
            .update({ files: updatedFiles })
            .eq('id', version.id);
        }
      }

      // 2. Soft-delete deliverable by changing name prefix
      const deletedName = `[DELETED]_${Date.now()}_${deliverable.name}`;
      const { data: deletedDel, error: deleteError } = await admin
        .from('deliverables')
        .update({ name: deletedName })
        .eq('id', deliverableId)
        .select()
        .single();

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      // Create timeline event and system message
      await admin.from('deal_events').insert({
        deal_id: deal.id,
        type: 'message_sent',
        actor_id: user.id,
        actor_name: user.user_metadata?.displayName || 'Creator',
        actor_role: 'creator',
        description: `Deliverable "${deliverable.name}" deleted by creator.`,
      });

      await admin.from('deal_messages').insert({
        deal_id: deal.id,
        sender_id: 'system',
        sender_name: 'DELT System',
        sender_role: 'creator',
        type: 'system',
        content: `Deliverable "${deliverable.name}" was deleted by the creator. All associated files entered a ${retentionDays}-day retention period.`,
      });

      return NextResponse.json({ success: true, deliverableId });
    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error modifying deliverable:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
