import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { serializeDescription } from '@/lib/utils';
import { requireCreatorDealAccess } from '@/lib/deal-auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Deal code is required.' }, { status: 400 });
    }

    const resolution = await requireCreatorDealAccess(code);
    if (!resolution.authorized || !resolution.deal) {
      return NextResponse.json({ error: resolution.error || 'Unauthorized' }, { status: 403 });
    }

    const admin = createAdminClient();
    const deal = resolution.deal;
    const user = { id: deal.creatorId, user_metadata: { displayName: resolution.creator?.display_name || 'Creator' } };

    // 3. Parse and validate updates
    const body = await request.json();
    const { title, description, client_name, client_email, scope, price, currency, deadline, preview_enabled, preview_mode } = body;

    // Check payment status or completion status constraint
    const isPaidOrCompleted = 
      deal.paymentStatus === 'paid' || 
      deal.paymentStatus === 'completed' || 
      deal.status === 'completed';

    if (isPaidOrCompleted && price !== undefined && Number(price) !== Number(deal.price)) {
      return NextResponse.json(
        { error: 'Cannot change the price of a deal that has already been paid or completed.' },
        { status: 400 }
      );
    }

    // Validate price if specified
    if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
      return NextResponse.json({ error: 'Price must be a positive number.' }, { status: 400 });
    }

    // 4. Construct updates
    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined || preview_enabled !== undefined || preview_mode !== undefined) {
      const desc = description !== undefined ? description : deal.description || '';
      const prevEnabled = preview_enabled !== undefined ? preview_enabled : (deal.previewEnabled || false);
      let prevMode = preview_mode !== undefined ? preview_mode : (deal.previewMode || 'NONE');

      if (!prevEnabled) {
        prevMode = 'NONE';
      } else {
        const provider = deal.storageProvider || 'supabase';
        if (provider === 'google_drive') {
          if (prevMode !== 'EXTERNAL' && prevMode !== 'MANUAL') {
            prevMode = 'EXTERNAL';
          }
        } else {
          if (prevMode !== 'NONE' && prevMode !== 'AUTO' && prevMode !== 'MANUAL') {
            prevMode = 'NONE';
          }
        }
      }

      updates.description = serializeDescription(desc.trim() || null, prevEnabled);
      updates.preview_enabled = prevEnabled;
      updates.preview_mode = prevMode;
    }
    if (client_name !== undefined) updates.client_name = client_name.trim();
    if (client_email !== undefined) updates.client_email = client_email.trim().toLowerCase();
    if (scope !== undefined) {
      const newScopeList = Array.isArray(scope) ? scope : [scope];
      updates.scope = newScopeList;

      // Synchronize operational deliverables table safely
      try {
        const { data: existingDelivs } = await admin
          .from('deliverables')
          .select('id, name')
          .eq('deal_id', deal.id);

        const currentDelivs = existingDelivs || [];

        for (let i = 0; i < newScopeList.length; i++) {
          const item = newScopeList[i];
          if (i < currentDelivs.length) {
            if (currentDelivs[i].name !== item) {
              await admin
                .from('deliverables')
                .update({ name: item })
                .eq('id', currentDelivs[i].id);
            }
          } else {
            await admin.from('deliverables').insert({
              deal_id: deal.id,
              name: item,
              status: 'pending',
            });
          }
        }

        if (currentDelivs.length > newScopeList.length) {
          for (let i = newScopeList.length; i < currentDelivs.length; i++) {
            const extraDeliv = currentDelivs[i];
            const { data: versions } = await admin
              .from('file_versions')
              .select('id')
              .eq('deliverable_id', extraDeliv.id)
              .limit(1);

            if (!versions || versions.length === 0) {
              await admin.from('deliverables').delete().eq('id', extraDeliv.id);
            }
          }
        }
      } catch (syncErr) {
        console.error('Error synchronizing operational deliverables on scope update:', syncErr);
      }
    }
    if (price !== undefined) updates.price = price;
    if (currency !== undefined) updates.currency = currency;
    if (deadline !== undefined) updates.deadline = deadline || null;

    updates.updated_at = new Date().toISOString();
    updates.last_activity_at = new Date().toISOString();

    // 5. Apply updates
    const { data: updatedDeal, error: updateError } = await admin
      .from('deals')
      .update(updates)
      .eq('id', deal.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 6. Create timeline event
    const isScopeUpdate = scope !== undefined;
    await admin.from('deal_events').insert({
      deal_id: deal.id,
      type: isScopeUpdate ? 'scope_updated' : 'message_sent',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: isScopeUpdate ? 'Project scope updated by creator.' : 'Deal details updated by creator.',
      metadata: isScopeUpdate ? { scope_count: Array.isArray(scope) ? scope.length : 1 } : undefined,
    });

    // Also insert a system message in the chat
    await admin.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'creator',
      type: 'system',
      content: isScopeUpdate ? 'Project scope has been updated by the creator.' : 'Deal details have been updated by the creator.',
    });

    return NextResponse.json({
      success: true,
      deal: updatedDeal,
    });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
