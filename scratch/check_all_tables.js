const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const eq = line.indexOf('=');
  if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const tables = [
  'profiles', 'storage_usage', 'deal_credits', 'clients', 'deals',
  'deal_participants', 'deal_messages', 'price_proposals', 'deliverables',
  'file_versions', 'deal_events', 'milestones', 'payments', 'transactions',
  'notifications', 'deal_otps', 'invoices', 'invoice_items', 'client_access_sessions',
  'storage_connections', 'storage_objects', 'upload_sessions', 'deal_contracts', 'contract_versions'
];
async function check() {
  for (const t of tables) {
    const { status, error } = await sb.from(t).select('*').limit(1);
    console.log((t + ':').padEnd(25), status === 200 ? 'EXISTS (200)' : 'MISSING/ERROR (' + status + ') ' + (error?.code || ''));
  }
}
check();
