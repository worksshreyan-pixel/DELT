import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Idempotently ensures that an invoice exists for a completed + paid deal.
 * If one exists, it returns it.
 * If not, it generates a finalized invoice using the deal's transaction/payment data.
 */
export async function ensureInvoiceForDeal(dealId: string) {
  const admin = createAdminClient();

  // 1. Fetch deal to verify state
  const { data: deal, error: dealError } = await admin
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .maybeSingle();

  if (dealError || !deal) {
    console.error('ensureInvoiceForDeal: Deal not found', dealError);
    return null;
  }

  // 2. Validate triggering condition: completed AND paid
  if (deal.status !== 'completed' || deal.payment_status !== 'paid') {
    return null;
  }

  // 3. Check if invoice already exists
  const { data: existingInvoice } = await admin
    .from('invoices')
    .select('*')
    .eq('deal_id', deal.id)
    .neq('status', 'draft')
    .maybeSingle();

  if (existingInvoice) {
    return existingInvoice;
  }

  // 4. Missing invoice. Let's gather payment data.
  // We check for the latest transaction record.
  const { data: transaction } = await admin
    .from('transactions')
    .select('*')
    .eq('deal_id', deal.id)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Also check payments for promo code info if present
  let promoCode = null;
  let orderId = null;
  let paymentId = null;
  
  if (transaction && transaction.payment_id) {
    const { data: paymentRecord } = await admin
      .from('payments')
      .select('*')
      .eq('id', transaction.payment_id)
      .maybeSingle();
      
    if (paymentRecord) {
      promoCode = paymentRecord.promo_code || null;
      orderId = paymentRecord.order_id || null;
      paymentId = paymentRecord.payment_id || null;
    }
  } else {
    // If no transaction, check payments directly
    const { data: latestPayment } = await admin
      .from('payments')
      .select('*')
      .eq('deal_id', deal.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (latestPayment) {
      promoCode = latestPayment.promo_code || null;
      orderId = latestPayment.order_id || null;
      paymentId = latestPayment.payment_id || null;
    }
  }

  const originalAmount = Number(deal.price) || 0;
  // If transaction exists, it gives us the net final amount. Otherwise assume original amount or 0 if promo.
  const finalAmount = transaction ? Number(transaction.amount) : (promoCode && Number(deal.price) > 0 ? 0 : originalAmount);
  const discountAmount = Math.max(0, originalAmount - finalAmount);

  const now = new Date().toISOString();
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  const invoiceNumber = `INV-${randomChars}`;

  // 5. Create the invoice
  const { data: newInvoice, error: insertError } = await admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      deal_id: deal.id,
      creator_id: deal.creator_id,
      client_id: deal.client_id,
      status: 'paid',
      type: 'standard',
      currency: deal.currency || 'INR',
      issue_date: now,
      due_date: now,
      subtotal: originalAmount,
      discount_amount: discountAmount,
      tax_amount: 0,
      total_amount: finalAmount,
      amount_paid: finalAmount,
      amount_due: 0,
      promo_code: promoCode,
      payment_id: paymentId,
      order_id: orderId,
      paid_at: now,
      created_at: now,
      updated_at: now,
    })
    .select()
    .maybeSingle();

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: concurrentInvoice } = await admin
        .from('invoices')
        .select('*')
        .eq('deal_id', deal.id)
        .neq('status', 'draft')
        .maybeSingle();
      return concurrentInvoice || null;
    }
    console.error('ensureInvoiceForDeal: Failed to create invoice:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });
    return null;
  }

  // Add the default line item
  if (newInvoice) {
    await admin.from('invoice_items').insert({
      invoice_id: newInvoice.id,
      description: deal.title || 'Professional Services',
      quantity: 1,
      unit_price: originalAmount,
      line_total: originalAmount,
      sort_order: 0,
    });
  }

  return newInvoice;
}
