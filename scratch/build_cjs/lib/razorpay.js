"use strict";
// ==============================================================================
// DELT — Server-Side Razorpay Integration & Signature Verification
// ==============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayWebhookSignature = exports.verifyRazorpaySignature = exports.getRazorpayClient = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("@/lib/env");
/**
 * Initializes server Razorpay instance.
 * STRICTLY SERVER-ONLY!
 */
function getRazorpayClient() {
    if (!(0, env_1.hasRazorpayConfig)()) {
        return null;
    }
    return new razorpay_1.default({
        key_id: env_1.env.razorpay.keyId,
        key_secret: env_1.env.razorpay.keySecret,
    });
}
exports.getRazorpayClient = getRazorpayClient;
/**
 * Verifies Razorpay payment checkout signature.
 * signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
function verifyRazorpaySignature(orderId, paymentId, signature) {
    if (!env_1.env.razorpay.keySecret)
        return false;
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', env_1.env.razorpay.keySecret)
        .update(payload)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
}
exports.verifyRazorpaySignature = verifyRazorpaySignature;
/**
 * Verifies Razorpay webhook signature.
 * signature = HMAC-SHA256(request_body, webhook_secret)
 */
function verifyRazorpayWebhookSignature(body, signature) {
    if (!env_1.env.razorpay.webhookSecret)
        return false;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', env_1.env.razorpay.webhookSecret)
        .update(body)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
}
exports.verifyRazorpayWebhookSignature = verifyRazorpayWebhookSignature;
