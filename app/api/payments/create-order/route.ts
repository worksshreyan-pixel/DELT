import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDealFees } from '@/lib/fees';
import { env, hasRazorpayConfig } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireClientDealAccess } from '@/lib/deal-auth';

import { isUuid } from '@/lib/utils';

export async function POST(request: Request) {
  console.log('[PAYMENT_CREATE_START]');
  try {
    const body = await request.json();
    const { dealId, token, metadata } = body;
    const invoiceId = metadata?.invoice_id;

    if (!dealId && !token) {
      return NextResponse.json({ error: 'Deal ID or token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch deal safely
    let query = supabase.from('deals').select('*');
    if (dealId) {
      if (isUuid(dealId)) {
        query = query.eq('id', dealId);
      } else {
        query = query.or(`deal_code.eq.${dealId},token.eq.${dealId}`);
      }
    } else if (token) {
      query = query.or(`token.eq.${token},deal_code.eq.${token}`);
    }
    const { data: deal, error: dealError } = await query.maybeSingle();

    if (dealError || !deal) {
      console.log('[PAYMENT_CREATE_ERROR] Deal not found');
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    const isCreator = Boolean(user && user.id === deal.creator_id);
    if (isCreator) {
      console.log('[PAYMENT_AUTH_ERROR] Creator attempted payment');
      return NextResponse.json({ error: 'Creators cannot make payments.' }, { status: 403 });
    }

    const clientAuth = await requireClientDealAccess(request, deal.id);
    if (!clientAuth.authorized) {
      console.log('[PAYMENT_AUTH_ERROR] Unauthorized client access');
      return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
    }

    let invoice = null;
    if (invoiceId) {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle();
      if (inv) invoice = inv;
    }

    if (invoice && (invoice.status === 'paid' || Number(invoice.amount_due) <= 0)) {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    if (deal.payment_status === 'paid' || deal.status === 'completed') {
      return NextResponse.json({ error: 'Deal is already paid and completed' }, { status: 400 });
    }

    const amountInCurrency = invoice ? Number(invoice.amount_due) : Number(deal.price);
    const currency = invoice ? invoice.currency : (deal.currency || 'INR');
    const amountInSubunits = Math.round(amountInCurrency * 100); // e.g. 25000 INR = 2500000 paise

    const feeBreakdown = calculateDealFees(amountInCurrency, currency as any);

    // If Razorpay credentials are configured, create a real Razorpay Order
    if (hasRazorpayConfig()) {
      const razorpay = getRazorpayClient();
      if (!razorpay) {
        return NextResponse.json({ error: 'Payment gateway unavailable' }, { status: 500 });
      }

      const order = await razorpay.orders.create({
        amount: amountInSubunits,
        currency,
        receipt: `rcpt_${deal.id.slice(0, 10)}_${Date.now()}`,
        notes: {
          dealId: deal.id,
          dealTitle: deal.title,
          clientEmail: deal.client_email,
          ...(invoiceId ? { invoice_id: invoiceId } : {}),
        },
      });
      console.log('[PAYMENT_RAZORPAY_ORDER_CREATED]');


      // Insert or update payment record
      await supabase.from('payments').upsert({
        deal_id: deal.id,
        client_name: deal.client_name,
        deal_title: deal.title,
        amount: amountInCurrency,
        currency,
        platform_fee: feeBreakdown.platformFee,
        processing_fee: feeBreakdown.processingFee,
        creator_net: feeBreakdown.creatorNet,
        state: 'pending',
        razorpay_order_id: order.id,
      });

      return NextResponse.json({
        orderId: order.id,
        amount: amountInSubunits,
        currency,
        keyId: env.razorpay.keyId,
        dealTitle: deal.title,
        clientName: deal.client_name,
        clientEmail: deal.client_email,
      });
    }

    // Demo/Offline mode order fallback
    const demoOrderId = `order_demo_${Date.now()}`;
    await supabase.from('payments').upsert({
      deal_id: deal.id,
      client_name: deal.client_name,
      deal_title: deal.title,
      amount: amountInCurrency,
      currency,
      platform_fee: feeBreakdown.platformFee,
      processing_fee: feeBreakdown.processingFee,
      creator_net: feeBreakdown.creatorNet,
      state: 'pending',
      razorpay_order_id: demoOrderId,
    });

    return NextResponse.json({
      orderId: demoOrderId,
      amount: amountInSubunits,
      currency,
      keyId: 'rzp_test_demo',
      dealTitle: deal.title,
      clientName: deal.client_name,
      clientEmail: deal.client_email,
      demo: true,
    });
  } catch (error: any) {
    console.error('[PAYMENT_CREATE_ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Failed to create payment order' }, { status: 500 });
  }
}
