import { sendPaymentConfirmationEmail } from '@/lib/email';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface FinalizePaymentParams {
  supabase: SupabaseClient;
  deal: any;
  paymentRecordId: string | undefined;
  txId: string;
  orderId?: string;
  paymentId?: string;
  description: string;
  // Optional overrides for promos
  amountOverride?: number;
  platformFeeOverride?: number;
  processingFeeOverride?: number;
  netAmountOverride?: number;
  promoCode?: string;
}

/**
 * Reusable function to finalize a deal payment, unlock deliverables,
 * create transaction records, and send notifications.
 */
export async function finalizeDealPayment({
  supabase,
  deal,
  paymentRecordId,
  txId,
  orderId,
  paymentId,
  description,
  amountOverride,
  platformFeeOverride,
  processingFeeOverride,
  netAmountOverride,
  promoCode,
}: FinalizePaymentParams) {
  // 0. Idempotency Check
  if (deal.payment_status === 'paid' || deal.status === 'completed') {
    return;
  }

  const now = new Date().toISOString();

  // 1. Mark Deal completed and paid
  await supabase
    .from('deals')
    .update({
      payment_status: 'paid',
      status: 'completed',
      progress: 100,
      completed_at: now,
      updated_at: now,
      last_activity_at: now,
    })
    .eq('id', deal.id);

  // 2. Mark all deliverables approved and unlock files
  await supabase
    .from('deliverables')
    .update({
      status: 'approved',
    })
    .eq('deal_id', deal.id);

  await supabase
    .from('file_versions')
    .update({
      locked: false,
      status: 'approved',
    })
    .eq('deal_id', deal.id);

  // 3. Create Transaction record
  const { data: paymentRecord } = paymentRecordId
    ? await supabase.from('payments').select('*').eq('id', paymentRecordId).maybeSingle()
    : { data: null };

  const txAmount = amountOverride !== undefined ? amountOverride : Number(deal.price);
  const txPlatformFee = platformFeeOverride !== undefined ? platformFeeOverride : (paymentRecord?.platform_fee || Math.round(txAmount * 0.05));
  const txProcessingFee = processingFeeOverride !== undefined ? processingFeeOverride : (paymentRecord?.processing_fee || Math.round(txAmount * 0.02));
  const txNetAmount = netAmountOverride !== undefined ? netAmountOverride : (paymentRecord?.creator_net || Math.round(txAmount * 0.93));

  await supabase.from('transactions').upsert({
    id: txId,
    payment_id: paymentRecordId || null,
    deal_id: deal.id,
    creator_id: deal.creator_id,
    deal_title: deal.title,
    client_name: deal.client_name,
    amount: txAmount,
    currency: deal.currency,
    platform_fee: txPlatformFee,
    processing_fee: txProcessingFee,
    net_amount: txNetAmount,
    state: 'paid',
    date: now,
  });

  // 3.5. Create Finalized Invoice
  // Determine exact financial snapshot
  const originalAmount = Number(deal.price);
  const finalAmount = amountOverride !== undefined ? amountOverride : originalAmount;
  const discountAmount = originalAmount - finalAmount;

  // Generate short unique invoice number (e.g. INV-XDGPRD9E)
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  const invoiceNumber = `INV-${randomChars}`;

  await supabase.from('invoices').insert({
    invoice_number: invoiceNumber,
    deal_id: deal.id,
    creator_id: deal.creator_id,
    client_id: deal.client_id,
    status: 'paid',
    type: 'standard',
    currency: deal.currency,
    issue_date: now,
    due_date: now,
    subtotal: originalAmount,
    discount_amount: discountAmount,
    tax_amount: 0,
    total_amount: finalAmount,
    amount_paid: finalAmount,
    amount_due: 0,
    promo_code: promoCode || null,
    payment_id: paymentId || null,
    order_id: orderId || null,
    paid_at: now,
    created_at: now,
    updated_at: now,
  });

  // 4. Create audit timeline event
  await supabase.from('deal_events').insert({
    deal_id: deal.id,
    type: 'payment_completed',
    actor_id: deal.client_email,
    actor_name: deal.client_name,
    actor_role: 'client',
    description: description,
    metadata: { orderId, paymentId },
  });

  // 5. Post system chat message
  await supabase.from('deal_messages').insert({
    deal_id: deal.id,
    sender_id: 'system',
    sender_name: 'DELT System',
    sender_role: 'creator',
    type: 'system',
    content: `Payment of ${txAmount} ${deal.currency} confirmed! All deliverable files have been unlocked for download.`,
  });

  // 6. Send creator notification
  await supabase.from('notifications').insert({
    user_id: deal.creator_id,
    type: 'payment_received',
    title: 'Payment Received',
    description: `Received ${txAmount} ${deal.currency} for "${deal.title}" from ${deal.client_name}`,
    deal_id: deal.id,
    deal_title: deal.title,
    read: false,
  });

  // 7. Transactional Emails (Client receipt & Creator notification)
  try {
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', deal.creator_id)
      .maybeSingle();

    const creatorDisplayName = creatorProfile?.display_name || 'Creator';
    const canonicalDealUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${deal.token}`;

    // Email to Client
    await sendPaymentConfirmationEmail({
      recipientName: deal.client_name,
      recipientEmail: deal.client_email,
      creatorName: creatorDisplayName,
      dealTitle: deal.title,
      amount: txAmount,
      currency: deal.currency || 'INR',
      transactionId: txId,
      isCreator: false,
      dealUrl: canonicalDealUrl,
    });

    // Email to Creator
    if (creatorProfile?.email) {
      await sendPaymentConfirmationEmail({
        recipientName: creatorDisplayName,
        recipientEmail: creatorProfile.email,
        creatorName: creatorDisplayName,
        dealTitle: deal.title,
        amount: txAmount,
        currency: deal.currency || 'INR',
        transactionId: txId,
        isCreator: true,
        dealUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deals/${deal.id}`,
      });
    }
  } catch (emailErr) {
    console.error('Error dispatching payment confirmation emails:', emailErr);
  }
}
