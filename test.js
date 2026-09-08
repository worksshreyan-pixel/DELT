
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});
const admin = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: deal } = await admin.from('deals').select('*').eq('deal_code', 'DLT-T3WBQUWM').maybeSingle();
  if (!deal) return console.log('Deal not found');
  
  const { error: delError } = await admin.from('invoices').delete().eq('deal_id', deal.id);
  if (delError) console.log('Del Error:', delError);
  else console.log('Deleted test invoice(s) for the deal');
}
run();

