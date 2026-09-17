import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { encryptCredential, decryptCredential } from '../lib/utils/encryption';
import { storageRegistry } from '../lib/storage/registry';
import { GoogleDriveProvider } from '../lib/storage/providers/google-drive-provider';

describe('OAuth Encryption', () => {
  const encryptionKey = crypto.randomBytes(32).toString('base64');
  
  test('encrypts and decrypts a credential successfully', () => {
    const plaintext = 'secret_access_token_123';
    const encrypted = encryptCredential(plaintext, encryptionKey);
    
    assert.notEqual(plaintext, encrypted);
    assert.ok(encrypted.includes(':'), 'Encrypted credential must contain parts separated by colon');
    
    const decrypted = decryptCredential(encrypted, encryptionKey);
    assert.equal(decrypted, plaintext);
  });

  test('throws on invalid key length', () => {
    const badKey = crypto.randomBytes(16).toString('base64');
    assert.throws(() => encryptCredential('test', badKey), /32 bytes/);
    assert.throws(() => decryptCredential('test:test:test', badKey), /32 bytes/);
  });

  test('throws on malformed ciphertext', () => {
    assert.throws(() => decryptCredential('invalid_format', encryptionKey), /format/);
  });
});

describe('Google Drive Provider Registration', () => {
  test('registry contains google_drive provider with CUSTOMER_MANAGED ownership', () => {
    // Note: If tests run in isolation and registry.ts doesn't import it dynamically,
    // we just ensure it's registered by registry.ts export side effect.
    // Ensure we trigger the registry module logic
    const provider = storageRegistry.getProvider('google_drive');
    
    assert.ok(provider);
    assert.equal(provider.id, 'google_drive');
    assert.equal(provider.ownershipType, 'CUSTOMER_MANAGED');
    assert.equal(provider.capabilities.supportsOAuth, true);
  });
});
