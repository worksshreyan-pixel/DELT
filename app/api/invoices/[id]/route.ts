import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
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

    // Fetch the invoice along with its items
    const { data: invoice, error } = await admin
      .from('invoices')
      .select('*, items:invoice_items(*), deal:deals(title, token, client_name, client_email)')
      .eq('id', id)
      .maybeSingle();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // Verify ownership or client access
    // Only creator can access via this route in the creator UI.
    // Client will access via a different route or we verify client email.
    if (invoice.creator_id !== user.id) {
      // Let's also check if user is the client by email if we ever have authenticated clients
      if (invoice.deal?.client_email !== user.email) {
        return NextResponse.json({ error: 'Unauthorized to view this invoice.' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { items, notes, terms, issueDate, dueDate, discountAmount, taxAmount } = body;

    const admin = createAdminClient();

    // Verify ownership and status
    const { data: invoice } = await admin
      .from('invoices')
      .select('id, creator_id, status')
      .eq('id', id)
      .maybeSingle();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    if (invoice.creator_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this invoice.' }, { status: 403 });
    }

    if (invoice.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft invoices can be edited.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let subtotal = 0;

    // Validate and process line items
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const qty = parseInt(item.quantity);
        const price = parseFloat(item.unitPrice);
        if (isNaN(qty) || qty < 1) {
          return NextResponse.json({ error: 'Line item quantity must be a positive integer.' }, { status: 400 });
        }
        if (isNaN(price) || price < 0) {
          return NextResponse.json({ error: 'Line item unit price cannot be negative.' }, { status: 400 });
        }
      }

      await admin.from('invoice_items').delete().eq('invoice_id', id);

      const itemsToInsert = items.map((item: any, index: number) => {
        const qty = Math.max(1, parseInt(item.quantity) || 1);
        const price = Math.max(0, parseFloat(item.unitPrice) || 0);
        const lineTotal = Math.round(qty * price * 100) / 100;
        subtotal += lineTotal;
        return {
          invoice_id: id,
          description: (item.description || '').trim() || 'Item',
          quantity: qty,
          unit_price: price,
          line_total: lineTotal,
          sort_order: index,
        };
      });

      subtotal = Math.round(subtotal * 100) / 100;
      await admin.from('invoice_items').insert(itemsToInsert);
    }

    const rawDiscount = parseFloat(discountAmount);
    const rawTax = parseFloat(taxAmount);

    if (!isNaN(rawDiscount) && rawDiscount < 0) {
      return NextResponse.json({ error: 'Discount amount cannot be negative.' }, { status: 400 });
    }
    if (!isNaN(rawTax) && rawTax < 0) {
      return NextResponse.json({ error: 'Tax amount cannot be negative.' }, { status: 400 });
    }

    const validDiscount = Math.round((Math.max(0, isNaN(rawDiscount) ? 0 : rawDiscount)) * 100) / 100;
    const validTax = Math.round((Math.max(0, isNaN(rawTax) ? 0 : rawTax)) * 100) / 100;
    
    if (validDiscount > subtotal) {
      return NextResponse.json({ error: 'Discount cannot exceed subtotal.' }, { status: 400 });
    }
    
    const totalAmount = Math.round((subtotal - validDiscount + validTax) * 100) / 100;

    await admin.from('invoices').update({
      notes: notes || null,
      terms: terms || null,
      issue_date: issueDate || null,
      due_date: dueDate || null,
      discount_amount: validDiscount,
      tax_amount: validTax,
      subtotal: subtotal,
      total_amount: totalAmount,
      amount_due: totalAmount,
      updated_at: now,
    }).eq('id', id);

    const { data: updatedInvoice } = await admin
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', id)
      .single();

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
