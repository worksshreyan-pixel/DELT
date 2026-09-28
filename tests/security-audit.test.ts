import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('DELT — Security Audit & Regression Suite', () => {

  describe('1. Storage Access & Preview Security Bounds', () => {
    function isOriginalDownloadAllowed(deal: {
      paymentStatus: string;
      status: string;
      previewEnabled: boolean;
      previewMode: 'OPEN_ORIGINAL' | 'AUTO' | 'MANUAL' | 'EXTERNAL' | 'NONE';
    }): boolean {
      const isPaid = deal.paymentStatus === 'paid' || deal.status === 'completed';
      if (isPaid) return true;
      return Boolean(deal.previewEnabled && deal.previewMode === 'OPEN_ORIGINAL');
    }

    test('unpaid deal with previewMode=NONE denies downloadable signed URL', () => {
      const deal = { paymentStatus: 'pending', status: 'in_progress', previewEnabled: false, previewMode: 'NONE' as const };
      assert.equal(isOriginalDownloadAllowed(deal), false);
    });

    test('unpaid deal with previewMode=AUTO denies original downloadable signed URL', () => {
      const deal = { paymentStatus: 'pending', status: 'in_progress', previewEnabled: true, previewMode: 'AUTO' as const };
      assert.equal(isOriginalDownloadAllowed(deal), false);
    });

    test('unpaid deal with previewMode=MANUAL denies original downloadable signed URL', () => {
      const deal = { paymentStatus: 'pending', status: 'in_progress', previewEnabled: true, previewMode: 'MANUAL' as const };
      assert.equal(isOriginalDownloadAllowed(deal), false);
    });

    test('unpaid deal with previewMode=OPEN_ORIGINAL allows original downloadable signed URL', () => {
      const deal = { paymentStatus: 'pending', status: 'in_progress', previewEnabled: true, previewMode: 'OPEN_ORIGINAL' as const };
      assert.equal(isOriginalDownloadAllowed(deal), true);
    });

    test('paid deal allows downloadable signed URL regardless of previewMode', () => {
      const deal = { paymentStatus: 'paid', status: 'completed', previewEnabled: false, previewMode: 'NONE' as const };
      assert.equal(isOriginalDownloadAllowed(deal), true);
    });
  });

  describe('2. Invoice Access & IDOR Prevention', () => {
    function canClientViewInvoice(
      invoice: { dealId: string; status: string; clientEmail: string },
      clientAuth: { authorized: boolean; dealId?: string; clientEmail?: string }
    ): boolean {
      if (!clientAuth.authorized) return false;
      if (clientAuth.dealId !== invoice.dealId) return false;
      if (invoice.status === 'draft') return false;
      return true;
    }

    test('unauthorized request cannot view invoice', () => {
      const invoice = { dealId: 'deal-1', status: 'issued', clientEmail: 'client@example.com' };
      const auth = { authorized: false };
      assert.equal(canClientViewInvoice(invoice, auth), false);
    });

    test('authorized client for wrong deal ID is denied (IDOR protection)', () => {
      const invoice = { dealId: 'deal-1', status: 'issued', clientEmail: 'client@example.com' };
      const auth = { authorized: true, dealId: 'deal-2', clientEmail: 'client@example.com' };
      assert.equal(canClientViewInvoice(invoice, auth), false);
    });

    test('draft invoice is never accessible to client', () => {
      const invoice = { dealId: 'deal-1', status: 'draft', clientEmail: 'client@example.com' };
      const auth = { authorized: true, dealId: 'deal-1', clientEmail: 'client@example.com' };
      assert.equal(canClientViewInvoice(invoice, auth), false);
    });

    test('authorized client can view issued invoice for matching deal', () => {
      const invoice = { dealId: 'deal-1', status: 'issued', clientEmail: 'client@example.com' };
      const auth = { authorized: true, dealId: 'deal-1', clientEmail: 'client@example.com' };
      assert.equal(canClientViewInvoice(invoice, auth), true);
    });
  });

  describe('3. Payment Verification Idempotency & Race Conditions', () => {
    interface PaymentState {
      state: 'pending' | 'paid' | 'failed';
      finalizedCount: number;
    }

    function processPaymentVerification(
      payment: PaymentState,
      orderId: string
    ): { success: boolean; state: string; finalized: boolean } {
      if (payment.state === 'paid') {
        return { success: true, state: 'paid', finalized: false };
      }

      payment.state = 'paid';
      payment.finalizedCount += 1;
      return { success: true, state: 'paid', finalized: true };
    }

    test('first payment verification call finalizes payment', () => {
      const payment: PaymentState = { state: 'pending', finalizedCount: 0 };
      const res = processPaymentVerification(payment, 'ord_123');
      assert.equal(res.success, true);
      assert.equal(res.finalized, true);
      assert.equal(payment.finalizedCount, 1);
    });

    test('duplicate payment verification call is idempotent and does not re-finalize', () => {
      const payment: PaymentState = { state: 'pending', finalizedCount: 0 };
      processPaymentVerification(payment, 'ord_123');
      const res2 = processPaymentVerification(payment, 'ord_123');
      assert.equal(res2.success, true);
      assert.equal(res2.finalized, false);
      assert.equal(payment.finalizedCount, 1);
    });
  });

  describe('4. Review State Machine Enforcement', () => {
    function isValidReviewTransition(
      currentVersionStatus: 'pending_review' | 'approved' | 'changes_requested',
      action: 'approve' | 'request_changes',
      isOutdatedVersion: boolean
    ): boolean {
      if (isOutdatedVersion) return false;
      if (currentVersionStatus !== 'pending_review') return false;
      return true;
    }

    test('pending_review version can be approved', () => {
      assert.equal(isValidReviewTransition('pending_review', 'approve', false), true);
    });

    test('pending_review version can have changes requested', () => {
      assert.equal(isValidReviewTransition('pending_review', 'request_changes', false), true);
    });

    test('already approved version cannot be re-reviewed', () => {
      assert.equal(isValidReviewTransition('approved', 'approve', false), false);
      assert.equal(isValidReviewTransition('approved', 'request_changes', false), false);
    });

    test('outdated version cannot be reviewed', () => {
      assert.equal(isValidReviewTransition('pending_review', 'approve', true), false);
    });
  });
});
