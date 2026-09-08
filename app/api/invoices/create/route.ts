import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const { dealId } = body;

    if (!dealId) {
      return NextResponse.json({ error: 'Missing required dealId.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify user owns the deal
    const { data: deal } = await admin
      .from('deals')
      .select('id, creator_id, client_id, currency, price, title')
      .eq('id', dealId)
      .eq('creator_id', user.id)
      .maybeSingle();

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found or unauthorized.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    
    let invoice: any = null;
    let invoiceError: any = null;
    
    for (let attempt = 0; attempt < 5; attempt++) {
      const invoiceNumber = `INV-${Array.from({length: 8}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('')}`;
      
      const { data, error } = await admin
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          deal_id: deal.id,
          creator_id: user.id,
          client_id: deal.client_id,
          status: 'draft',
          type: 'standard',
          currency: deal.currency || 'INR',
          issue_date: now,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
          subtotal: 0,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 0,
          amount_paid: 0,
          amount_due: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
        
      if (error) {
        invoiceError = error;
        if (error.code === '23505' || (error.message && error.message.includes('invoice_number'))) {
          continue;
        }
        break;
      }
      
      invoice = data;
      invoiceError = null;
      break;
    }

    if (invoiceError || !invoice) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json({ error: invoiceError?.message || 'Failed to create invoice' }, { status: 500 });
    }

    // Add a default line item
    await admin.from('invoice_items').insert({
      invoice_id: invoice.id,
      description: deal.title || 'Professional Services',
      quantity: 1,
      unit_price: deal.price || 0,
      line_total: deal.price || 0,
      sort_order: 0,
    });
    
    // Update invoice totals based on the line item
    await admin.from('invoices').update({
      subtotal: deal.price || 0,
      total_amount: deal.price || 0,
      amount_due: deal.price || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', invoice.id);

    // Fetch the updated invoice with items
    const { data: updatedInvoice } = await admin
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', invoice.id)
      .single();

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
