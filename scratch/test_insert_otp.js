const { createClient } = require('@supabase/supabase-js');
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testInsert() {
  const randomUuid = '00000000-0000-0000-0000-000000000000';
  console.log('Inserting mock OTP directly into deal_otps with random UUID...');

  const { data: inserted, error: insertError } = await admin
    .from('deal_otps')
    .insert({
      deal_id: randomUuid,
      email: 'test@example.com',
      otp_hash: 'mock_hash_123',
      attempts: 0,
      verified: false,
      expires_at: new Date(Date.now() + 600000).toISOString(),
      created_at: new Date().toISOString(),
    })
    .select('*');

  console.log('Insert Result:', inserted);
  console.log('Insert Error:', insertError);
}

testInsert();
