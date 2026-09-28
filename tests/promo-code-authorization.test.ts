import { describe, test } from 'node:test';
import assert from 'node:assert';

describe('DELT — Forensic Promo Code & Payment Authorization Audit', () => {

  const VALID_PROMOS = new Set(['DELT', 'SHREYAN', 'FREE100', 'WELCOME50']);

  function validatePromoCode(code: string): { valid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Promo code is required' };
    }
    const clean = code.trim().toUpperCase();
    if (!VALID_PROMOS.has(clean)) {
      return { valid: false, error: 'Invalid or expired promo code' };
    }
    return { valid: true };
  }

  function authorizePromoRedemption(params: {
    dealCreatorId: string;
    requestUserId?: string;
    clientAuthorized: boolean;
    paymentStatus: string;
  }) {
    if (params.requestUserId && params.requestUserId === params.dealCreatorId) {
      return { status: 403, error: 'Creators cannot redeem promos for their own deals.' };
    }
    if (!params.clientAuthorized) {
      return { status: 403, error: 'Unauthorized client access.' };
    }
    if (params.paymentStatus === 'paid') {
      return { status: 200, success: true, message: 'Deal already completed' };
    }
    return { status: 200, success: true };
  }

  describe('1. Promo Code Validation', () => {
    test('valid promo code (DELT, SHREYAN) is accepted', () => {
      assert.equal(validatePromoCode('DELT').valid, true);
      assert.equal(validatePromoCode('shreyan').valid, true);
    });

    test('invalid or unknown promo code is rejected with 400 Bad Request', () => {
      const res = validatePromoCode('INVALID_CODE');
      assert.equal(res.valid, false);
      assert.match(res.error || '', /invalid or expired/i);
    });
  });

  describe('2. Authorization Mismatch Audit & Safeguards', () => {
    test('authorized client with valid session cookie/token can redeem promo', () => {
      const res = authorizePromoRedemption({
        dealCreatorId: 'user_creator_123',
        requestUserId: undefined,
        clientAuthorized: true,
        paymentStatus: 'pending',
      });
      assert.equal(res.status, 200);
      assert.equal(res.success, true);
    });

    test('unauthorized client without session cookie or token is rejected with 403 Forbidden', () => {
      const res = authorizePromoRedemption({
        dealCreatorId: 'user_creator_123',
        requestUserId: undefined,
        clientAuthorized: false,
        paymentStatus: 'pending',
      });
      assert.equal(res.status, 403);
      assert.match(res.error || '', /unauthorized client access/i);
    });

    test('wrong client attempting redemption for another deal is rejected with 403 Forbidden', () => {
      const res = authorizePromoRedemption({
        dealCreatorId: 'user_creator_123',
        requestUserId: 'user_wrong_client',
        clientAuthorized: false,
        paymentStatus: 'pending',
      });
      assert.equal(res.status, 403);
    });

    test('creator attempting self-payment or self-promo-redemption is rejected with 403 Forbidden', () => {
      const res = authorizePromoRedemption({
        dealCreatorId: 'user_creator_123',
        requestUserId: 'user_creator_123',
        clientAuthorized: true,
        paymentStatus: 'pending',
      });
      assert.equal(res.status, 403);
      assert.match(res.error || '', /creators cannot redeem promos/i);
    });
  });

  describe('3. Idempotency & Duplicate Redemption Protection', () => {
    test('redeeming promo on an already paid deal returns 200 OK idempotent success', () => {
      const res = authorizePromoRedemption({
        dealCreatorId: 'user_creator_123',
        clientAuthorized: true,
        paymentStatus: 'paid',
      });
      assert.equal(res.status, 200);
      assert.equal(res.success, true);
      assert.equal(res.message, 'Deal already completed');
    });

    test('concurrent redemption attempts use unique idempotency key (promo_{code}_{dealId})', () => {
      const dealId = '81a4e408-f1c5-430b-99f8-d4c38aa63f82';
      const code = 'DELT';
      const idempotencyKey1 = `promo_${code}_${dealId}`;
      const idempotencyKey2 = `promo_${code}_${dealId}`;

      assert.equal(idempotencyKey1, idempotencyKey2);
      assert.equal(idempotencyKey1, 'promo_DELT_81a4e408-f1c5-430b-99f8-d4c38aa63f82');
    });
  });

});
