import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || event.id;
    const eventType = event.event;

    const supabase = createAdminClient();

    // Idempotency check: prevent processing same event twice
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, state')
      .eq('idempotency_key', eventId)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ message: 'Event already processed' });
    }

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payload = event.payload?.payment?.entity || event.payload?.order?.entity;
      const orderId = payload?.order_id || payload?.id;
      const paymentId = payload?.id;

      if (orderId) {
        // Fetch payment record
        const { data: payment } = await supabase
          .from('payments')
          .select('*, deals(*)')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();

        if (payment && payment.state !== 'paid') {
          const now = new Date().toISOString();

          await supabase
            .from('payments')
            .update({
              state: 'paid',
              razorpay_payment_id: paymentId,
              idempotency_key: eventId,
              completed_at: now,
            })
            .eq('id', payment.id);

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
            .eq('id', payment.deal_id);

          // Mark deliverables approved and unlock files
          await supabase
            .from('deliverables')
            .update({
              status: 'approved',
            })
            .eq('deal_id', payment.deal_id);

          await supabase
            .from('file_versions')
            .update({
              locked: false,
              status: 'approved',
            })
            .eq('deal_id', payment.deal_id);

          // Notification
          if (payment.deals?.creator_id) {
            await supabase.from('notifications').insert({
              user_id: payment.deals.creator_id,
              type: 'payment_received',
              title: 'Payment Received via Webhook',
              description: `Received ${payment.amount} ${payment.currency} for "${payment.deal_title}"`,
              deal_id: payment.deal_id,
              deal_title: payment.deal_title,
              read: false,
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json({ error: error?.message || 'Webhook error' }, { status: 500 });
  }
}
