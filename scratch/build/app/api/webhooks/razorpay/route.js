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
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
export function POST(request) {
    var _a, _b, _c, _d, _e, _f, _g;
    return __awaiter(this, void 0, void 0, function () {
        var rawBody, signature, isValid, event_1, eventId, eventType, supabase, existingPayment, payload, orderId, paymentId, payment, now, canonicalDealUrl, sendPaymentConfirmationEmail, e_1, error_1;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 15, , 16]);
                    return [4 /*yield*/, request.text()];
                case 1:
                    rawBody = _h.sent();
                    signature = request.headers.get('x-razorpay-signature');
                    if (!signature) {
                        return [2 /*return*/, NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })];
                    }
                    isValid = verifyRazorpayWebhookSignature(rawBody, signature);
                    if (!isValid) {
                        return [2 /*return*/, NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })];
                    }
                    event_1 = JSON.parse(rawBody);
                    eventId = event_1.event_id || event_1.id;
                    eventType = event_1.event;
                    supabase = createAdminClient();
                    return [4 /*yield*/, supabase
                            .from('payments')
                            .select('id, state')
                            .eq('idempotency_key', eventId)
                            .maybeSingle()];
                case 2:
                    existingPayment = (_h.sent()).data;
                    if (existingPayment) {
                        return [2 /*return*/, NextResponse.json({ message: 'Event already processed' })];
                    }
                    if (!(eventType === 'payment.captured' || eventType === 'order.paid')) return [3 /*break*/, 14];
                    payload = ((_b = (_a = event_1.payload) === null || _a === void 0 ? void 0 : _a.payment) === null || _b === void 0 ? void 0 : _b.entity) || ((_d = (_c = event_1.payload) === null || _c === void 0 ? void 0 : _c.order) === null || _d === void 0 ? void 0 : _d.entity);
                    orderId = (payload === null || payload === void 0 ? void 0 : payload.order_id) || (payload === null || payload === void 0 ? void 0 : payload.id);
                    paymentId = payload === null || payload === void 0 ? void 0 : payload.id;
                    if (!orderId) return [3 /*break*/, 14];
                    return [4 /*yield*/, supabase
                            .from('payments')
                            .select('*, deals(*)')
                            .eq('razorpay_order_id', orderId)
                            .maybeSingle()];
                case 3:
                    payment = (_h.sent()).data;
                    if (!(payment && payment.state !== 'paid')) return [3 /*break*/, 14];
                    now = new Date().toISOString();
                    return [4 /*yield*/, supabase
                            .from('payments')
                            .update({
                            state: 'paid',
                            razorpay_payment_id: paymentId,
                            idempotency_key: eventId,
                            completed_at: now,
                        })
                            .eq('id', payment.id)];
                case 4:
                    _h.sent();
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
                            .eq('id', payment.deal_id)];
                case 5:
                    _h.sent();
                    // Mark deliverables approved and unlock files
                    return [4 /*yield*/, supabase
                            .from('deliverables')
                            .update({
                            status: 'approved',
                        })
                            .eq('deal_id', payment.deal_id)];
                case 6:
                    // Mark deliverables approved and unlock files
                    _h.sent();
                    return [4 /*yield*/, supabase
                            .from('file_versions')
                            .update({
                            locked: false,
                            status: 'approved',
                        })
                            .eq('deal_id', payment.deal_id)];
                case 7:
                    _h.sent();
                    if (!((_e = payment.deals) === null || _e === void 0 ? void 0 : _e.creator_id)) return [3 /*break*/, 9];
                    return [4 /*yield*/, supabase.from('notifications').insert({
                            user_id: payment.deals.creator_id,
                            type: 'payment_received',
                            title: 'Payment Received via Webhook',
                            description: "Received ".concat(payment.amount, " ").concat(payment.currency, " for \"").concat(payment.deal_title, "\""),
                            deal_id: payment.deal_id,
                            deal_title: payment.deal_title,
                            read: false,
                        })];
                case 8:
                    _h.sent();
                    _h.label = 9;
                case 9:
                    _h.trys.push([9, 13, , 14]);
                    canonicalDealUrl = "".concat(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', "/deal/").concat(((_f = payment.deals) === null || _f === void 0 ? void 0 : _f.token) || '');
                    return [4 /*yield*/, import('@/lib/email')];
                case 10:
                    sendPaymentConfirmationEmail = (_h.sent()).sendPaymentConfirmationEmail;
                    if (!((_g = payment.deals) === null || _g === void 0 ? void 0 : _g.client_email)) return [3 /*break*/, 12];
                    return [4 /*yield*/, sendPaymentConfirmationEmail({
                            recipientName: payment.client_name,
                            recipientEmail: payment.deals.client_email,
                            creatorName: 'Creator',
                            dealTitle: payment.deal_title,
                            amount: Number(payment.amount),
                            currency: payment.currency || 'INR',
                            transactionId: "TXN-".concat(payment.id.slice(0, 6)),
                            isCreator: false,
                            dealUrl: canonicalDealUrl,
                        })];
                case 11:
                    _h.sent();
                    _h.label = 12;
                case 12: return [3 /*break*/, 14];
                case 13:
                    e_1 = _h.sent();
                    console.error('Error sending webhook payment email:', e_1);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/, NextResponse.json({ status: 'success' })];
                case 15:
                    error_1 = _h.sent();
                    console.error('Error handling Razorpay webhook:', error_1);
                    return [2 /*return*/, NextResponse.json({ error: (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || 'Webhook error' }, { status: 500 })];
                case 16: return [2 /*return*/];
            }
        });
    });
}
