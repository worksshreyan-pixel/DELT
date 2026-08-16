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

async function listTables() {
  const { data, error } = await admin.rpc('get_tables');
  if (error) {
    console.log('rpc get_tables failed, trying select from pg_catalog...');
    // We can also query using a SELECT query if allowed, but since Supabase API doesn't allow direct system catalog select through postgrest by default, let's check what we can query.
    // Let's try selecting from a known table or run a query.
    const { data: selectData, error: selectError } = await admin
      .from('deals')
      .select('id')
      .limit(1);
    console.log('deals query check:', { selectData, selectError });
  } else {
    console.log('Tables from rpc:', data);
  }
}

listTables();
