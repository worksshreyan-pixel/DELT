// ==============================================================================
// DELT — Server-Side Razorpay Integration & Signature Verification
// ==============================================================================

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env, hasRazorpayConfig } from '@/lib/env';

/**
 * Initializes server Razorpay instance.
 * STRICTLY SERVER-ONLY!
 */
export function getRazorpayClient(): Razorpay | null {
  if (!hasRazorpayConfig()) {
    return null;
  }

  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
}

/**
 * Verifies Razorpay payment checkout signature.
 * signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.razorpay.keySecret) return false;
  if (typeof signature !== 'string') return false;

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(payload)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expBuffer);
}

/**
 * Verifies Razorpay webhook signature.
 * signature = HMAC-SHA256(request_body, webhook_secret)
 */
export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (!env.razorpay.webhookSecret) return false;
  if (typeof signature !== 'string') return false;

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(body)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'utf8');
  const expBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expBuffer);
}
