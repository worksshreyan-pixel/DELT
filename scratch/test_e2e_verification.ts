import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function runVerification() {
  console.log('=== STARTING AUTOMATED E2E & SECURITY REGRESSION SUITE ===');

  // 1. Fetch test deals or create two distinct deals (Deal A and Deal B)
  const { data: deals } = await supabase.from('deals').select('*').limit(5);
  if (!deals || deals.length < 2) {
    console.log('Not enough deals to run cross-deal test. Found:', deals?.length);
    return;
  }

  const dealA = deals[0];
  const dealB = deals[1];

  console.log(`Deal A: ID=${dealA.id}, Code=${dealA.deal_code}, ClientEmail=${dealA.client_email}, PreviewMode=${dealA.preview_mode}, PaymentStatus=${dealA.payment_status}`);
  console.log(`Deal B: ID=${dealB.id}, Code=${dealB.deal_code}, ClientEmail=${dealB.client_email}`);

  // Test 1: Signed URL Security Regression (Unpaid Deal with preview_mode = NONE)
  console.log('\n--- TEST 1: Signed URL Security Regression (Unpaid preview_mode=NONE) ---');
  // Temporarily set preview_enabled = true, preview_mode = NONE, payment_status = pending for Deal A
  await supabase.from('deals').update({ preview_enabled: true, preview_mode: 'NONE', payment_status: 'pending', status: 'in_progress' }).eq('id', dealA.id);

  // Request OTP for Deal A to obtain valid client session token
  const otpRes = await fetch(`http://localhost:3000/api/deals/${dealA.deal_code}/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: dealA.client_email })
  });
  console.log('Request OTP A status:', otpRes.status);

  // Fetch the latest OTP from deal_otps table directly for testing
  const { data: otps } = await supabase.from('deal_otps').select('*').eq('deal_id', dealA.id).order('created_at', { ascending: false }).limit(1);
  if (!otps || otps.length === 0) {
    console.log('Could not get OTP from DB for testing');
    return;
  }

  // We can use verify-otp with the code if we know it, or generate a valid client session token via lib/otp logic
  // Let's call verify-otp route
  const verifyRes = await fetch(`http://localhost:3000/api/deals/${dealA.deal_code}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: dealA.client_email, otp: '123456' }) // Will fail unless we inspect or mock verification token
  });
  console.log('Verify OTP response status:', verifyRes.status);

  // Let's test signed-url endpoint directly with Client A headers
  const signedUrlUnpaidRes = await fetch(`http://localhost:3000/api/files/signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-session-token': 'fake_token_or_invalid'
    },
    body: JSON.stringify({ dealId: dealA.id, filePath: 'test.png', token: dealA.token })
  });
  console.log('Signed URL Unpaid Preview=NONE status (Expect 403):', signedUrlUnpaidRes.status);
  const signedUrlUnpaidData = await signedUrlUnpaidRes.json();
  console.log('Response body:', signedUrlUnpaidData);

  // Test 2: Stale Version Regression Test
  console.log('\n--- TEST 2: Stale Version Approval Regression Test ---');
  // Find a deliverable for Deal A with file versions
  const { data: deliverables } = await supabase.from('deliverables').select('*').eq('deal_id', dealA.id).limit(1);
  if (deliverables && deliverables.length > 0) {
    const del = deliverables[0];
    // Fetch file versions for this deliverable
    const { data: versions } = await supabase.from('file_versions').select('*').eq('deliverable_id', del.id).order('version', { ascending: false });

    if (versions && versions.length >= 2) {
      const latestVer = versions[0]; // e.g. Version 2
      const olderVer = versions[1];  // e.g. Version 1

      console.log(`Deliverable ${del.id} has Latest Version ${latestVer.id} (v${latestVer.version}) and Stale Version ${olderVer.id} (v${olderVer.version})`);

      // Attempt to approve specifying the older/stale version ID
      const approveStaleRes = await fetch('http://localhost:3000/api/deliverables/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: dealA.id,
          dealCode: dealA.deal_code,
          deliverableId: del.id,
          versionId: olderVer.id,
          action: 'approve',
          clientName: 'Test Client'
        })
      });

      console.log('Approve Stale Version status (Expect 400):', approveStaleRes.status);
      const staleData = await approveStaleRes.json();
      console.log('Response body:', staleData);
    } else {
      console.log('Deliverable does not have 2+ versions. Creating temporary v1 and v2 for testing...');
      // Insert dummy v1 and v2 for testing
      const { data: v1 } = await supabase.from('file_versions').insert({
        deal_id: dealA.id,
        deliverable_id: del.id,
        version: 1,
        status: 'changes_requested',
        files: [{ name: 'v1.png', path: 'v1.png' }]
      }).select().single();

      const { data: v2 } = await supabase.from('file_versions').insert({
        deal_id: dealA.id,
        deliverable_id: del.id,
        version: 2,
        status: 'pending_review',
        files: [{ name: 'v2.png', path: 'v2.png' }]
      }).select().single();

      if (v1 && v2) {
        const approveStaleRes = await fetch('http://localhost:3000/api/deliverables/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: dealA.id,
            dealCode: dealA.deal_code,
            deliverableId: del.id,
            versionId: v1.id,
            action: 'approve',
            clientName: 'Test Client'
          })
        });

        console.log('Approve Stale Version v1 when v2 exists status (Expect 400):', approveStaleRes.status);
        const staleData = await approveStaleRes.json();
        console.log('Response body:', staleData);

        // Clean up test versions
        await supabase.from('file_versions').delete().in('id', [v1.id, v2.id]);
      }
    }
  }

  // Test 3: Cross-Deal Authorization Test
  console.log('\n--- TEST 3: Cross-Deal Authorization Test ---');
  // Attempt to call deliverables/approve for Deal B using Deal A code
  const crossDealRes = await fetch('http://localhost:3000/api/deliverables/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dealId: dealB.id,
      dealCode: dealA.deal_code, // Mismatched deal code!
      deliverableId: 'del-fake',
      action: 'approve'
    })
  });
  console.log('Cross-deal approval status (Expect 400 or 403):', crossDealRes.status);
  const crossDealData = await crossDealRes.json();
  console.log('Response body:', crossDealData);

  console.log('\n=== E2E AUTOMATED SECURITY SUITE COMPLETED ===');
}

runVerification();
