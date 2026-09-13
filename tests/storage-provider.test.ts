import { storageRegistry } from '../lib/storage/registry';
import { SupabaseStorageProvider } from '../lib/storage/providers/supabase-provider';
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

describe('Storage Provider Abstraction', () => {
  before(() => {
    storageRegistry.register(new SupabaseStorageProvider());
  });

  test('Registry resolves Supabase provider', () => {
    const provider = storageRegistry.getProvider('supabase');
    assert.ok(provider !== undefined, 'Provider should be defined');
    assert.equal(provider.id, 'supabase');
    assert.equal(provider.ownershipType, 'DELT_MANAGED');
  });

  test('Registry throws on unknown provider', () => {
    assert.throws(
      () => storageRegistry.getProvider('google_drive'),
      /not registered/
    );
  });

  test('Supabase provider capabilities', () => {
    const provider = storageRegistry.getProvider('supabase');
    assert.equal(provider.capabilities.canUpload, true);
    assert.equal(provider.capabilities.canDownload, true);
    assert.equal(provider.capabilities.canDelete, true);
    assert.equal(provider.capabilities.supportsOAuth, false);
  });
});

