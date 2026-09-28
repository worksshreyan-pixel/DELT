import { describe, test } from 'node:test';
import assert from 'node:assert';
import { getCanonicalDeliverables } from '../lib/deals/canonical-deliverables';
import type { Deal, Deliverable, FileVersion } from '../lib/types';

describe('DELT — Simplify Dashboard & Finalize Client Overview Information Architecture', () => {
  describe('1. Scope Removal & Canonical Deliverables', () => {
    test('returns empty array when deal.scope is [] and no file-backed deliverables exist', () => {
      const mockDeal: Deal = {
        id: 'deal-uuid-1',
        token: 'token-1',
        creatorId: 'user-1',
        clientId: 'client-1',
        title: 'Video Editing',
        description: 'Edit promo video',
        scope: [],
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

      const dbDeliverables: Deliverable[] = [];
      const fileVersions: FileVersion[] = [];

      const canonical = getCanonicalDeliverables(mockDeal, dbDeliverables, fileVersions);
      assert.deepStrictEqual(canonical, []);
    });

    test('clears previous scope deliverables when deal.scope is emptied from previous values', () => {
      const mockDealWithScope: Deal = {
        id: 'deal-uuid-1',
        token: 'token-1',
        creatorId: 'user-1',
        clientId: 'client-1',
        title: 'Video Editing',
        description: 'Edit promo video',
        scope: ['Video 1', 'Video 2'],
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

      const before = getCanonicalDeliverables(mockDealWithScope, [], []);
      assert.strictEqual(before.length, 2);

      // Creator edits deal scope -> []
      const mockDealEmptied: Deal = {
        ...mockDealWithScope,
        scope: [],
      };

      const after = getCanonicalDeliverables(mockDealEmptied, [], []);
      assert.strictEqual(after.length, 0);
      assert.deepStrictEqual(after, []);
    });
  });

  describe('2. Dashboard Expiry Calculation', () => {
    function formatExpiryText(deal: { deadline?: string; createdAt?: string }): string {
      const targetDate = deal.deadline
        ? new Date(deal.deadline)
        : new Date(new Date(deal.createdAt || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 1) return `Expires in ${diffDays} days`;
      if (diffDays === 1) return `Expires in 1 day`;
      if (diffDays === 0) return `Expires today`;
      const pastDays = Math.abs(diffDays);
      if (pastDays === 1) return `Expired 1 day ago`;
      return `Expired ${pastDays} days ago`;
    }

    test('formats future deadline correctly (e.g. Expires in 3 days)', () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const text = formatExpiryText({ deadline: futureDate });
      assert.match(text, /Expires in (2|3) days/);
    });

    test('formats past deadline correctly (e.g. Expired 2 days ago)', () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const text = formatExpiryText({ deadline: pastDate });
      assert.match(text, /Expired (1|2) days ago/);
    });
  });
});
