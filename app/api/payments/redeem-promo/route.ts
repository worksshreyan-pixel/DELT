import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireClientDealAccess } from '@/lib/deal-auth';
import { isUuid } from '@/lib/utils';

const VALID_PROMO_CODES = new Set(['DELT', 'SHREYAN', 'FREE100', 'WELCOME50']);

export async function POST(request: Request) {
  console.log('[PROMO_REDEEM_START]');
  try {
    const body = await request.json();
    const { dealId, token, promoCode } = body;

    const identifier = dealId || token;
    if (!identifier || !promoCode) {
      return NextResponse.json({ error: 'Deal identifier and Promo Code are required' }, { status: 400 });
    }

    const code = promoCode.toString().trim().toUpperCase();
    if (!VALID_PROMO_CODES.has(code)) {
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch deal safely
    let query = supabase.from('deals').select('*');
    if (isUuid(identifier)) {
      query = query.eq('id', identifier);
    } else {
      query = query.or(`deal_code.eq.${identifier},token.eq.${identifier},id.eq.${identifier}`);
    }
    const { data: deal, error: dealError } = await query.maybeSingle();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // 1. Block creator from making client payments / promo redemptions for their own deal
    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    const isCreator = Boolean(user && user.id === deal.creator_id);
    if (isCreator) {
      return NextResponse.json({ error: 'Creators cannot redeem promos for their own deals.' }, { status: 403 });
    }

    // 2. Client Authorization using DELT's unified client access session engine
    // (Checks HttpOnly session cookie, x-client-session-token header, and client auth email)
    const clientAuth = await requireClientDealAccess(request, deal.id);
    if (!clientAuth.authorized) {
      console.log('[PROMO_AUTH_ERROR] Unauthorized client access:', clientAuth.error);
      return NextResponse.json({ error: clientAuth.error || 'Unauthorized client access.' }, { status: 403 });
    }

    // 3. Idempotency Check: return success if deal is already completed/paid
    if (deal.payment_status === 'paid' || deal.status === 'completed') {
      return NextResponse.json({
        success: true,
        dealId: deal.id,
        status: deal.status,
        paymentStatus: deal.payment_status,
        message: 'Deal already completed',
      });
    }

    const idempotencyKey = `promo_${code}_${deal.id}`;

    // 4. Create Payment record for Promo Redemption
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payments')
      .insert({
        deal_id: deal.id,
        client_id: deal.client_id,
        client_name: deal.client_name,
        deal_title: deal.title,
        amount: 0,
        currency: deal.currency || 'INR',
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
      // Idempotent retry: Postgres unique constraint violation on idempotency_key
      if (paymentError.code === '23505') {
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

    // 5. Finalize deal payment & unlock deliverables
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
