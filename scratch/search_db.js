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

async function run() {
  console.log('Searching database for "dotsize"...');
  
  // Search deals
  const { data: deals, error: dealErr } = await admin.from('deals').select('*');
  if (deals) {
    for (const d of deals) {
      const str = JSON.stringify(d);
      if (str.includes('dotsize')) {
        console.log('Found in deals:', d.id);
      }
    }
  }

  // Search deliverables
  const { data: deliverables, error: delivErr } = await admin.from('deliverables').select('*');
  if (deliverables) {
    for (const d of deliverables) {
      const str = JSON.stringify(d);
      if (str.includes('dotsize')) {
        console.log('Found in deliverables:', d.id);
      }
    }
  }

  // Search file_versions
  const { data: versions, error: verErr } = await admin.from('file_versions').select('*');
  if (versions) {
    for (const v of versions) {
      const str = JSON.stringify(v);
      if (str.includes('dotsize')) {
        console.log('Found in file_versions:', v.id);
      }
    }
  }

  console.log('Database search complete.');
}

run();
