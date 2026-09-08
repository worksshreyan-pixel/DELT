import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  console.log('[PROMO_REDEEM_START]');
  try {
    const body = await request.json();
    const { dealId, token, promoCode } = body;

    if (!dealId || !promoCode) {
      return NextResponse.json({ error: 'Deal ID and Promo Code are required' }, { status: 400 });
    }

    const code = promoCode.trim().toUpperCase();
    if (code !== 'DELT' && code !== 'SHREYAN') {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.payment_status === 'paid' || deal.status === 'completed') {
      // Idempotent success response if already paid
      return NextResponse.json({
        success: true,
        dealId: deal.id,
        status: deal.status,
        paymentStatus: deal.payment_status,
        message: 'Deal already completed',
      });
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
      return NextResponse.json({ error: 'Creators cannot redeem promos.' }, { status: 403 });
    }
    if (!isClient) {
      return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
    }

    const idempotencyKey = `promo_${code}_${deal.id}`;

    // 1. Create Payment record for Promo
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        deal_id: deal.id,
        client_id: deal.client_id,
        client_name: deal.client_name,
        deal_title: deal.title,
        amount: 0,
        currency: deal.currency,
        platform_fee: 0,
        processing_fee: 0,
        creator_net: 0,
        state: 'paid',
        method: 'promo',
        idempotency_key: idempotencyKey,
        completed_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (paymentError) {
      // If error is unique constraint violation on idempotency_key, it means it was already redeemed
      if (paymentError.code === '23505') { // Postgres unique violation code
        return NextResponse.json({
          success: true,
          dealId: deal.id,
          status: 'completed',
          paymentStatus: 'paid',
        });
      }
      throw paymentError;
    }

    const txId = `TXN-PRM-${Date.now().toString().slice(-5)}`;

    // Import and call reusable function
    const { finalizeDealPayment } = await import('@/lib/deals/completion');
    await finalizeDealPayment({
      supabase,
      deal,
      paymentRecordId: paymentRecord?.id,
      txId,
      description: `Promotional code ${code} redeemed. 100% discount applied.`,
      amountOverride: 0,
      platformFeeOverride: 0,
      processingFeeOverride: 0,
      netAmountOverride: 0,
      promoCode: code,
    });

    console.log('[PROMO_REDEEM_SUCCESS]');
    return NextResponse.json({
      success: true,
      dealId: deal.id,
      status: 'completed',
      paymentStatus: 'paid',
    });
  } catch (error: any) {
    console.error('[PROMO_REDEEM_ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Promo redemption failed' }, { status: 500 });
  }
}
