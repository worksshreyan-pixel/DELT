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

    // 2. Mark Deal completed and paid
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

    // 3. Mark all deliverables approved and unlock files
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

    // 4. Create Transaction record
    const txId = `TXN-${Date.now().toString().slice(-6)}`;
    await supabase.from('transactions').upsert({
      id: txId,
      payment_id: paymentRecord?.id,
      deal_id: deal.id,
      creator_id: deal.creator_id,
      deal_title: deal.title,
      client_name: deal.client_name,
      amount: deal.price,
      currency: deal.currency,
      platform_fee: paymentRecord?.platform_fee || Math.round(deal.price * 0.05),
      processing_fee: paymentRecord?.processing_fee || Math.round(deal.price * 0.02),
      net_amount: paymentRecord?.creator_net || Math.round(deal.price * 0.93),
      state: 'paid',
      date: now,
    });

    // 5. Create audit timeline event
    await supabase.from('deal_events').insert({
      deal_id: deal.id,
      type: 'payment_completed',
      actor_id: deal.client_email,
      actor_name: deal.client_name,
      actor_role: 'client',
      description: `Payment of ${deal.price} ${deal.currency} verified. All deliverables unlocked.`,
      metadata: { orderId, paymentId },
    });

    // 6. Post system chat message
    await supabase.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: 'system',
      sender_name: 'DELT System',
      sender_role: 'creator',
      type: 'system',
      content: `Payment of ${deal.price} ${deal.currency} confirmed! All deliverable files have been unlocked for download.`,
    });

    // 7. Send creator notification
    await supabase.from('notifications').insert({
      user_id: deal.creator_id,
      type: 'payment_received',
      title: 'Payment Received',
      description: `Received ${deal.price} ${deal.currency} for "${deal.title}" from ${deal.client_name}`,
      deal_id: deal.id,
      deal_title: deal.title,
      read: false,
    });

    // 8. Transactional Emails (Client receipt & Creator notification)
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
        amount: Number(deal.price),
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
          amount: Number(deal.price),
          currency: deal.currency || 'INR',
          transactionId: txId,
          isCreator: true,
          dealUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deals/${deal.id}`,
        });
      }
    } catch (emailErr) {
      console.error('Error dispatching payment confirmation emails:', emailErr);
    }

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
