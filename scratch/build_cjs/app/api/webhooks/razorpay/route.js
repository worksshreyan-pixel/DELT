"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const razorpay_1 = require("@/lib/razorpay");
const admin_1 = require("@/lib/supabase/admin");
async function POST(request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature');
        if (!signature) {
            return server_1.NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
        }
        const isValid = (0, razorpay_1.verifyRazorpayWebhookSignature)(rawBody, signature);
        if (!isValid) {
            return server_1.NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
        }
        const event = JSON.parse(rawBody);
        const eventId = event.event_id || event.id;
        const eventType = event.event;
        const supabase = (0, admin_1.createAdminClient)();
        // Idempotency check: prevent processing same event twice
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id, state')
            .eq('idempotency_key', eventId)
            .maybeSingle();
        if (existingPayment) {
            return server_1.NextResponse.json({ message: 'Event already processed' });
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
                    // Transactional Emails
                    try {
                        const canonicalDealUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${payment.deals?.token || ''}`;
                        const { sendPaymentConfirmationEmail } = await Promise.resolve().then(() => __importStar(require('@/lib/email')));
                        if (payment.deals?.client_email) {
                            await sendPaymentConfirmationEmail({
                                recipientName: payment.client_name,
                                recipientEmail: payment.deals.client_email,
                                creatorName: 'Creator',
                                dealTitle: payment.deal_title,
                                amount: Number(payment.amount),
                                currency: payment.currency || 'INR',
                                transactionId: `TXN-${payment.id.slice(0, 6)}`,
                                isCreator: false,
                                dealUrl: canonicalDealUrl,
                            });
                        }
                    }
                    catch (e) {
                        console.error('Error sending webhook payment email:', e);
                    }
                }
            }
        }
        return server_1.NextResponse.json({ status: 'success' });
    }
    catch (error) {
        console.error('Error handling Razorpay webhook:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Webhook error' }, { status: 500 });
    }
}
exports.POST = POST;
