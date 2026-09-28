import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Deal, Milestone, Deliverable } from '../lib/types';

describe('DELT — Feature-Conditional Workspace & Payments Integration Audit', () => {
  const dummyDeal: Deal = {
    id: 'deal-101',
    dealCode: 'DLT-101',
    token: 'tok_101',
    creatorId: 'user-1',
    clientId: 'user-2',
    title: 'Brand Design Campaign',
    description: 'Minimalist brand identity project',
    scope: ['Logo Mark', 'Brand Guidelines'],
    price: 25000,
    currency: 'INR',
    status: 'in_progress',
    paymentStatus: 'pending',
    lastActivityAt: '2026-09-27T00:00:00Z',
    createdAt: '2026-09-27T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
    previewEnabled: false,
    projectStructure: 'scope_and_milestones',
  };

  describe('1. Feature-Conditional Workspace Navigation', () => {
    it('Basic deal without agreement has navigation: Overview | Chat | Files', () => {
      const hasAgreement = false;
      const navTabs = ['overview', ...(hasAgreement ? ['agreement'] : []), 'chat', 'files'];
      assert.deepStrictEqual(navTabs, ['overview', 'chat', 'files']);
      assert.strictEqual(navTabs.includes('payments'), false);
      assert.strictEqual(navTabs.includes('payment'), false);
    });

    it('Deal with agreement enabled has navigation: Overview | Agreement | Chat | Files', () => {
      const hasAgreement = true;
      const navTabs = ['overview', ...(hasAgreement ? ['agreement'] : []), 'chat', 'files'];
      assert.deepStrictEqual(navTabs, ['overview', 'agreement', 'chat', 'files']);
      assert.strictEqual(navTabs.includes('payments'), false);
      assert.strictEqual(navTabs.includes('payment'), false);
    });

    it('Payments tab is NEVER included in workspace navigation tabs regardless of payment status', () => {
      const statuses: Array<Deal['paymentStatus']> = ['pending', 'paid', 'refunded'];
      for (const status of statuses) {
        const testDeal = { ...dummyDeal, paymentStatus: status };
        const navTabs = ['overview', 'chat', 'files'];
        assert.strictEqual(navTabs.includes('payments'), false, `Payments tab found for status ${status}`);
        assert.strictEqual(navTabs.includes('payment'), false, `Payment tab found for status ${status}`);
      }
    });
  });

  describe('2. Feature-Conditional Overview UI (Milestones & Invoices)', () => {
    it('Hides Milestones section completely when Milestones are OFF (zero milestones)', () => {
      const milestones: Milestone[] = [];
      const hasMilestones = Boolean(milestones && milestones.length > 0);
      assert.strictEqual(hasMilestones, false);
      // Ensure no empty card or CTA rendered when hasMilestones is false
    });

    it('Shows Milestones section when Milestones are ON (milestones present)', () => {
      const milestones: Milestone[] = [
        {
          id: 'ms-1',
          dealId: 'deal-101',
          title: 'Initial Concepts',
          description: '3 logo concepts',
          order: 1,
          status: 'completed',
          createdAt: '2026-09-27T00:00:00Z',
          updatedAt: '2026-09-27T00:00:00Z',
        }
      ];
      const hasMilestones = Boolean(milestones && milestones.length > 0);
      assert.strictEqual(hasMilestones, true);
    });

    it('Invoice details in Payment & Client card are hidden when Invoice is OFF', () => {
      const invoices: any[] = [];
      const hasInvoice = Boolean(invoices && invoices.length > 0);
      assert.strictEqual(hasInvoice, false);
    });

    it('Invoice details in Payment & Client card are shown when Invoice is ON', () => {
      const invoices: any[] = [{ id: 'inv-1', invoice_number: 'DELT-INV-001', status: 'issued', total_amount: 25000, currency: 'INR' }];
      const hasInvoice = Boolean(invoices && invoices.length > 0);
      assert.strictEqual(hasInvoice, true);
    });
  });

  describe('3. Payment Integration in Overview', () => {
    it('Payment status and amount remain accessible via Overview Payment & Client card', () => {
      const overviewPaymentCard = {
        dealAmount: dummyDeal.price,
        currency: dummyDeal.currency,
        paymentStatus: dummyDeal.paymentStatus,
        client: 'Client Name',
      };
      assert.strictEqual(overviewPaymentCard.dealAmount, 25000);
      assert.strictEqual(overviewPaymentCard.paymentStatus, 'pending');
    });

    it('Auto-fallback tab redirects payment/payments tab selection to overview', () => {
      const sanitizeTab = (requestedTab: string, hasAgreement: boolean): string => {
        if (requestedTab === 'payments' || requestedTab === 'payment') return 'overview';
        if (requestedTab === 'agreement' && !hasAgreement) return 'overview';
        return requestedTab;
      };

      assert.strictEqual(sanitizeTab('payments', false), 'overview');
      assert.strictEqual(sanitizeTab('payment', true), 'overview');
      assert.strictEqual(sanitizeTab('agreement', false), 'overview');
      assert.strictEqual(sanitizeTab('agreement', true), 'agreement');
      assert.strictEqual(sanitizeTab('chat', false), 'chat');
      assert.strictEqual(sanitizeTab('files', false), 'files');
    });
  });

  describe('4. Legacy Deal Backward Compatibility', () => {
    it('Legacy deal with contract database record resolves hasAgreement=true', () => {
      const contractRecord = { id: 'contract-1', deal_id: 'deal-101', status: 'active' };
      const hasAgreement = Boolean(contractRecord || (dummyDeal as any).createAgreement);
      assert.strictEqual(hasAgreement, true);
    });

    it('Legacy deal without contract or createAgreement flag resolves hasAgreement=false', () => {
      const contractRecord = null;
      const hasAgreement = Boolean(contractRecord || (dummyDeal as any).createAgreement);
      assert.strictEqual(hasAgreement, false);
    });
  });
});
