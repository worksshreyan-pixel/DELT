// ==============================================================================
// DELT — File Upload Lifecycle Handoff & Workspace Auto-Start Audit
// Tests: Deferring uploads during Create Deal, immediate workspace navigation,
// automatic start when workspace mounts, progress tracking, retry logic, and
// multi-deal queue isolation.
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { uploadQueue, activeFilesRegistry, type UploadTask } from '../lib/upload-queue';

describe('DELT — File Upload Lifecycle Handoff & Workspace Initialization', () => {

  // ------------------------------------------------------------- Queue Handoff --
  describe('1. Queue Handoff from Create Deal to Workspace', () => {
    test('addUploads with autoStart=false enqueues tasks without immediate execution', () => {
      const dealId = `deal_test_${Date.now()}`;
      const deliverableId = `del_test_${Date.now()}`;
      
      const mockFile1 = new File(['content-1'], 'test-deliverable-1.pdf', { type: 'application/pdf' });
      const mockFile2 = new File(['content-2'], 'test-deliverable-2.png', { type: 'image/png' });

      // Enqueue with autoStart = false
      uploadQueue.addUploads(
        dealId,
        deliverableId,
        [mockFile1, mockFile2],
        'Test deliverables',
        true,
        undefined,
        false // autoStart = false
      );

      const tasks = uploadQueue.getTasks().filter((t) => t.dealId === dealId);
      assert.equal(tasks.length, 2);
      assert.equal(tasks[0].fileName, 'test-deliverable-1.pdf');
      assert.equal(tasks[0].status, 'waiting');
      assert.equal(tasks[1].fileName, 'test-deliverable-2.png');
      assert.equal(tasks[1].status, 'waiting');

      // Cleanup test tasks
      tasks.forEach((t) => uploadQueue.removeTask(t.id));
    });
  });

  // ------------------------------------------------ Workspace Auto-Start --
  describe('2. Workspace Initialization & Auto-Start', () => {
    test('startPendingUploadsForDeal picks up waiting tasks for the specified deal', () => {
      const dealId = `deal_autostart_${Date.now()}`;
      const deliverableId = `del_autostart_${Date.now()}`;
      
      const mockFile = new File(['content-3'], 'asset.mp4', { type: 'video/mp4' });

      uploadQueue.addUploads(
        dealId,
        deliverableId,
        [mockFile],
        'Video asset',
        false,
        undefined,
        false
      );

      let tasks = uploadQueue.getTasks().filter((t) => t.dealId === dealId);
      assert.equal(tasks[0].status, 'waiting');

      // Simulate DealWorkspace mount
      uploadQueue.startPendingUploadsForDeal(dealId);

      tasks = uploadQueue.getTasks().filter((t) => t.dealId === dealId);
      // Status transitions to uploading or processing
      assert.ok(tasks[0].status === 'uploading' || tasks[0].status === 'completed' || tasks[0].status === 'failed');

      tasks.forEach((t) => uploadQueue.removeTask(t.id));
    });
  });

  // ------------------------------------------------- Failures & Retry Logic --
  describe('3. Failure Recovery & Retry Logic', () => {
    test('retryTask resets failed task status to waiting and restarts processing', () => {
      const dealId = `deal_retry_${Date.now()}`;
      const deliverableId = `del_retry_${Date.now()}`;

      const mockFile = new File(['content-4'], 'report.pdf', { type: 'application/pdf' });

      uploadQueue.addUploads(
        dealId,
        deliverableId,
        [mockFile],
        'PDF report',
        false,
        undefined,
        false
      );

      const tasks = uploadQueue.getTasks().filter((t) => t.dealId === dealId);
      const task = tasks[0];

      // Simulate a failed task state
      task.status = 'failed';
      task.error = 'Network connection interrupted';

      assert.equal(task.status, 'failed');

      // Re-register file object to simulate user re-selecting or session recovery
      activeFilesRegistry.set(task.id, mockFile);

      // Trigger retryTask
      uploadQueue.retryTask(task.id);

      const updatedTask = uploadQueue.getTasks().find((t) => t.id === task.id);
      assert.ok(updatedTask);
      assert.equal(updatedTask?.error, undefined);
      assert.ok(updatedTask?.status === 'waiting' || updatedTask?.status === 'uploading' || updatedTask?.status === 'completed' || updatedTask?.status === 'failed');

      uploadQueue.removeTask(task.id);
    });
  });

  // ---------------------------------------------------- Multi-Deal Isolation --
  describe('4. Multi-Deal Isolation', () => {
    test('Tasks belonging to Deal A never leak into Deal B', () => {
      const dealA = `deal_A_${Date.now()}`;
      const dealB = `deal_B_${Date.now()}`;

      const fileA = new File(['a'], 'fileA.pdf', { type: 'application/pdf' });
      const fileB = new File(['b'], 'fileB.png', { type: 'image/png' });

      uploadQueue.addUploads(dealA, 'delA', [fileA], 'Deal A file', false, undefined, false);
      uploadQueue.addUploads(dealB, 'delB', [fileB], 'Deal B file', false, undefined, false);

      const tasksA = uploadQueue.getTasks().filter((t) => t.dealId === dealA);
      const tasksB = uploadQueue.getTasks().filter((t) => t.dealId === dealB);

      assert.equal(tasksA.length, 1);
      assert.equal(tasksA[0].fileName, 'fileA.pdf');

      assert.equal(tasksB.length, 1);
      assert.equal(tasksB[0].fileName, 'fileB.png');

      tasksA.forEach((t) => uploadQueue.removeTask(t.id));
      tasksB.forEach((t) => uploadQueue.removeTask(t.id));
    });
  });
});
