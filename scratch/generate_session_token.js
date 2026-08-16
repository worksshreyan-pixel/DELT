const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eq = trimmed.indexOf('=');
  if (eq > 0) {
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const OTP_SECRET = env.SUPABASE_SERVICE_ROLE_KEY || 'delt_otp_default_hmac_secret_key_2026';

const dealId = '9631b6c4-a024-4149-a6bc-6e1048249050';
const dealToken = 'dlt_c333a345c28cb97bb3aac05f89ebde12';
const clientEmail = 'examonly2025@gmail.com';

const sessionPayload = {
  dealId: dealId,
  dealToken: dealToken,
  clientEmail: clientEmail,
  verifiedAt: Date.now(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
};

const payloadJson = JSON.stringify(sessionPayload);
const payloadB64 = Buffer.from(payloadJson).toString('base64url');
const signature = crypto
  .createHmac('sha256', OTP_SECRET)
  .update(payloadB64)
  .digest('base64url');

const clientSessionToken = `${payloadB64}.${signature}`;
const localStorageKey = `delt_session_${dealToken}`;

console.log('=== CLIENT SESSION BYPASS DETAILS ===');
console.log(`Local Storage Key: ${localStorageKey}`);
console.log(`Local Storage Value: ${clientSessionToken}`);
console.log(`\nJS to execute in Browser Console:`);
console.log(`localStorage.setItem('${localStorageKey}', '${clientSessionToken}'); window.location.reload();`);
