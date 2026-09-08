const http = require('http');

async function testApi() {
  const token = 'DLT-16YXCQG3';
  
  // 1. verify-access without token
  const res1 = await fetch(`http://localhost:3000/api/deals/${token}/verify-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const json1 = await res1.json();
  console.log("verify-access (no token):", json1.authorized);

  // 2. generate a mock token using otp lib logic
  const crypto = require('crypto');
  const CLIENT_SESSION_TOKEN_SECRET = 'delt_client_session_default_secret_2026';
  
  const payloadB64 = Buffer.from(JSON.stringify({
    dealId: json1.deal?.id || 'mock-id',
    dealToken: token,
    clientEmail: 'client@example.com',
    verifiedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  })).toString('base64url');
  
  const signature = crypto.createHmac('sha256', CLIENT_SESSION_TOKEN_SECRET).update(payloadB64).digest('base64url');
  const mockToken = `${payloadB64}.${signature}`;

  // 3. verify-access with token
  const res2 = await fetch(`http://localhost:3000/api/deals/${token}/verify-access`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-client-session-token': mockToken
    }
  });
  const json2 = await res2.json();
  console.log("verify-access (with token):", json2.authorized, json2.error || '');
}

testApi();
