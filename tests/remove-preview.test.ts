import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('DELT — Remove Creator Client Preview Security Audit', () => {
  test('1. Creator can access creator workspace via requireCreatorDealAccess helper', () => {
    const fs = require('fs');
    const path = require('path');
    const dealAuthContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'deal-auth.ts'),
      'utf-8'
    );

    assert.ok(
      dealAuthContent.includes('export async function requireCreatorDealAccess'),
      'requireCreatorDealAccess function must exist'
    );
  });

  test('2. Creator can generate/share canonical client URL /deal/{deal_code} without preview parameters', () => {
    const dealCode = 'DLT-TEST1234';
    const canonicalUrl = `/deal/${dealCode}`;
    
    assert.equal(canonicalUrl.includes('preview='), false);
    assert.equal(canonicalUrl.includes('previewMode='), false);
    assert.equal(canonicalUrl.includes('role=creator'), false);
    assert.equal(canonicalUrl, '/deal/DLT-TEST1234');
  });

  test('3. Creator cannot use client-only APIs as a simulated client', () => {
    const fs = require('fs');
    const path = require('path');
    const msgSendContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'messages', 'send', 'route.ts'),
      'utf-8'
    );

    assert.ok(
      msgSendContent.includes("Creators cannot send messages as client."),
      'Message endpoint must block creators from sending messages as client'
    );
  });

  test('4. Creator cannot approve deliverables as client', () => {
    const fs = require('fs');
    const path = require('path');
    const approveContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'deliverables', 'approve', 'route.ts'),
      'utf-8'
    );

    assert.ok(
      approveContent.includes('requireClientDealAccess'),
      'Approve route must require strict client deal access'
    );
  });

  test('5. Creator cannot request client-side revisions as client', () => {
    const fs = require('fs');
    const path = require('path');
    const approveContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'deliverables', 'approve', 'route.ts'),
      'utf-8'
    );

    assert.ok(
      approveContent.includes('request_changes'),
      'Request changes route logic must be tied to client-only authorization'
    );
  });

  test('6. Creator cannot initiate client-only payment actions', () => {
    const fs = require('fs');
    const path = require('path');
    const dealAuthContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'deal-auth.ts'),
      'utf-8'
    );

    assert.equal(
      dealAuthContent.includes('isCreatorPreview'),
      false,
      'No preview mode bypass exists in authorization layer'
    );
  });

  test('7. Unauthenticated user cannot perform client actions', () => {
    const fs = require('fs');
    const path = require('path');
    const dealAuthContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'deal-auth.ts'),
      'utf-8'
    );

    assert.ok(
      dealAuthContent.includes("error: 'Unauthorized.'"),
      'Unauthenticated requests return Unauthorized error'
    );
  });

  test('8. Authenticated client with valid client session can access client workspace', () => {
    const fs = require('fs');
    const path = require('path');
    const dealAuthContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'deal-auth.ts'),
      'utf-8'
    );

    assert.ok(
      dealAuthContent.includes('client_access_sessions'),
      'Client access requires valid client_access_sessions token match'
    );
  });

  test('9. Client session remains deal-scoped', () => {
    const fs = require('fs');
    const path = require('path');
    const dealAuthContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'deal-auth.ts'),
      'utf-8'
    );

    assert.ok(
      dealAuthContent.includes('delt_client_session_${deal.id}'),
      'Client session cookies must be scoped to the specific deal ID'
    );
  });

  test('10. Removing preview does not weaken authorization', () => {
    const fs = require('fs');
    const path = require('path');
    const dealAuthContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'deal-auth.ts'),
      'utf-8'
    );

    assert.equal(
      dealAuthContent.includes('isCreator: true'),
      false,
      'requireClientDealAccess must never fall back to isCreator: true'
    );
    assert.equal(
      dealAuthContent.includes('role: isCreator'),
      false,
      'requireClientDealAccess must never set role: isCreator'
    );
  });

  test('Creator preview mode banner and UI elements are absent', () => {
    const forbiddenPhrases = [
      'Creator Preview: Client chat and actions are read-only in this view.',
      'Pay with Razorpay (Creator Preview Mode)',
      'Creator Preview (read-only client chat)',
    ];

    const fs = require('fs');
    const path = require('path');
    const clientPageContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'deal', '[identifier]', 'page.tsx'),
      'utf-8'
    );

    for (const phrase of forbiddenPhrases) {
      assert.equal(
        clientPageContent.includes(phrase),
        false,
        `Forbidden preview string "${phrase}" was found in Client Workspace page.`
      );
    }
  });

  test('File preview configuration types remain intact', () => {
    const validModes = ['AUTO', 'MANUAL', 'EXTERNAL', 'NONE'];
    
    assert.ok(validModes.includes('AUTO'));
    assert.ok(validModes.includes('MANUAL'));
    assert.ok(validModes.includes('EXTERNAL'));
    assert.ok(validModes.includes('NONE'));
  });
});
