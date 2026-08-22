var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasRazorpayConfig } from '@/lib/env';
import { sendPaymentConfirmationEmail } from '@/lib/email';
export function POST(request) {
    return __awaiter(this, void 0, void 0, function () {
        var body, orderId, paymentId, signature, dealId, demo, supabase, isValid, _a, deal, dealError, now, paymentRecord, txId, creatorProfile, creatorDisplayName, canonicalDealUrl, emailErr_1, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 18, , 19]);
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _b.sent();
                    orderId = body.orderId, paymentId = body.paymentId, signature = body.signature, dealId = body.dealId, demo = body.demo;
                    if (!orderId || !paymentId) {
                        return [2 /*return*/, NextResponse.json({ error: 'Order ID and Payment ID are required' }, { status: 400 })];
                    }
                    supabase = createAdminClient();
                    // Verify signature in live Razorpay mode
                    if (hasRazorpayConfig() && !demo) {
                        isValid = verifyRazorpaySignature(orderId, paymentId, signature);
                        if (!isValid) {
                            return [2 /*return*/, NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })];
                        }
                    }
                    return [4 /*yield*/, supabase
                            .from('deals')
                            .select('*')
                            .eq('id', dealId)
                            .maybeSingle()];
                case 2:
                    _a = _b.sent(), deal = _a.data, dealError = _a.error;
                    if (dealError || !deal) {
                        return [2 /*return*/, NextResponse.json({ error: 'Deal not found' }, { status: 404 })];
                    }
                    now = new Date().toISOString();
                    return [4 /*yield*/, supabase
                            .from('payments')
                            .update({
                            state: 'paid',
                            razorpay_payment_id: paymentId,
                            razorpay_signature: signature,
                            completed_at: now,
                        })
                            .eq('razorpay_order_id', orderId)
                            .select()
                            .maybeSingle()];
                case 3:
                    paymentRecord = (_b.sent()).data;
                    // 2. Mark Deal completed and paid
                    return [4 /*yield*/, supabase
                            .from('deals')
                            .update({
                            payment_status: 'paid',
                            status: 'completed',
                            progress: 100,
                            completed_at: now,
                            updated_at: now,
                            last_activity_at: now,
                        })
                            .eq('id', deal.id)];
                case 4:
                    // 2. Mark Deal completed and paid
                    _b.sent();
                    // 3. Mark all deliverables approved and unlock files
                    return [4 /*yield*/, supabase
                            .from('deliverables')
                            .update({
                            status: 'approved',
                        })
                            .eq('deal_id', deal.id)];
                case 5:
                    // 3. Mark all deliverables approved and unlock files
                    _b.sent();
                    return [4 /*yield*/, supabase
                            .from('file_versions')
                            .update({
                            locked: false,
                            status: 'approved',
                        })
                            .eq('deal_id', deal.id)];
                case 6:
                    _b.sent();
                    txId = "TXN-".concat(Date.now().toString().slice(-6));
                    return [4 /*yield*/, supabase.from('transactions').upsert({
                            id: txId,
                            payment_id: paymentRecord === null || paymentRecord === void 0 ? void 0 : paymentRecord.id,
                            deal_id: deal.id,
                            creator_id: deal.creator_id,
                            deal_title: deal.title,
                            client_name: deal.client_name,
                            amount: deal.price,
                            currency: deal.currency,
                            platform_fee: (paymentRecord === null || paymentRecord === void 0 ? void 0 : paymentRecord.platform_fee) || Math.round(deal.price * 0.05),
                            processing_fee: (paymentRecord === null || paymentRecord === void 0 ? void 0 : paymentRecord.processing_fee) || Math.round(deal.price * 0.02),
                            net_amount: (paymentRecord === null || paymentRecord === void 0 ? void 0 : paymentRecord.creator_net) || Math.round(deal.price * 0.93),
                            state: 'paid',
                            date: now,
                        })];
                case 7:
                    _b.sent();
                    // 5. Create audit timeline event
                    return [4 /*yield*/, supabase.from('deal_events').insert({
                            deal_id: deal.id,
                            type: 'payment_completed',
                            actor_id: deal.client_email,
                            actor_name: deal.client_name,
                            actor_role: 'client',
                            description: "Payment of ".concat(deal.price, " ").concat(deal.currency, " verified. All deliverables unlocked."),
                            metadata: { orderId: orderId, paymentId: paymentId },
                        })];
                case 8:
                    // 5. Create audit timeline event
                    _b.sent();
                    // 6. Post system chat message
                    return [4 /*yield*/, supabase.from('deal_messages').insert({
                            deal_id: deal.id,
                            sender_id: 'system',
                            sender_name: 'DELT System',
                            sender_role: 'creator',
                            type: 'system',
                            content: "Payment of ".concat(deal.price, " ").concat(deal.currency, " confirmed! All deliverable files have been unlocked for download."),
                        })];
                case 9:
                    // 6. Post system chat message
                    _b.sent();
                    // 7. Send creator notification
                    return [4 /*yield*/, supabase.from('notifications').insert({
                            user_id: deal.creator_id,
                            type: 'payment_received',
                            title: 'Payment Received',
                            description: "Received ".concat(deal.price, " ").concat(deal.currency, " for \"").concat(deal.title, "\" from ").concat(deal.client_name),
                            deal_id: deal.id,
                            deal_title: deal.title,
                            read: false,
                        })];
                case 10:
                    // 7. Send creator notification
                    _b.sent();
                    _b.label = 11;
                case 11:
                    _b.trys.push([11, 16, , 17]);
                    return [4 /*yield*/, supabase
                            .from('profiles')
                            .select('email, display_name')
                            .eq('id', deal.creator_id)
                            .maybeSingle()];
                case 12:
                    creatorProfile = (_b.sent()).data;
                    creatorDisplayName = (creatorProfile === null || creatorProfile === void 0 ? void 0 : creatorProfile.display_name) || 'Creator';
                    canonicalDealUrl = "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deal/").concat(deal.token);
                    // Email to Client
                    return [4 /*yield*/, sendPaymentConfirmationEmail({
                            recipientName: deal.client_name,
                            recipientEmail: deal.client_email,
                            creatorName: creatorDisplayName,
                            dealTitle: deal.title,
                            amount: Number(deal.price),
                            currency: deal.currency || 'INR',
                            transactionId: txId,
                            isCreator: false,
                            dealUrl: canonicalDealUrl,
                        })];
                case 13:
                    // Email to Client
                    _b.sent();
                    if (!(creatorProfile === null || creatorProfile === void 0 ? void 0 : creatorProfile.email)) return [3 /*break*/, 15];
                    return [4 /*yield*/, sendPaymentConfirmationEmail({
                            recipientName: creatorDisplayName,
                            recipientEmail: creatorProfile.email,
                            creatorName: creatorDisplayName,
                            dealTitle: deal.title,
                            amount: Number(deal.price),
                            currency: deal.currency || 'INR',
                            transactionId: txId,
                            isCreator: true,
                            dealUrl: "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deals/").concat(deal.id),
                        })];
                case 14:
                    _b.sent();
                    _b.label = 15;
                case 15: return [3 /*break*/, 17];
                case 16:
                    emailErr_1 = _b.sent();
                    console.error('Error dispatching payment confirmation emails:', emailErr_1);
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/, NextResponse.json({
                        success: true,
                        dealId: deal.id,
                        status: 'completed',
                        paymentStatus: 'paid',
                    })];
                case 18:
                    error_1 = _b.sent();
                    console.error('Error verifying payment:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Payment verification failed' }, { status: 500 })];
                case 19: return [2 /*return*/];
            }
        });
    });
}
