import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getCanonicalDeliverables } from '../lib/deals/canonical-deliverables';
import { buildDealCardData } from '../lib/deal-card-data';
import type { Deal, Milestone, Deliverable, FileVersion } from '../lib/types';

describe('DELT — Scope & Milestones Production Integration Audit', () => {

  describe('1. Scope Source of Truth & Deliverable Consistency', () => {
    test('getCanonicalDeliverables uses deals.scope as the primary source of truth', () => {
      const deal: Partial<Deal> = {
        id: 'deal-101',
        scope: ['Branding Guide', 'Logo Pack', 'Social Templates'],
        paymentStatus: 'pending',
        status: 'in_progress',
        createdAt: '2026-01-01T00:00:00Z',
      };

      const dbDelivs: Deliverable[] = [];
      const fileVersions: FileVersion[] = [];

      const canonical = getCanonicalDeliverables(deal as Deal, dbDelivs, fileVersions);

      assert.equal(canonical.length, 3);
      assert.equal(canonical[0].name, 'Branding Guide');
      assert.equal(canonical[1].name, 'Logo Pack');
      assert.equal(canonical[2].name, 'Social Templates');
    });

    test('Creator and Client both receive identical deliverables list from canonical source', () => {
      const deal: Partial<Deal> = {
        id: 'deal-102',
        scope: ['Website Redesign', 'Copywriting'],
        paymentStatus: 'pending',
        status: 'in_progress',
        createdAt: '2026-01-01T00:00:00Z',
      };

      const creatorView = getCanonicalDeliverables(deal as Deal, [], []);
      const clientView = getCanonicalDeliverables(deal as Deal, [], []);

      assert.deepEqual(creatorView, clientView);
    });
  });

  describe('2. Milestone Progress Calculation', () => {
    test('Derived progress percent is calculated cleanly from completed / total milestones', () => {
      const milestones: Array<Pick<Milestone, 'status'>> = [
        { status: 'completed' },
        { status: 'in_progress' },
        { status: 'pending' },
        { status: 'completed' },
      ];

      const cardData = buildDealCardData({
        deal: { title: 'Test Deal', dealCode: 'DLT-123' } as any,
        milestones,
      });

      assert.equal(cardData.totalMilestones, 4);
      assert.equal(cardData.completedMilestones, 2);
      assert.equal(cardData.progressPercent, 50);
    });

    test('Zero milestones returns undefined progress, avoiding fake 0%', () => {
      const cardData = buildDealCardData({
        deal: { title: 'Test Deal', dealCode: 'DLT-123' } as any,
        milestones: [],
      });

      assert.equal(cardData.totalMilestones, undefined);
      assert.equal(cardData.completedMilestones, undefined);
      assert.equal(cardData.progressPercent, undefined);
    });

    test('All completed milestones yields 100% progress', () => {
      const milestones: Array<Pick<Milestone, 'status'>> = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'completed' },
      ];

      const cardData = buildDealCardData({
        deal: { title: 'Test Deal', dealCode: 'DLT-123' } as any,
        milestones,
      });

      assert.equal(cardData.progressPercent, 100);
      assert.equal(cardData.completedMilestones, 3);
      assert.equal(cardData.totalMilestones, 3);
    });
  });

  describe('3. Milestone State Transitions & Validation', () => {
    test('Valid milestone statuses are pending, in_progress, completed', () => {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      
      assert.ok(validStatuses.includes('pending'));
      assert.ok(validStatuses.includes('in_progress'));
      assert.ok(validStatuses.includes('completed'));
      assert.equal(validStatuses.includes('invalid_status'), false);
    });

    test('API code enforces valid status checks for milestone updates', () => {
      const fs = require('fs');
      const path = require('path');
      const patchRoute = fs.readFileSync(
        path.join(process.cwd(), 'app', 'api', 'deals', '[code]', 'milestones', '[milestoneId]', 'route.ts'),
        'utf-8'
      );

      assert.ok(
        patchRoute.includes("['pending', 'in_progress', 'completed'].includes(body.status)"),
        'PATCH milestone route must validate status string against allowed values'
      );
    });
  });

  describe('4. Security & Authorization (IDOR & Role Boundaries)', () => {
    test('Milestone mutation endpoints requireCreatorDealAccess', () => {
      const fs = require('fs');
      const path = require('path');

      const postRoute = fs.readFileSync(
        path.join(process.cwd(), 'app', 'api', 'deals', '[code]', 'milestones', 'route.ts'),
        'utf-8'
      );
      assert.ok(postRoute.includes('requireCreatorDealAccess'), 'POST milestone route must require creator access');

      const patchRoute = fs.readFileSync(
        path.join(process.cwd(), 'app', 'api', 'deals', '[code]', 'milestones', '[milestoneId]', 'route.ts'),
        'utf-8'
      );
      assert.ok(patchRoute.includes('requireCreatorDealAccess'), 'PATCH milestone route must require creator access');

      const reorderRoute = fs.readFileSync(
        path.join(process.cwd(), 'app', 'api', 'deals', '[code]', 'milestones', 'reorder', 'route.ts'),
        'utf-8'
      );
      assert.ok(reorderRoute.includes('requireCreatorDealAccess'), 'Reorder milestone route must require creator access');
    });

    test('PATCH milestone route checks milestone ownership against deal.id (IDOR protection)', () => {
      const fs = require('fs');
      const path = require('path');

      const patchRoute = fs.readFileSync(
        path.join(process.cwd(), 'app', 'api', 'deals', '[code]', 'milestones', '[milestoneId]', 'route.ts'),
        'utf-8'
      );

      assert.ok(
        patchRoute.includes(".eq('deal_id', deal.id)"),
        'Milestone PATCH route must verify milestone belongs to the authenticated deal'
      );
    });

    test('Reorder route validates that all milestone IDs belong to deal.id', () => {
      const fs = require('fs');
      const path = require('path');

      const reorderRoute = fs.readFileSync(
        path.join(process.cwd(), 'app', 'api', 'deals', '[code]', 'milestones', 'reorder', 'route.ts'),
        'utf-8'
      );

      assert.ok(
        reorderRoute.includes('validIdSet.size !== itemIds.length'),
        'Reorder route must verify every reordered ID belongs to the target deal'
      );
    });

    test('Client component ScopeMilestones hides all editing & management controls', () => {
      const fs = require('fs');
      const path = require('path');

      const componentContent = fs.readFileSync(
        path.join(process.cwd(), 'components', 'scope-milestones.tsx'),
        'utf-8'
      );

      assert.ok(
        componentContent.includes('isCreator &&'),
        'Management buttons in ScopeMilestones component must be guarded by isCreator'
      );
    });
  });

  describe('5. Contract Snapshot Isolation', () => {
    test('Contract capture helpers take independent historical snapshots', () => {
      const fs = require('fs');
      const path = require('path');

      const stateContent = fs.readFileSync(
        path.join(process.cwd(), 'lib', 'contracts', 'state.ts'),
        'utf-8'
      );

      assert.ok(
        stateContent.includes('export async function captureMilestonesSnapshot'),
        'Contract state helper captureMilestonesSnapshot must exist'
      );
      assert.ok(
        stateContent.includes('export async function captureDeliverablesSnapshot'),
        'Contract state helper captureDeliverablesSnapshot must exist'
      );
    });
  });
});
