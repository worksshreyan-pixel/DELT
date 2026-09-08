const crypto = require('crypto');

const CLIENT_SESSION_TOKEN_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'delt_client_session_default_secret_2026';

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

console.log("Token Secret Length:", CLIENT_SESSION_TOKEN_SECRET.length);
