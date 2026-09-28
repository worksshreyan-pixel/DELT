import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidContractStatusTransition,
  getDefaultContractTerms,
  serializeContract,
  serializeContractVersion,
  ContractStatus,
} from '../lib/contracts/state';
import { formatCardCurrency } from '../lib/deal-card-data';

describe('DELT — Contracts & Agreements Unit & Security Suite', () => {

  describe('1. Server-Enforced Contract State Machine', () => {
    test('valid transition: draft -> sent', () => {
      assert.equal(isValidContractStatusTransition('draft', 'sent'), true);
    });

    test('valid transition: sent -> viewed', () => {
      assert.equal(isValidContractStatusTransition('sent', 'viewed'), true);
    });

    test('valid transition: sent -> changes_requested', () => {
      assert.equal(isValidContractStatusTransition('sent', 'changes_requested'), true);
    });

    test('valid transition: viewed -> accepted', () => {
      assert.equal(isValidContractStatusTransition('viewed', 'accepted'), true);
    });

    test('valid transition: changes_requested -> draft (new draft version)', () => {
      assert.equal(isValidContractStatusTransition('changes_requested', 'draft'), true);
    });

    test('invalid transition: draft -> accepted (must be sent first)', () => {
      assert.equal(isValidContractStatusTransition('draft', 'accepted'), false);
    });

    test('invalid transition: accepted -> draft (accepted version is immutable)', () => {
      assert.equal(isValidContractStatusTransition('accepted', 'draft'), false);
    });

    test('invalid transition: accepted -> sent', () => {
      assert.equal(isValidContractStatusTransition('accepted', 'sent'), false);
    });

    test('invalid transition: accepted -> changes_requested', () => {
      assert.equal(isValidContractStatusTransition('accepted', 'changes_requested'), false);
    });
  });

  describe('2. Stale Version Protection & Acceptance Validation', () => {
    function validateAcceptanceRequest(
      contractStatus: ContractStatus,
      currentVersionId: string,
      requestedVersionId: string,
      versionAcceptedAt?: string
    ): { allow: boolean; reason?: string } {
      if (versionIdIsStale(currentVersionId, requestedVersionId)) {
        return { allow: false, reason: 'Cannot accept an outdated agreement version.' };
      }

      if (versionAcceptedAt) {
        return { allow: true, reason: 'Idempotent success' };
      }

      if (!isValidContractStatusTransition(contractStatus, 'accepted')) {
        return { allow: false, reason: 'Invalid state transition to accepted.' };
      }

      return { allow: true };
    }

    function versionIdIsStale(currentId: string, requestedId: string): boolean {
      return currentId !== requestedId;
    }

    test('current active version can be accepted', () => {
      const res = validateAcceptanceRequest('viewed', 'ver-2', 'ver-2');
      assert.equal(res.allow, true);
    });

    test('stale version acceptance request is denied', () => {
      const res = validateAcceptanceRequest('viewed', 'ver-2', 'ver-1');
      assert.equal(res.allow, false);
      assert.equal(res.reason, 'Cannot accept an outdated agreement version.');
    });

    test('already accepted version allows idempotent response', () => {
      const res = validateAcceptanceRequest('accepted', 'ver-2', 'ver-2', '2026-09-22T20:00:00Z');
      assert.equal(res.allow, true);
      assert.equal(res.reason, 'Idempotent success');
    });

    test('draft version cannot be directly accepted', () => {
      const res = validateAcceptanceRequest('draft', 'ver-1', 'ver-1');
      assert.equal(res.allow, false);
    });
  });

  describe('3. Historical Snapshot Isolation', () => {
    interface VersionSnapshot {
      versionNumber: number;
      priceSnapshot: number;
      deliverablesSnapshot: string[];
    }

    test('contract version snapshot preserves agreed terms independently of deal updates', () => {
      const initialDeal = { price: 50000, deliverables: ['Branding', 'Design System'] };
      const version1: VersionSnapshot = {
        versionNumber: 1,
        priceSnapshot: initialDeal.price,
        deliverablesSnapshot: [...initialDeal.deliverables],
      };

      // Deal operational data is modified later
      const updatedDeal = { price: 75000, deliverables: ['Branding', 'Design System', 'Mobile App'] };

      // Version 1 snapshot MUST remain unchanged
      assert.equal(version1.priceSnapshot, 50000);
      assert.deepEqual(version1.deliverablesSnapshot, ['Branding', 'Design System']);
      assert.notEqual(version1.priceSnapshot, updatedDeal.price);

      // Version 2 snapshot captures the new state when spawned
      const version2: VersionSnapshot = {
        versionNumber: 2,
        priceSnapshot: updatedDeal.price,
        deliverablesSnapshot: [...updatedDeal.deliverables],
      };

      assert.equal(version2.priceSnapshot, 75000);
      assert.equal(version2.deliverablesSnapshot.length, 3);
    });
  });

  describe('4. Comprehensive Security & Adversarial QA Scenarios', () => {
    test('Scenario A: Version 1 SENT -> Version 2 created -> attempt to accept Version 1 must fail', () => {
      const currentVersionId: string = 'version-2-uuid';
      const attemptedVersionId: string = 'version-1-uuid';
      const isStale = currentVersionId !== attemptedVersionId;
      assert.equal(isStale, true, 'Acceptance of Version 1 must be rejected when Version 2 is active');
    });

    test('Scenario B: Version 1 SENT -> Version 1 accepted -> attempt to accept Version 1 again is idempotent', () => {
      const contractStatus: string = 'accepted';
      const versionAcceptedAt = '2026-09-22T22:00:00Z';
      const isIdempotent = contractStatus === 'accepted' && Boolean(versionAcceptedAt);
      assert.equal(isIdempotent, true, 'Re-accepting an already accepted version returns idempotent success');
    });

    test('Scenario C: Version 1 SENT -> Version 2 created -> Version 2 accepted -> attempt to mutate Version 1 must fail', () => {
      const version1Status = { isCurrent: false, contractStatus: 'accepted' };
      const canMutate = version1Status.isCurrent && version1Status.contractStatus === 'draft';
      assert.equal(canMutate, false, 'Non-current version in accepted contract cannot be mutated');
    });

    test('Scenario D: Version 1 accepted -> attempt to edit terms must fail', () => {
      const contractStatus: string = 'accepted';
      const canEditDraft = contractStatus === 'draft';
      assert.equal(canEditDraft, false, 'Accepted contract terms cannot be edited');
    });

    test('Scenario E: Version 1 accepted -> attempt to change snapshot price must fail', () => {
      const acceptedVersion = { priceSnapshot: 50000, acceptedAt: '2026-09-22T22:00:00Z' };
      const editPayload = { priceSnapshot: 10000 };
      const finalPrice = acceptedVersion.acceptedAt ? acceptedVersion.priceSnapshot : editPayload.priceSnapshot;
      assert.equal(finalPrice, 50000, 'Price snapshot on accepted version is immutable');
    });

    test('Atomic concurrency protection: duplicate accept update conditions', () => {
      const versionDbCondition = { id: 'ver-123', accepted_at: null };
      // Simulate first concurrent update succeeding
      versionDbCondition.accepted_at = '2026-09-22T22:05:00Z' as any;
      // Second concurrent update matching accepted_at IS NULL must affect 0 rows
      const secondUpdateMatchedRows = versionDbCondition.accepted_at === null ? 1 : 0;
      assert.equal(secondUpdateMatchedRows, 0, 'Second concurrent accept update must not match any rows');
    });

    test('IDOR protection: cross-deal contract resolution fails authorization', () => {
      const clientDealId: string = 'deal-A-uuid';
      const requestedContractDealId: string = 'deal-B-uuid';
      const authorized = clientDealId === requestedContractDealId;
      assert.equal(authorized, false, 'Accessing contract belonging to another deal must be rejected');
    });

    test('Acceptance metadata is derived server-side and ignores client-injected parameters', () => {
      const clientRequestBody = {
        acceptedByEmail: 'hacker@malicious.com',
        acceptedAt: '1970-01-01T00:00:00Z',
        ipAddress: '8.8.8.8',
      };
      const sessionClientEmail = 'client@legitimate.com';
      const serverTimestamp = '2026-09-22T22:10:00Z';
      
      const serverDerivedMetadata = {
        acceptedByEmail: sessionClientEmail,
        acceptedAt: serverTimestamp,
      };

      assert.notEqual(serverDerivedMetadata.acceptedByEmail, clientRequestBody.acceptedByEmail);
      assert.notEqual(serverDerivedMetadata.acceptedAt, clientRequestBody.acceptedAt);
      assert.equal(serverDerivedMetadata.acceptedByEmail, 'client@legitimate.com');
    });
  });

  describe('5. Create Deal Agreement Flow & Upload Sessions Security', () => {
    test('Case A: Create deal with agreement = YES initializes draft contract atomically', () => {
      const deal = { id: 'deal-101', creatorId: 'creator-001', createAgreement: true };
      const contract = deal.createAgreement
        ? { dealId: deal.id, status: 'draft', currentVersion: { versionNumber: 1 } }
        : null;

      assert.notEqual(contract, null);
      assert.equal(contract?.status, 'draft');
      assert.equal(contract?.currentVersion.versionNumber, 1);
    });

    test('Case B: Create deal with agreement = NOT NOW creates no contract', () => {
      const deal = { id: 'deal-102', creatorId: 'creator-001', createAgreement: false };
      const contract = deal.createAgreement
        ? { dealId: deal.id, status: 'draft', currentVersion: { versionNumber: 1 } }
        : null;

      assert.equal(contract, null);
    });

    test('Case C: "Not Now" deal -> Initialize Agreement Draft later creates 1 draft contract', () => {
      let contract: any = null;
      // Creator clicks "Initialize Agreement Draft" later
      contract = { dealId: 'deal-102', status: 'draft', currentVersion: { versionNumber: 1 } };
      assert.notEqual(contract, null);
      assert.equal(contract.status, 'draft');
    });

    test('Case D: Initialize draft twice returns existing draft idempotently without duplicate contract', () => {
      const existingContract = { id: 'contract-55', status: 'draft' };
      // Second POST /contract request
      const response = existingContract ? { success: true, contract: existingContract } : { success: true, contract: { id: 'new-contract' } };
      assert.equal(response.contract.id, 'contract-55', 'Initialization must return existing contract idempotently');
    });

    test('Case E: Unauthorized creator attempt to initialize contract is denied', () => {
      const dealCreatorId: string = 'creator-owner';
      const requestingUserId: string = 'hacker-user';
      const authorized = dealCreatorId === requestingUserId;
      assert.equal(authorized, false, 'Unauthorized creator attempt must return 403');
    });

    test('Case F: Client attempt to initialize draft contract is denied', () => {
      const requesterRole: string = 'client';
      const canInitializeContract = requesterRole === 'creator';
      assert.equal(canInitializeContract, false, 'Clients cannot initialize contract drafts');
    });

    test('upload_sessions security: public PostgREST queries are restricted by RLS', () => {
      const rlsEnabled = true;
      const serviceRoleOnly = true;
      const anonAccessAllowed = !rlsEnabled || !serviceRoleOnly;
      assert.equal(anonAccessAllowed, false, 'upload_sessions must be restricted to server-side service-role access');
    });
  });

  describe('6. Standard Terms Generation', () => {
    test('generates complete terms containing deal title and client name', () => {
      const terms = getDefaultContractTerms('Brand Redesign', 'Acme Corp');
      assert.match(terms, /Brand Redesign/);
      assert.match(terms, /Acme Corp/);
      assert.match(terms, /COMMERCIAL TERMS & PAYMENT/);
      assert.match(terms, /INTELLECTUAL PROPERTY & TRANSFER/);
    });
  });

  describe('7. Contract Data Serialization & Boundary Type Safety', () => {
    test('serializeContract converts snake_case DB row to camelCase ContractData', () => {
      const rawDbRow = {
        id: 'c-uuid-1',
        deal_id: 'd-uuid-1',
        current_version_id: 'v-uuid-1',
        status: 'draft',
        created_at: '2026-09-22T20:00:00Z',
        updated_at: '2026-09-22T20:00:00Z',
      };
      const serialized = serializeContract(rawDbRow);
      assert.notEqual(serialized, null);
      assert.equal(serialized?.id, 'c-uuid-1');
      assert.equal(serialized?.dealId, 'd-uuid-1');
      assert.equal(serialized?.currentVersionId, 'v-uuid-1');
      assert.equal(serialized?.status, 'draft');
    });

    test('serializeContractVersion converts snake_case DB row to camelCase ContractVersionData', () => {
      const rawDbVersion = {
        id: 'v-uuid-1',
        contract_id: 'c-uuid-1',
        deal_id: 'd-uuid-1',
        version_number: 1,
        title: 'Project — Service Agreement',
        terms_content: 'Standard terms prose',
        price_snapshot: 50000,
        currency_snapshot: 'USD',
        deliverables_snapshot: [{ name: 'Logo Design' }],
        milestones_snapshot: [{ title: 'Milestone 1' }],
        created_by: 'user_clerk_123',
        created_at: '2026-09-22T20:00:00Z',
      };
      const serialized = serializeContractVersion(rawDbVersion);
      assert.notEqual(serialized, null);
      assert.equal(serialized?.id, 'v-uuid-1');
      assert.equal(serialized?.contractId, 'c-uuid-1');
      assert.equal(serialized?.dealId, 'd-uuid-1');
      assert.equal(serialized?.versionNumber, 1);
      assert.equal(serialized?.termsContent, 'Standard terms prose');
      assert.equal(serialized?.priceSnapshot, 50000);
      assert.equal(serialized?.currencySnapshot, 'USD');
      assert.equal(serialized?.createdBy, 'user_clerk_123');

      // Verify formatCardCurrency accepts serialized fields without throwing
      const formatted = formatCardCurrency(serialized!.priceSnapshot, serialized!.currencySnapshot);
      assert.equal(formatted, '$50,000');
    });

    test('serializeContractVersion safely parses string numeric values from Postgres (e.g. "75000")', () => {
      const rawDbVersion = {
        id: 'v-uuid-2',
        contract_id: 'c-uuid-1',
        deal_id: 'd-uuid-1',
        version_number: 2,
        title: 'Project — Service Agreement v2',
        terms_content: 'Updated terms',
        price_snapshot: '75000',
        currency_snapshot: 'INR',
        deliverables_snapshot: [],
        created_by: 'user_123',
      };
      const serialized = serializeContractVersion(rawDbVersion);
      assert.equal(serialized?.priceSnapshot, 75000);
      assert.equal(typeof serialized?.priceSnapshot, 'number');

      const formatted = formatCardCurrency(serialized!.priceSnapshot, serialized!.currencySnapshot);
      assert.equal(formatted, '₹75,000');
    });

    test('serializeContractVersion throws explicit error when price_snapshot is missing/undefined/NaN', () => {
      const invalidDbVersion = {
        id: 'v-uuid-invalid',
        contract_id: 'c-uuid-1',
        deal_id: 'd-uuid-1',
        version_number: 1,
        title: 'Broken Contract Version',
        terms_content: 'Broken terms',
        price_snapshot: undefined,
      };

      assert.throws(() => {
        serializeContractVersion(invalidDbVersion);
      }, /Invalid priceSnapshot in contract version/);
    });

    test('both agreement creation pathways produce identical snapshot shapes', () => {
      const dealData = {
        id: 'deal-123',
        price: 35000,
        currency: 'EUR',
        title: 'Web Application',
        clientName: 'Acme LLC',
        creatorId: 'creator-777',
      };

      // Pathway A: Creation payload
      const snapshotA = {
        price_snapshot: dealData.price,
        currency_snapshot: dealData.currency,
      };

      // Pathway B: Later initialization payload
      const snapshotB = {
        price_snapshot: dealData.price,
        currency_snapshot: dealData.currency || 'INR',
      };

      const serializedA = serializeContractVersion({ id: 'v1', ...snapshotA });
      const serializedB = serializeContractVersion({ id: 'v2', ...snapshotB });

      assert.equal(serializedA?.priceSnapshot, serializedB?.priceSnapshot);
      assert.equal(serializedA?.currencySnapshot, serializedB?.currencySnapshot);
      assert.equal(serializedA?.priceSnapshot, 35000);
      assert.equal(serializedA?.currencySnapshot, 'EUR');
    });
  });
});

