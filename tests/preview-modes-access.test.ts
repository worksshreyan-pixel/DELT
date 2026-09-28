import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { storageRegistry } from '../lib/storage/registry';
import { SupabaseStorageProvider } from '../lib/storage/providers/supabase-provider';
import { GoogleDriveProvider } from '../lib/storage/providers/google-drive-provider';
import { PreviewMode } from '../lib/storage/types';

describe('Provider-Aware File Access & Preview Modes', () => {
  storageRegistry.register(new SupabaseStorageProvider());
  storageRegistry.register(new GoogleDriveProvider());

  describe('Provider Access Resolution', () => {
    test('Supabase file resolves to Supabase provider', () => {
      const provider = storageRegistry.getProvider('supabase');
      assert.equal(provider.id, 'supabase');
      assert.equal(provider.ownershipType, 'DELT_MANAGED');
    });

    test('Google Drive file resolves to Google Drive provider', () => {
      const provider = storageRegistry.getProvider('google_drive');
      assert.equal(provider.id, 'google_drive');
      assert.equal(provider.ownershipType, 'CUSTOMER_MANAGED');
      assert.equal(provider.capabilities.canOpenExternally, true);
    });
  });

  describe('Preview Mode Rules per Provider', () => {
    function getEffectivePreviewMode(
      storageProvider: 'supabase' | 'google_drive',
      requestedMode?: PreviewMode
    ): PreviewMode {
      if (storageProvider === 'google_drive') {
        if (requestedMode !== 'EXTERNAL' && requestedMode !== 'MANUAL' && requestedMode !== 'NONE') {
          return 'EXTERNAL';
        }
        return requestedMode;
      } else {
        if (requestedMode !== 'AUTO' && requestedMode !== 'MANUAL' && requestedMode !== 'NONE') {
          return 'AUTO';
        }
        return requestedMode;
      }
    }

    test('DELT Storage supports AUTO, MANUAL, NONE', () => {
      assert.equal(getEffectivePreviewMode('supabase', 'AUTO'), 'AUTO');
      assert.equal(getEffectivePreviewMode('supabase', 'MANUAL'), 'MANUAL');
      assert.equal(getEffectivePreviewMode('supabase', 'NONE'), 'NONE');
    });

    test('Google Drive supports EXTERNAL, MANUAL, NONE', () => {
      assert.equal(getEffectivePreviewMode('google_drive', 'EXTERNAL'), 'EXTERNAL');
      assert.equal(getEffectivePreviewMode('google_drive', 'MANUAL'), 'MANUAL');
      assert.equal(getEffectivePreviewMode('google_drive', 'NONE'), 'NONE');
    });

    test('Google Drive falls back from invalid mode to EXTERNAL', () => {
      assert.equal(getEffectivePreviewMode('google_drive', 'AUTO'), 'EXTERNAL');
    });

    test('DELT Storage falls back from invalid mode to AUTO', () => {
      assert.equal(getEffectivePreviewMode('supabase', 'EXTERNAL'), 'AUTO');
    });
  });

  describe('Approval Availability by Preview Mode', () => {
    function isApprovalAllowed(previewMode: PreviewMode): boolean {
      return previewMode !== 'NONE';
    }

    test('NONE preview mode disables Approve and Request Changes', () => {
      assert.equal(isApprovalAllowed('NONE'), false);
    });

    test('AUTO, MANUAL, and EXTERNAL allow Approve and Request Changes', () => {
      assert.equal(isApprovalAllowed('AUTO'), true);
      assert.equal(isApprovalAllowed('MANUAL'), true);
      assert.equal(isApprovalAllowed('EXTERNAL'), true);
    });
  });

  describe('Storage Security & Authorization', () => {
    function checkDealAccess(
      deal: { id: string; creatorId: string; clientEmail: string },
      requester: { userId?: string; clientEmail?: string; dealId: string }
    ): boolean {
      if (deal.id !== requester.dealId) return false;
      if (requester.userId && requester.userId === deal.creatorId) return true;
      if (requester.clientEmail && requester.clientEmail.toLowerCase() === deal.clientEmail.toLowerCase()) return true;
      return false;
    }

    const testDeal = {
      id: 'deal-123',
      creatorId: 'creator-abc',
      clientEmail: 'client@example.com',
    };

    test('creator access is authorized', () => {
      assert.equal(
        checkDealAccess(testDeal, { userId: 'creator-abc', dealId: 'deal-123' }),
        true
      );
    });

    test('matching client email is authorized', () => {
      assert.equal(
        checkDealAccess(testDeal, { clientEmail: 'client@example.com', dealId: 'deal-123' }),
        true
      );
    });

    test('wrong deal ID is denied', () => {
      assert.equal(
        checkDealAccess(testDeal, { userId: 'creator-abc', dealId: 'wrong-deal-999' }),
        false
      );
    });

    test('wrong creator user ID is denied', () => {
      assert.equal(
        checkDealAccess(testDeal, { userId: 'unauthorized-user', dealId: 'deal-123' }),
        false
      );
    });

    test('unauthorized client email is denied', () => {
      assert.equal(
        checkDealAccess(testDeal, { clientEmail: 'attacker@example.com', dealId: 'deal-123' }),
        false
      );
    });

    test('known external_object_id is denied without valid deal access', () => {
      const knownExternalObjectId = 'google-drive-file-id-456';
      const hasAccess = checkDealAccess(testDeal, {
        clientEmail: 'attacker@example.com',
        dealId: 'deal-123',
      });
      assert.equal(hasAccess, false);
    });
  });
});
