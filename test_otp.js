const crypto = require('crypto');

const CLIENT_SESSION_TOKEN_SECRET = 'delt_client_session_default_secret_2026';

function verifyClientSessionToken(
  tokenString,
  dealToken,
  rawEmail
) {
  if (!tokenString || !tokenString.includes('.')) return false;

  const [payloadB64, signature] = tokenString.split('.');
  if (!payloadB64 || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', CLIENT_SESSION_TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.dealToken !== dealToken) return false;
    if (payload.clientEmail !== rawEmail) return false;
    if (payload.expiresAt < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

const sessionPayload = {
    dealId: '123',
    dealToken: 'DLT-123',
    clientEmail: 'test@example.com',
    verifiedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, 
};

const payloadJson = JSON.stringify(sessionPayload);
const payloadB64 = Buffer.from(payloadJson).toString('base64url');
const signature = crypto
    .createHmac('sha256', CLIENT_SESSION_TOKEN_SECRET)
    .update(payloadB64)
    .digest('base64url');

const clientSessionToken = `${payloadB64}.${signature}`;
console.log("Token:", clientSessionToken);
console.log("Verified:", verifyClientSessionToken(clientSessionToken, 'DLT-123', 'test@example.com'));
