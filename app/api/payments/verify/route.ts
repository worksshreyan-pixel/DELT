import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasRazorpayConfig } from '@/lib/env';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  console.log('[PAYMENT_VERIFY_START]');
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, dealId, demo } = body;

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'Order ID and Payment ID are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify signature in live Razorpay mode
    if (hasRazorpayConfig() && !demo) {
      const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValid) {
        console.log('[PAYMENT_SIGNATURE_INVALID]');
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
      console.log('[PAYMENT_SIGNATURE_VALID]');
    }

    // Fetch deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .maybeSingle();

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
      return NextResponse.json({ error: 'Creators cannot verify payments.' }, { status: 403 });
    }
    if (!isClient) {
      return NextResponse.json({ error: 'Unauthorized client access.' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // 1. Update Payment record
    const { data: paymentRecord } = await supabase
      .from('payments')
      .update({
        state: 'paid',
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        completed_at: now,
      })
      .eq('razorpay_order_id', orderId)
      .select()
      .maybeSingle();

    const txId = `TXN-${Date.now().toString().slice(-6)}`;

    // Import and call reusable function
    const { finalizeDealPayment } = await import('@/lib/deals/completion');
    await finalizeDealPayment({
      supabase,
      deal,
      paymentRecordId: paymentRecord?.id,
      txId,
      orderId,
      paymentId,
      description: `Payment of ${deal.price} ${deal.currency} verified. All deliverables unlocked.`,
    });

    console.log('[PAYMENT_VERIFY_SUCCESS]');
    return NextResponse.json({
      success: true,
      dealId: deal.id,
      status: 'completed',
      paymentStatus: 'paid',
    });
  } catch (error: any) {
    console.error('[PAYMENT_VERIFY_ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Payment verification failed' }, { status: 500 });
  }
}
