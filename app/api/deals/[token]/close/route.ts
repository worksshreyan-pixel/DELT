import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const idOrToken = params.token;
    if (!idOrToken) {
      return NextResponse.json({ error: 'Deal ID or token is required.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch deal by id OR token
    let query = admin.from('deals').select('*');
    if (idOrToken.startsWith('dlt_') || idOrToken.startsWith('dl_')) {
      query = query.eq('token', idOrToken);
    } else {
      query = query.eq('id', idOrToken);
    }

    const { data: deal, error: dealError } = await query.maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found.' }, { status: 404 });
    }

    // 2. Authorize creator
    if (deal.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator of this Deal can close and delete it.' },
        { status: 403 }
      );
    }

    const dealId = deal.id;

    // 3. Cascade delete associated Supabase Storage objects
    try {
      const { data: folderItems } = await admin.storage.from('deal-files').list(dealId);
      if (folderItems && folderItems.length > 0) {
        // Collect all file paths recursively
        const filePaths: string[] = [];
        for (const item of folderItems) {
          if (item.id) {
            filePaths.push(`${dealId}/${item.name}`);
          }
          // Also check subfolders if any (e.g. v1, v2)
          const { data: subItems } = await admin.storage.from('deal-files').list(`${dealId}/${item.name}`);
          if (subItems && subItems.length > 0) {
            for (const sub of subItems) {
              filePaths.push(`${dealId}/${item.name}/${sub.name}`);
            }
          }
        }
        if (filePaths.length > 0) {
          await admin.storage.from('deal-files').remove(filePaths);
        }
      }
    } catch (storageErr) {
      console.warn('Storage files cleanup notice:', storageErr);
    }

    // 4. Cascade delete database records in dependency order
    await admin.from('deal_messages').delete().eq('deal_id', dealId);
    await admin.from('deal_events').delete().eq('deal_id', dealId);
    await admin.from('price_proposals').delete().eq('deal_id', dealId);
    await admin.from('file_versions').delete().eq('deal_id', dealId);
    await admin.from('deliverables').delete().eq('deal_id', dealId);
    await admin.from('deal_participants').delete().eq('deal_id', dealId);
    await admin.from('deal_otps').delete().eq('deal_id', dealId);
    await admin.from('notifications').delete().eq('deal_id', dealId);

    // 5. Permanently delete the deal record
    const { error: deleteError } = await admin
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete deal record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deal closed and permanently deleted.',
      dealId: dealId,
    });
  } catch (error: any) {
    console.error('Error closing and deleting deal:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error closing deal.' },
      { status: 500 }
    );
  }
}
