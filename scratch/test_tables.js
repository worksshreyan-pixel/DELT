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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const tableNames = [
    'profiles',
    'deals',
    'deal_events',
    'deal_messages',
    'price_proposals',
    'deliverables',
    'file_versions',
    'payments',
    'transactions',
    'notifications',
    'storage_usage',
    'deal_credits',
    'deal_otps',
    'otp_verifications'
  ];

  for (const name of tableNames) {
    const { data, error } = await admin.from(name).select('*').limit(1);
    console.log(`Table '${name}':`, error ? `ERROR: ${error.message}` : 'EXISTS (OK)');
  }
}

checkTables();
