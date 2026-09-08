const crypto = require('crypto');

function test() {
  const CLIENT_SESSION_TOKEN_SECRET = 'delt_client_session_default_secret_2026';

  const dealId = '123';
  const dealToken = 'DLT-16YXCQG3';
  const normalizedEmail = 'client@example.com';
  
  const sessionPayload = {
    dealId: dealId,
    dealToken: dealToken,
    clientEmail: normalizedEmail,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payloadJson = JSON.stringify(sessionPayload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64url');
  const signature = crypto
    .createHmac('sha256', CLIENT_SESSION_TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const clientSessionToken = `${payloadB64}.${signature}`;

  // Verification
  const [pB64, sig] = clientSessionToken.split('.');
  
  const expectedSignature = crypto
    .createHmac('sha256', CLIENT_SESSION_TOKEN_SECRET)
    .update(pB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(sig);
  const expBuffer = Buffer.from(expectedSignature);

  console.log(sigBuffer.length === expBuffer.length);
  console.log(crypto.timingSafeEqual(sigBuffer, expBuffer));
  
  const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf-8'));
  console.log(payload.dealToken === dealToken);
  console.log(payload.clientEmail === normalizedEmail);
  console.log(payload.expiresAt > Date.now());
}
test();
