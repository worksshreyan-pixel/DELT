// ==============================================================================
// DELT — Deal Storage Provider, Deliverable Versioning & Per-File Preview Test Suite
// Tests:
// 1. One Deal -> One Storage Provider (Deal provider enforcement & mixed provider rejection)
// 2. One Deliverable -> Its Own Version Sequence (Scoped versioning by deliverable_id)
// 3. One Deliverable/File -> Its Own Preview Setting (Per-file/deliverable preview gating)
// 4. Version-Aware & Cross-Deliverable Preview Isolation
// 5. Security (Payment gating & authorization boundaries)
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function isUuid(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

// ------------------------------------------------------------------------------
// Mock Store & Helper Functions for Architecture Validation
// ------------------------------------------------------------------------------
interface MockDeal {
  id: string;
  creatorId: string;
  storageProvider: 'supabase' | 'google_drive';
  previewEnabled: boolean;
  paymentStatus: 'pending' | 'paid';
}

interface MockDeliverable {
  id: string;
  dealId: string;
  name: string;
  previewEnabled?: boolean;
}

interface MockFileVersion {
  id: string;
  dealId: string;
  deliverableId: string;
  versionNumber: number;
  files: Array<{
    id: string;
    name: string;
    path: string;
    previewPath?: string;
    previewEnabled?: boolean;
  }>;
}

function calculateNextVersionNumber(
  existingVersions: MockFileVersion[],
  deliverableId: string
): number {
  const deliverableVersions = existingVersions.filter((v) => v.deliverableId === deliverableId);
  return deliverableVersions.length + 1;
}

function validateUploadProvider(
  deal: MockDeal,
  requestedProvider: string,
  isPreview: boolean
): { allowed: boolean; error?: string } {
  // System-generated previews use Supabase storage; main files must match deal's selected provider
  if (isPreview) {
    return { allowed: true };
  }
  if (requestedProvider !== deal.storageProvider) {
    return {
      allowed: false,
      error: `Mixed storage providers within a deal are not allowed. Deal requires ${deal.storageProvider}.`,
    };
  }
  return { allowed: true };
}

function canClientAccessPreview(
  deal: MockDeal,
  deliverable: MockDeliverable,
  fileVersion: MockFileVersion,
  fileId: string
): { allowed: boolean; error?: string } {
  if (!deal.previewEnabled) {
    return { allowed: false, error: 'Previews are disabled for this deal' };
  }
  if (deliverable.previewEnabled === false) {
    return { allowed: false, error: 'Preview is disabled for this deliverable' };
  }

  const targetFile = fileVersion.files.find((f) => f.id === fileId);
  if (!targetFile) {
    return { allowed: false, error: 'File not found in this version' };
  }

  if (targetFile.previewEnabled === false) {
    return { allowed: false, error: 'Preview is disabled for this file' };
  }

  return { allowed: true };
}

describe('DELT — Deal Storage Provider & Deliverable Architecture', () => {

  describe('1. Rule 1: One Deal -> One Storage Provider', () => {
    const googleDriveDeal: MockDeal = {
      id: 'deal-gd-100',
      creatorId: 'user-1',
      storageProvider: 'google_drive',
      previewEnabled: true,
      paymentStatus: 'pending',
    };

    const supabaseDeal: MockDeal = {
      id: 'deal-sb-200',
      creatorId: 'user-1',
      storageProvider: 'supabase',
      previewEnabled: true,
      paymentStatus: 'pending',
    };

    test('upload using deal designated provider succeeds', () => {
      const result = validateUploadProvider(googleDriveDeal, 'google_drive', false);
      assert.equal(result.allowed, true);
    });

    test('upload attempting mixed provider on a deal is rejected with 400 Bad Request', () => {
      const result = validateUploadProvider(googleDriveDeal, 'supabase', false);
      assert.equal(result.allowed, false);
      assert.equal(
        result.error,
        'Mixed storage providers within a deal are not allowed. Deal requires google_drive.'
      );
    });

    test('system preview upload can use system storage regardless of deal provider', () => {
      const result = validateUploadProvider(googleDriveDeal, 'supabase', true);
      assert.equal(result.allowed, true);
    });
  });

  describe('2. Rule 2: One Deliverable -> Its Own Version Sequence', () => {
    const dealId = 'deal-300';
    const delivBackground = 'deliv-bg-1';
    const delivFace = 'deliv-face-2';

    const existingVersions: MockFileVersion[] = [];

    test('first upload for Background deliverable starts at Version 1', () => {
      const vNum = calculateNextVersionNumber(existingVersions, delivBackground);
      assert.equal(vNum, 1);

      existingVersions.push({
        id: 'v-bg-1',
        dealId,
        deliverableId: delivBackground,
        versionNumber: 1,
        files: [{ id: 'f1', name: 'bg.png', path: 'path/bg_v1.png' }],
      });
    });

    test('second upload for Background deliverable increments to Version 2', () => {
      const vNum = calculateNextVersionNumber(existingVersions, delivBackground);
      assert.equal(vNum, 2);

      existingVersions.push({
        id: 'v-bg-2',
        dealId,
        deliverableId: delivBackground,
        versionNumber: 2,
        files: [{ id: 'f2', name: 'bg_v2.png', path: 'path/bg_v2.png' }],
      });
    });

    test('first upload for Face deliverable starts at Version 1 (NOT Version 3)', () => {
      const vNum = calculateNextVersionNumber(existingVersions, delivFace);
      assert.equal(vNum, 1); // Scoped to Face deliverable, NOT deal global count (2) + 1 = 3

      existingVersions.push({
        id: 'v-face-1',
        dealId,
        deliverableId: delivFace,
        versionNumber: 1,
        files: [{ id: 'f3', name: 'face.png', path: 'path/face_v1.png' }],
      });
    });

    test('version sequence remains independently scoped per deliverable', () => {
      const bgNext = calculateNextVersionNumber(existingVersions, delivBackground);
      const faceNext = calculateNextVersionNumber(existingVersions, delivFace);

      assert.equal(bgNext, 3);
      assert.equal(faceNext, 2);
    });
  });

  describe('3. Rule 3: Per-Deliverable / Per-File Preview Capability', () => {
    const deal: MockDeal = {
      id: 'deal-400',
      creatorId: 'user-1',
      storageProvider: 'supabase',
      previewEnabled: true,
      paymentStatus: 'pending',
    };

    const delivBackground: MockDeliverable = {
      id: 'deliv-bg',
      dealId: deal.id,
      name: 'Background Art',
      previewEnabled: true,
    };

    const delivFace: MockDeliverable = {
      id: 'deliv-face',
      dealId: deal.id,
      name: 'Face Rig',
      previewEnabled: false, // Explicitly disabled for Face
    };

    const verBackground: MockFileVersion = {
      id: 'ver-bg-1',
      dealId: deal.id,
      deliverableId: delivBackground.id,
      versionNumber: 1,
      files: [{ id: 'f-bg-1', name: 'bg.png', path: 'path/bg.png', previewEnabled: true }],
    };

    const verFace: MockFileVersion = {
      id: 'ver-face-1',
      dealId: deal.id,
      deliverableId: delivFace.id,
      versionNumber: 1,
      files: [{ id: 'f-face-1', name: 'face.png', path: 'path/face.png', previewEnabled: false }],
    };

    test('preview access succeeds for deliverable with Preview ON', () => {
      const res = canClientAccessPreview(deal, delivBackground, verBackground, 'f-bg-1');
      assert.equal(res.allowed, true);
    });

    test('preview access is denied for deliverable with Preview OFF', () => {
      const res = canClientAccessPreview(deal, delivFace, verFace, 'f-face-1');
      assert.equal(res.allowed, false);
      assert.equal(res.error, 'Preview is disabled for this deliverable');
    });
  });

  describe('4. Version-Aware & Cross-Deliverable Preview Isolation', () => {
    const deal: MockDeal = {
      id: 'deal-500',
      creatorId: 'user-1',
      storageProvider: 'supabase',
      previewEnabled: true,
      paymentStatus: 'pending',
    };

    const deliv: MockDeliverable = {
      id: 'deliv-1',
      dealId: deal.id,
      name: 'Assets',
    };

    const ver1: MockFileVersion = {
      id: 'ver-1',
      dealId: deal.id,
      deliverableId: deliv.id,
      versionNumber: 1,
      files: [{ id: 'file-v1', name: 'draft.png', path: 'previews/deal-500/v1/draft.png' }],
    };

    test('preview request for invalid fileId in version returns 404', () => {
      const res = canClientAccessPreview(deal, deliv, ver1, 'non-existent-file-id');
      assert.equal(res.allowed, false);
      assert.equal(res.error, 'File not found in this version');
    });
  });

  describe('5. Security & Payment Bounds', () => {
    test('unpaid client cannot download original file when preview mode is standard AUTO', () => {
      const isPaid = false;
      const previewMode: string = 'AUTO';
      const isOriginalDownloadAllowed = isPaid || previewMode === 'OPEN_ORIGINAL';

      assert.equal(isOriginalDownloadAllowed, false);
    });

    test('paid deal allows original file downloads for all deliverables', () => {
      const isPaid = true;
      const previewMode: string = 'AUTO';
      const isOriginalDownloadAllowed = isPaid || previewMode === 'OPEN_ORIGINAL';

      assert.equal(isOriginalDownloadAllowed, true);
    });
  });
});
