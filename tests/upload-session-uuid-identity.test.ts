// ==============================================================================
// DELT — Upload Session UUID Identity & Safety Regression Suite
// Tests: Real deal UUID requirement for upload_sessions.deal_id,
// resolution of public deal codes (DLT-XXXXXXXX), handling of invalid temporary IDs (del-1),
// deliverable identity resolution, creator access authorization, and multi-file/retry isolation.
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { uploadQueue } from '../lib/upload-queue';

function isUuid(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

// Simulated upload init handler logic mirroring /api/files/upload/init route identity resolution
async function processUploadInit(
  reqBody: { dealId: string; deliverableId: string; fileName: string; fileSize: number },
  mockDb: {
    deals: Array<{ id: string; deal_code: string; creator_id: string }>;
    deliverables: Array<{ id: string; deal_id: string; name: string }>;
    uploadSessions: Array<{ id: string; deal_id: string; deliverable_id: string }>;
  },
  authenticatedUserId: string
) {
  const { dealId, deliverableId, fileName, fileSize } = reqBody;

  if (!dealId || !fileName) {
    return { status: 400, error: 'Missing required upload parameters' };
  }

  let canonicalDealId = dealId;

  // 1. Resolve deal identity
  if (!isUuid(dealId)) {
    // Attempt lookup by public deal_code (DLT-XXXXXXXX)
    const matchingDeal = mockDb.deals.find(
      (d) => d.deal_code === dealId && d.creator_id === authenticatedUserId
    );
    if (matchingDeal) {
      canonicalDealId = matchingDeal.id;
    } else {
      return { status: 400, error: 'Invalid deal identity provided' };
    }
  } else {
    // Verify deal exists and caller is owner
    const existingDeal = mockDb.deals.find(
      (d) => d.id === dealId && d.creator_id === authenticatedUserId
    );
    if (!existingDeal) {
      return { status: 403, error: 'Forbidden. You do not own this deal.' };
    }
  }

  // 2. Resolve deliverable identity
  let canonicalDeliverableId = deliverableId;
  if (!isUuid(deliverableId)) {
    const existingDeliv = mockDb.deliverables.find((d) => d.deal_id === canonicalDealId);
    if (existingDeliv) {
      canonicalDeliverableId = existingDeliv.id;
    } else {
      const newDeliv = {
        id: `00000000-0000-4000-a000-${Math.random().toString(16).slice(2, 14).padStart(12, '0')}`,
        deal_id: canonicalDealId,
        name: 'Project Deliverables',
      };
      mockDb.deliverables.push(newDeliv);
      canonicalDeliverableId = newDeliv.id;
    }
  }

  // 3. Final validation before insertion
  if (!isUuid(canonicalDealId) || !isUuid(canonicalDeliverableId)) {
    return { status: 400, error: 'Unable to start this upload session. Please retry.' };
  }

  // 4. Create upload session row
  const session = {
    id: `00000000-0000-4000-b000-${Math.random().toString(16).slice(2, 14).padStart(12, '0')}`,
    deal_id: canonicalDealId,
    deliverable_id: canonicalDeliverableId,
  };
  mockDb.uploadSessions.push(session);

  return {
    status: 200,
    uploadSessionId: session.id,
    dealId: canonicalDealId,
    deliverableId: canonicalDeliverableId,
  };
}

describe('DELT — Upload Session UUID Identity & Safety', () => {
  const REAL_USER_ID = 'user-uuid-1111-1111-1111-111111111111';
  const OTHER_USER_ID = 'user-uuid-2222-2222-2222-222222222222';
  const REAL_DEAL_UUID = '12345678-1234-4234-8234-123456789abc';
  const OTHER_DEAL_UUID = '87654321-4321-4321-8321-cba987654321';
  const REAL_DELIVERABLE_UUID = 'abcdef01-abcd-4bcd-8bcd-abcdef012345';

  function createMockDb() {
    return {
      deals: [
        { id: REAL_DEAL_UUID, deal_code: 'DLT-TEST1234', creator_id: REAL_USER_ID },
        { id: OTHER_DEAL_UUID, deal_code: 'DLT-OTHER567', creator_id: OTHER_USER_ID },
      ],
      deliverables: [
        { id: REAL_DELIVERABLE_UUID, deal_id: REAL_DEAL_UUID, name: 'Main Deliverables' },
      ],
      uploadSessions: [] as Array<{ id: string; deal_id: string; deliverable_id: string }>,
    };
  }

  describe('1. Identity Contract & Validation', () => {
    test('valid real deal UUID initializes upload session successfully', async () => {
      const db = createMockDb();
      const res = await processUploadInit(
        { dealId: REAL_DEAL_UUID, deliverableId: REAL_DELIVERABLE_UUID, fileName: 'spec.pdf', fileSize: 1024 },
        db,
        REAL_USER_ID
      );

      assert.equal(res.status, 200);
      assert.equal(res.dealId, REAL_DEAL_UUID);
      assert.ok(isUuid(res.dealId!));
      assert.ok(isUuid(res.deliverableId!));
      assert.equal(db.uploadSessions.length, 1);
      assert.equal(db.uploadSessions[0].deal_id, REAL_DEAL_UUID);
    });

    test('invalid temporary ID "del-1" is rejected without hitting database foreign key error', async () => {
      const db = createMockDb();
      const res = await processUploadInit(
        { dealId: 'del-1', deliverableId: 'del-1', fileName: 'spec.pdf', fileSize: 1024 },
        db,
        REAL_USER_ID
      );

      assert.equal(res.status, 400);
      assert.equal(res.error, 'Invalid deal identity provided');
      assert.equal(db.uploadSessions.length, 0);
    });

    test('public deal_code (DLT-TEST1234) resolves correctly to real internal deals.id UUID', async () => {
      const db = createMockDb();
      const res = await processUploadInit(
        { dealId: 'DLT-TEST1234', deliverableId: REAL_DELIVERABLE_UUID, fileName: 'logo.png', fileSize: 2048 },
        db,
        REAL_USER_ID
      );

      assert.equal(res.status, 200);
      assert.equal(res.dealId, REAL_DEAL_UUID);
      assert.ok(isUuid(db.uploadSessions[0].deal_id));
      assert.equal(db.uploadSessions[0].deal_id, REAL_DEAL_UUID);
    });

    test('non-UUID deliverable ID (e.g. del-1) resolves to existing deliverable UUID for the deal', async () => {
      const db = createMockDb();
      const res = await processUploadInit(
        { dealId: REAL_DEAL_UUID, deliverableId: 'del-1', fileName: 'draft.docx', fileSize: 4096 },
        db,
        REAL_USER_ID
      );

      assert.equal(res.status, 200);
      assert.equal(res.deliverableId, REAL_DELIVERABLE_UUID);
      assert.ok(isUuid(db.uploadSessions[0].deliverable_id));
    });
  });

  describe('2. Authorization & Isolation', () => {
    test('user cannot initialize upload session for another user deal', async () => {
      const db = createMockDb();
      const res = await processUploadInit(
        { dealId: OTHER_DEAL_UUID, deliverableId: 'del-1', fileName: 'unauthorized.zip', fileSize: 8192 },
        db,
        REAL_USER_ID
      );

      assert.equal(res.status, 403);
      assert.equal(db.uploadSessions.length, 0);
    });
  });

  describe('3. Queue Isolation & Handoff Integration', () => {
    test('multi-file upload batch preserves real deal UUID for all tasks', () => {
      const mockFile1 = new File(['data1'], 'file1.pdf', { type: 'application/pdf' });
      const mockFile2 = new File(['data2'], 'file2.png', { type: 'image/png' });

      uploadQueue.addUploads(
        REAL_DEAL_UUID,
        REAL_DELIVERABLE_UUID,
        [mockFile1, mockFile2],
        'Multi-file batch',
        false,
        undefined,
        false
      );

      const dealTasks = uploadQueue.getTasks().filter((t) => t.dealId === REAL_DEAL_UUID);
      assert.equal(dealTasks.length, 2);
      assert.ok(isUuid(dealTasks[0].dealId));
      assert.ok(isUuid(dealTasks[1].dealId));
      assert.equal(dealTasks[0].dealId, REAL_DEAL_UUID);
      assert.equal(dealTasks[1].dealId, REAL_DEAL_UUID);

      // Clean up queue
      dealTasks.forEach((t) => uploadQueue.removeTask(t.id));
    });

    test('retry task maintains exact real deal UUID', () => {
      const mockFile = new File(['data'], 'retry.zip', { type: 'application/zip' });

      uploadQueue.addUploads(
        REAL_DEAL_UUID,
        REAL_DELIVERABLE_UUID,
        [mockFile],
        'Retry test',
        false,
        undefined,
        false
      );

      const tasks = uploadQueue.getTasks().filter((t) => t.dealId === REAL_DEAL_UUID);
      const task = tasks[0];
      task.status = 'failed';

      uploadQueue.retryTask(task.id);

      const retriedTask = uploadQueue.getTasks().find((t) => t.id === task.id);
      assert.ok(retriedTask);
      assert.ok(retriedTask?.status === 'uploading' || retriedTask?.status === 'waiting' || retriedTask?.status === 'failed');
      assert.equal(retriedTask?.dealId, REAL_DEAL_UUID);
      assert.ok(isUuid(retriedTask?.dealId || ''));

      uploadQueue.removeTask(task.id);
    });
  });
});
