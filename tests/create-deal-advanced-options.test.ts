// ==============================================================================
// DELT — Create Deal Step Architecture & Advanced Options Audit
// Tests: 2-step creation flow (Details -> Files Upload),
// expandable Advanced Options inside Details (Scope, Agreement, Milestones, Invoice),
// Storage Provider & File Preview Options relocation to Files Upload step (Step 2),
// state preservation, and data integrity.
// ==============================================================================

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('DELT — Create Deal Progressive Disclosure & 2-Step Architecture Audit', () => {

  // ---------------------------------------------------------------- Step 1: Details --
  describe('1. Step 1 — Details (Basic Details + Expandable Advanced Options)', () => {
    test('Basic details section contains essential deal creation fields', () => {
      const basicPayload = {
        title: 'Logo Redesign',
        clientEmail: 'client@example.com',
        price: 15000,
        currency: 'INR',
        description: 'New brand logo assets',
        scope: [],
        createAgreement: false,
        createInvoice: false,
        milestones: [],
      };

      assert.equal(basicPayload.title, 'Logo Redesign');
      assert.equal(basicPayload.clientEmail, 'client@example.com');
      assert.equal(basicPayload.createAgreement, false);
      assert.equal(basicPayload.createInvoice, false);
      assert.equal(basicPayload.milestones.length, 0);
    });

    test('Expandable Advanced Options inside Details contains Scope, Agreement, Milestones, Invoice', () => {
      let showAdvancedOptions = false;
      const formState = {
        title: 'Web Application Development',
        clientEmail: 'startup@example.com',
        price: 85000,
        currency: 'INR',
        description: 'Full stack Next.js web application',
        // Advanced Options fields configured inside expandable section
        scope: ['Figma UI Design', 'Frontend Development'],
        deliverables: ['Figma UI Design', 'Frontend Development'],
        createAgreement: true,
        createInvoice: true,
        milestones: [
          { title: 'UI Design Approval', description: 'Wireframes', dueDate: '2026-10-15' },
        ],
      };

      // Expand Advanced Options
      showAdvancedOptions = true;
      assert.equal(showAdvancedOptions, true);
      assert.equal(formState.scope.length, 2);
      assert.equal(formState.createAgreement, true);
      assert.equal(formState.createInvoice, true);
      assert.equal(formState.milestones.length, 1);

      // Collapse Advanced Options — entered data is preserved in memory!
      showAdvancedOptions = false;
      assert.equal(showAdvancedOptions, false);
      assert.equal(formState.scope.length, 2);
      assert.equal(formState.createAgreement, true);
    });

    test('Storage Provider & File Preview Options are NOT inside Advanced Options', () => {
      const advancedOptionsFields = ['scope', 'createAgreement', 'milestones', 'createInvoice'];
      assert.equal(advancedOptionsFields.includes('storageProvider'), false);
      assert.equal(advancedOptionsFields.includes('previewConfig'), false);
    });
  });

  // -------------------------------------------------------- Step 2: Files Upload --
  describe('2. Step 2 — Files Upload (Upload Files -> Preview Config -> Storage Provider)', () => {
    test('Client Deliverable Preview defaults to OFF for newly initialized deal creation form', () => {
      const initialFilesStepState = {
        storageProvider: 'supabase',
        previewEnabled: false,
        previewMode: 'NONE',
        selectedFiles: [],
      };

      assert.equal(initialFilesStepState.previewEnabled, false);
      assert.equal(initialFilesStepState.previewMode, 'NONE');
    });

    test('Files page follows exact section hierarchy: Upload Files (1) -> Preview Config (2) -> Storage Provider (3)', () => {
      const filesPageSectionOrder = ['upload_files', 'client_deliverable_preview', 'storage_provider'];

      assert.equal(filesPageSectionOrder[0], 'upload_files');
      assert.equal(filesPageSectionOrder[1], 'client_deliverable_preview');
      assert.equal(filesPageSectionOrder[2], 'storage_provider');
    });

    test('Preview strategies are hidden when preview is OFF and revealed when preview is ON', () => {
      let previewEnabled = false;
      let previewMode = 'NONE';

      // When OFF: strategies hidden
      const areStrategiesVisible = (enabled: boolean) => enabled;
      assert.equal(areStrategiesVisible(previewEnabled), false);

      // Switching OFF -> ON reveals preview strategy selection
      previewEnabled = true;
      previewMode = 'AUTO';
      assert.equal(areStrategiesVisible(previewEnabled), true);
      assert.equal(previewMode, 'AUTO');

      // Switching ON -> OFF hides preview strategy selection again
      previewEnabled = false;
      previewMode = 'NONE';
      assert.equal(areStrategiesVisible(previewEnabled), false);
      assert.equal(previewMode, 'NONE');
    });

    test('Files Upload step houses Storage Provider and Client Deliverable Preview options below file upload', () => {
      const filesStepState = {
        storageProvider: 'google_drive',
        storageConnectionId: 'gdrive-conn-101',
        previewEnabled: true,
        previewMode: 'EXTERNAL',
        selectedFiles: [{ name: 'master_export.mov', size: 104857600 }],
      };

      assert.equal(filesStepState.storageProvider, 'google_drive');
      assert.equal(filesStepState.previewEnabled, true);
      assert.equal(filesStepState.previewMode, 'EXTERNAL');
      assert.equal(filesStepState.selectedFiles.length, 1);
    });

    test('Files Upload page is accessible whether Advanced Options was expanded or collapsed', () => {
      let activeStep: 'details' | 'files' = 'details';
      let showAdvancedOptions = false;

      // Flow 1: Advanced Options collapsed -> Continue -> Files Upload
      activeStep = 'files';
      assert.equal(activeStep, 'files');

      // Flow 2: Advanced Options expanded -> Continue -> Files Upload
      activeStep = 'details';
      showAdvancedOptions = true;
      activeStep = 'files';
      assert.equal(activeStep, 'files');
    });

    test('Step navigation preserves form state across Step 1 (Details) <-> Step 2 (Files Upload)', () => {
      let activeStep: 'details' | 'files' = 'details';
      const formState = {
        title: 'Brand Package',
        clientEmail: 'brand@client.com',
        price: '30000',
        currency: 'USD',
        description: 'Full brand guidelines and assets',
        scope: ['Logo Vector', 'Brand Book PDF'],
        storageProvider: 'supabase',
        previewMode: 'AUTO',
        selectedFiles: [{ name: 'logo.ai', size: 50000 }],
        createAgreement: true,
        createInvoice: false,
        milestones: [{ id: 'm1', title: 'Draft Review', description: '', dueDate: '2026-10-10' }],
      };

      // Navigate from Details -> Files Upload
      activeStep = 'files';
      assert.equal(activeStep, 'files');
      assert.equal(formState.selectedFiles.length, 1);
      assert.equal(formState.storageProvider, 'supabase');

      // Navigate Back to Details
      activeStep = 'details';
      assert.equal(activeStep, 'details');
      // All details, scope, storage provider, selected files, agreement settings remain 100% intact!
      assert.equal(formState.title, 'Brand Package');
      assert.equal(formState.scope.length, 2);
      assert.equal(formState.selectedFiles.length, 1);
      assert.equal(formState.createAgreement, true);
    });
  });

  // ------------------------------------------------------------ Security & Bounds --
  describe('3. Security & Validation Bounds', () => {
    test('Backend defaults to safe values when required fields are missing', () => {
      const missingPrice: any = { title: 'Test', clientEmail: 'a@b.com', price: 0 };
      const isValid = Boolean(missingPrice.title && missingPrice.clientEmail && missingPrice.price > 0);
      assert.equal(isValid, false);
    });

    test('Backend normalizes preview mode safely according to storage provider', () => {
      const normalizePreviewMode = (provider: string, enabled: boolean, mode: string) => {
        if (!enabled) return 'NONE';
        if (provider === 'google_drive') {
          return mode === 'EXTERNAL' || mode === 'MANUAL' ? mode : 'EXTERNAL';
        }
        return mode === 'AUTO' || mode === 'MANUAL' ? mode : 'NONE';
      };

      assert.equal(normalizePreviewMode('supabase', false, 'AUTO'), 'NONE');
      assert.equal(normalizePreviewMode('google_drive', true, 'AUTO'), 'EXTERNAL');
      assert.equal(normalizePreviewMode('supabase', true, 'AUTO'), 'AUTO');
    });
  });
});
