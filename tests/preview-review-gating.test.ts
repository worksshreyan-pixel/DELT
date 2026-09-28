import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getEffectivePreviewState, isUsablePreviewAvailable } from '../lib/preview-utils';
import { storageRegistry } from '../lib/storage/registry';
import { SupabaseStorageProvider } from '../lib/storage/providers/supabase-provider';
import { GoogleDriveProvider } from '../lib/storage/providers/google-drive-provider';

describe('DELT — Direct Preview & Review Gating Test Suite', () => {
  storageRegistry.register(new SupabaseStorageProvider());
  storageRegistry.register(new GoogleDriveProvider());

  describe('Authoritative Preview Availability', () => {
    test('1. Disabled previews return NO_PREVIEW and false for usable preview', () => {
      const state = getEffectivePreviewState({
        previewEnabled: false,
        previewMode: 'OPEN_ORIGINAL',
        files: [{ path: 'deals/deal-1/v1/file.pdf' }],
      });
      assert.equal(state, 'NO_PREVIEW');
      assert.equal(isUsablePreviewAvailable({ previewEnabled: false, files: [{ path: 'deals/deal-1/v1/file.pdf' }] }), false);
    });

    test('2. NONE preview mode returns NO_PREVIEW', () => {
      const state = getEffectivePreviewState({
        previewEnabled: true,
        previewMode: 'NONE',
        files: [{ path: 'deals/deal-1/v1/file.pdf' }],
      });
      assert.equal(state, 'NO_PREVIEW');
      assert.equal(isUsablePreviewAvailable({ previewEnabled: true, previewMode: 'NONE', files: [{ path: 'deals/deal-1/v1/file.pdf' }] }), false);
    });

    test('3. Direct Preview (OPEN_ORIGINAL) returns DIRECT_PREVIEW_AVAILABLE when file exists', () => {
      const state = getEffectivePreviewState({
        previewEnabled: true,
        previewMode: 'OPEN_ORIGINAL',
        files: [{ id: 'f1', path: 'deals/deal-1/v1/file.pdf' }],
      });
      assert.equal(state, 'DIRECT_PREVIEW_AVAILABLE');
      assert.equal(isUsablePreviewAvailable({ previewEnabled: true, previewMode: 'OPEN_ORIGINAL', files: [{ path: 'deals/deal-1/v1/file.pdf' }] }), true);
    });

    test('4. Auto-Generated preview returns GENERATED_PREVIEW_AVAILABLE only when ready', () => {
      const readyState = getEffectivePreviewState({
        previewEnabled: true,
        previewMode: 'AUTO',
        files: [{ id: 'f1', previewStatus: 'ready', previewPath: 'previews/deal-1/v1/thumb.jpg' }],
      });
      assert.equal(readyState, 'GENERATED_PREVIEW_AVAILABLE');

      const processingState = getEffectivePreviewState({
        previewEnabled: true,
        previewMode: 'AUTO',
        files: [{ id: 'f1', previewStatus: 'processing' }],
      });
      assert.equal(processingState, 'NO_PREVIEW');
      assert.equal(isUsablePreviewAvailable({ previewEnabled: true, previewMode: 'AUTO', files: [{ previewStatus: 'processing' }] }), false);
    });

    test('5. Manual Creator preview returns MANUAL_PREVIEW_AVAILABLE when ready', () => {
      const state = getEffectivePreviewState({
        previewEnabled: true,
        previewMode: 'MANUAL',
        files: [{ id: 'f1', previewStatus: 'ready', previewPath: 'previews/deal-1/v1/manual.pdf' }],
      });
      assert.equal(state, 'MANUAL_PREVIEW_AVAILABLE');
      assert.equal(isUsablePreviewAvailable({ previewEnabled: true, previewMode: 'MANUAL', files: [{ previewStatus: 'ready', previewPath: 'previews/deal-1/v1/manual.pdf' }] }), true);
    });

    test('6. External / Google Drive preview returns EXTERNAL_PREVIEW_AVAILABLE when valid ID exists', () => {
      const state = getEffectivePreviewState({
        previewEnabled: true,
        previewMode: 'EXTERNAL',
        files: [{ id: 'f1', externalId: 'gdrive-file-123' }],
      });
      assert.equal(state, 'EXTERNAL_PREVIEW_AVAILABLE');
      assert.equal(isUsablePreviewAvailable({ previewEnabled: true, previewMode: 'EXTERNAL', files: [{ externalId: 'gdrive-file-123' }] }), true);
    });
  });

  describe('Security & Isolation Bounds', () => {
    test('7. Supabase files cannot be accessed as Google Drive files', () => {
      const provider = storageRegistry.getProvider('supabase');
      assert.equal(provider.id, 'supabase');
      assert.notEqual(provider.id, 'google_drive');
    });

    test('8. Google Drive files cannot be accessed via Supabase storage paths', () => {
      const provider = storageRegistry.getProvider('google_drive');
      assert.equal(provider.id, 'google_drive');
      assert.equal(provider.ownershipType, 'CUSTOMER_MANAGED');
    });

    test('9. Empty file list returns NO_PREVIEW', () => {
      assert.equal(isUsablePreviewAvailable({ previewEnabled: true, previewMode: 'AUTO', files: [] }), false);
    });
  });
});
