import { describe, test } from 'node:test';
import assert from 'node:assert';
import { buildDealCardData, getDealCardStatusMeta } from '../lib/deal-card-data';
import type { Deal } from '../lib/types';

describe('DELT — Share Deal Card Alignment & Export Consistency', () => {
  const baseDeal: Deal = {
    id: 'deal-uuid-1',
    dealCode: 'DLT-EXPORT1',
    token: 'tok-1',
    creatorId: 'user-1',
    clientId: 'client-1',
    title: 'Short Title',
    description: 'A detailed project description snippet',
    scope: ['Deliverable 1', 'Deliverable 2', 'Deliverable 3'],
    price: 25000,
    currency: 'INR',
    status: 'in_progress',
    paymentStatus: 'pending',
    lastActivityAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    previewEnabled: false,
    projectStructure: 'scope',
  };

  describe('1. Deal Card Data Mapping & Proportions', () => {
    test('builds identical data structure for visible modal card and exported image poster', () => {
      const modalData = buildDealCardData({
        deal: baseDeal,
        creatorName: 'Shreyan Studio',
        clientName: 'Acme Corp',
        deliverablesCount: 3,
      });

      const exportData = buildDealCardData({
        deal: baseDeal,
        creatorName: 'Shreyan Studio',
        clientName: 'Acme Corp',
        deliverablesCount: 3,
      });

      assert.deepStrictEqual(modalData, exportData);
      assert.strictEqual(modalData.dealCode, 'DLT-EXPORT1');
      assert.strictEqual(modalData.creatorName, 'Shreyan Studio');
      assert.strictEqual(modalData.clientName, 'Acme Corp');
      assert.strictEqual(modalData.amountLabel, '25,000');
      assert.strictEqual(modalData.currencySymbol, '₹');
    });

    test('handles extremely long deal titles without breaking status meta or layout', () => {
      const longTitle = 'Super Long Deal Title That Spans Multiple Lines For Video Production, Editing, Motion Graphics, and Audio Mastering';
      const data = buildDealCardData({
        deal: { ...baseDeal, title: longTitle },
        creatorName: 'Creator With Very Long Display Name Studio Incorporated',
        clientName: 'Client Enterprise International Corporation Limited',
      });

      assert.strictEqual(data.title, longTitle);
      const statusMeta = getDealCardStatusMeta(data.status);
      assert.strictEqual(statusMeta.label, 'In Progress');
      assert.strictEqual(statusMeta.accent, '#6366F1');
    });

    test('preserves status accent colors across all deal statuses', () => {
      const statuses: Array<Deal['status']> = ['draft', 'sent', 'negotiating', 'in_progress', 'payment_pending', 'paid', 'completed', 'closed'];
      for (const st of statuses) {
        const meta = getDealCardStatusMeta(st);
        assert.ok(meta.label);
        assert.ok(meta.accent.startsWith('#') || meta.accent.startsWith('rgb'));
      }
    });

    test('correctly formats currency symbol baseline for USD, EUR, GBP, INR', () => {
      const inr = buildDealCardData({ deal: { ...baseDeal, currency: 'INR', price: 15000 } });
      assert.strictEqual(inr.currencySymbol, '₹');
      assert.strictEqual(inr.amountLabel, '15,000');

      const usd = buildDealCardData({ deal: { ...baseDeal, currency: 'USD', price: 500 } });
      assert.strictEqual(usd.currencySymbol, '$');

      const eur = buildDealCardData({ deal: { ...baseDeal, currency: 'EUR', price: 750 } });
      assert.strictEqual(eur.currencySymbol, '€');

      const gbp = buildDealCardData({ deal: { ...baseDeal, currency: 'GBP', price: 1200 } });
      assert.strictEqual(gbp.currencySymbol, '£');
    });
  });
});
