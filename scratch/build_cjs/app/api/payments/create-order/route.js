"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const razorpay_1 = require("@/lib/razorpay");
const admin_1 = require("@/lib/supabase/admin");
const fees_1 = require("@/lib/fees");
const env_1 = require("@/lib/env");
async function POST(request) {
    try {
        const body = await request.json();
        const { dealId, token } = body;
        if (!dealId && !token) {
            return server_1.NextResponse.json({ error: 'Deal ID or token is required' }, { status: 400 });
        }
        const supabase = (0, admin_1.createAdminClient)();
        // Fetch deal
        let query = supabase.from('deals').select('*');
        if (dealId) {
            query = query.eq('id', dealId);
        }
        else {
            query = query.eq('token', token);
        }
        const { data: deal, error: dealError } = await query.maybeSingle();
        if (dealError || !deal) {
            return server_1.NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }
        if (deal.payment_status === 'paid') {
            return server_1.NextResponse.json({ error: 'Deal is already paid' }, { status: 400 });
        }
        const amountInCurrency = Number(deal.price);
        const currency = deal.currency || 'INR';
        const amountInSubunits = Math.round(amountInCurrency * 100); // e.g. 25000 INR = 2500000 paise
        const feeBreakdown = (0, fees_1.calculateDealFees)(amountInCurrency, currency);
        // If Razorpay credentials are configured, create a real Razorpay Order
        if ((0, env_1.hasRazorpayConfig)()) {
            const razorpay = (0, razorpay_1.getRazorpayClient)();
            if (!razorpay) {
                return server_1.NextResponse.json({ error: 'Payment gateway unavailable' }, { status: 500 });
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
            return server_1.NextResponse.json({
                orderId: order.id,
                amount: amountInSubunits,
                currency,
                keyId: env_1.env.razorpay.keyId,
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
        return server_1.NextResponse.json({
            orderId: demoOrderId,
            amount: amountInSubunits,
            currency,
            keyId: 'rzp_test_demo',
            dealTitle: deal.title,
            clientName: deal.client_name,
            clientEmail: deal.client_email,
            demo: true,
        });
    }
    catch (error) {
        console.error('Error creating payment order:', error);
        return server_1.NextResponse.json({ error: error?.message || 'Failed to create payment order' }, { status: 500 });
    }
}
exports.POST = POST;
