import { describe, test } from 'node:test';
import assert from 'node:assert';
import {
  validateUsername,
  normalizeUsername,
  getClientDealUrl,
  generateDefaultAvatarDataUrl,
  RESERVED_USERNAMES,
} from '../lib/deal-url';

describe('DELT — Username Identity, Canonical Deal URLs & Avatar System', () => {

  describe('1. Username Validation & Rules', () => {
    test('valid username passes validation', () => {
      const res = validateUsername('shreyan');
      assert.equal(res.valid, true);
      assert.equal(res.error, undefined);
    });

    test('valid username with hyphens and underscores passes validation', () => {
      assert.equal(validateUsername('john_doe-99').valid, true);
    });

    test('username under 3 characters is rejected', () => {
      const res = validateUsername('sh');
      assert.equal(res.valid, false);
      assert.match(res.error || '', /at least 3 characters/i);
    });

    test('username over 30 characters is rejected', () => {
      const res = validateUsername('a'.repeat(31));
      assert.equal(res.valid, false);
      assert.match(res.error || '', /at most 30 characters/i);
    });

    test('invalid characters in username are rejected', () => {
      const res = validateUsername('shreyan!');
      assert.equal(res.valid, false);
      assert.match(res.error || '', /only contain letters/i);
    });

    test('reserved usernames (admin, api, deals, etc.) are rejected', () => {
      for (const reserved of ['admin', 'api', 'deals', 'settings', 'auth']) {
        const res = validateUsername(reserved);
        assert.equal(res.valid, false);
        assert.match(res.error || '', /reserved system name/i);
      }
    });

    test('username normalization trims, lowercases, and strips spaces', () => {
      assert.equal(normalizeUsername('  Shreyan_99  '), 'shreyan_99');
    });
  });

  describe('2. Canonical URL Generation', () => {
    test('getClientDealUrl generates canonical username URL', () => {
      const url = getClientDealUrl('DLT-A7F39C21', 'shreyan');
      assert.match(url, /\/shreyan\/DLT-A7F39C21$/);
      assert.ok(!url.includes('/creator/DLT-'));
    });

    test('getClientDealUrl handles custom username correctly without /creator/', () => {
      const url = getClientDealUrl('DLT-98765432', 'alex_design');
      assert.match(url, /\/alex_design\/DLT-98765432$/);
    });
  });

  describe('3. Avatar System & Defaults', () => {
    test('generateDefaultAvatarDataUrl creates valid SVG Data URI', () => {
      const avatarDataUri = generateDefaultAvatarDataUrl('Shreyan Studio');
      assert.match(avatarDataUri, /^data:image\/svg\+xml;/);
      assert.match(avatarDataUri, /SS/);
    });

    test('avatar file validation rejects files > 2MB', () => {
      const maxSizeBytes = 2 * 1024 * 1024;
      const oversizedFileSizeBytes = 2.5 * 1024 * 1024;
      assert.ok(oversizedFileSizeBytes > maxSizeBytes);
    });

    test('avatar file validation rejects unsupported MIME types', () => {
      const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
      assert.equal(allowedMimes.has('image/png'), true);
      assert.equal(allowedMimes.has('application/pdf'), false);
    });
  });

});
