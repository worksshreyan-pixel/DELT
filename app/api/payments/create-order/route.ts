import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateDealFees } from '@/lib/fees';
import { env, hasRazorpayConfig } from '@/lib/env';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealId, token } = body;

    if (!dealId && !token) {
      return NextResponse.json({ error: 'Deal ID or token is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch deal
    let query = supabase.from('deals').select('*');
    if (dealId) {
      query = query.eq('id', dealId);
    } else {
      query = query.eq('token', token);
    }
    const { data: deal, error: dealError } = await query.maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    // Check client session token from header
    const clientSessionHeader = request.headers.get('x-client-session-token');
    const { verifyClientSessionToken } = await import('@/lib/otp');
    const hasValidClientToken = clientSessionHeader && deal.token
      ? verifyClientSessionToken(clientSessionHeader, deal.token, deal.client_email)
      : false;

    const isCreator = user && user.id === deal.creator_id;
    const isClient = (user && user.email?.toLowerCase() === deal.client_email?.toLowerCase()) || hasValidClientToken;

    if (isCreator) {
      return NextResponse.json({ error: 'Creators cannot make payments.' }, { status: 403 });
    }
    if (!isClient) {
      return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
    }

    if (deal.payment_status === 'paid') {
      return NextResponse.json({ error: 'Deal is already paid' }, { status: 400 });
    }

    const amountInCurrency = Number(deal.price);
    const currency = deal.currency || 'INR';
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
        },
      });

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
    console.error('Error creating payment order:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create payment order' }, { status: 500 });
  }
}
