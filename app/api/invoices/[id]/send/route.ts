import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: invoice } = await admin
      .from('invoices')
      .select('id, creator_id, status, deal_id, invoice_number, total_amount')
      .eq('id', id)
      .maybeSingle();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    if (invoice.creator_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft invoices can be sent.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Transition to SENT
    await admin.from('invoices').update({
      status: 'sent',
      updated_at: now,
    }).eq('id', id);

    // Record Deal Event
    await admin.from('deal_events').insert({
      deal_id: invoice.deal_id,
      type: 'invoice_sent',
      actor_id: user.id,
      actor_name: user.user_metadata?.displayName || 'Creator',
      actor_role: 'creator',
      description: `Invoice ${invoice.invoice_number} sent for ${invoice.total_amount}.`,
    });

    // We can also create a notification here or send an email.
    // For now, rely on standard deal event propagation.

    return NextResponse.json({ success: true, status: 'sent' });
  } catch (error: any) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
