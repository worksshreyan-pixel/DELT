import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireClientDealAccess } from '@/lib/deal-auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { dealToken } = body;

    const admin = createAdminClient();

    // Fetch the invoice along with its items and deal info
    const { data: invoice, error } = await admin
      .from('invoices')
      .select('*, items:invoice_items(*), deal:deals(id, title, token, client_name, client_email, creator_id)')
      .eq('id', id)
      .maybeSingle();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // Verify client authorization securely via requireClientDealAccess
    const authResult = await requireClientDealAccess(request, invoice.deal_id);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized to view this invoice.' }, { status: 403 });
    }

    // Do not expose draft invoices to clients
    if (invoice.status === 'draft') {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // If invoice is newly viewed by client, transition issued -> viewed and log audit event
    if (invoice.status === 'issued' || invoice.status === 'sent') {
      const now = new Date().toISOString();
      await admin.from('invoices').update({
        status: 'viewed',
        updated_at: now,
      }).eq('id', id);

      invoice.status = 'viewed';

      await admin.from('deal_events').insert({
        deal_id: invoice.deal_id,
        type: 'invoice_viewed',
        actor_id: invoice.deal?.client_email || 'client',
        actor_name: invoice.deal?.client_name || 'Client',
        actor_role: 'client',
        description: `Client viewed invoice ${invoice.invoice_number}.`,
      });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error fetching client invoice:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
