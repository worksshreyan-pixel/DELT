import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('SUPABASE URL:', url ? 'FOUND' : 'MISSING');

if (!url || !key) {
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data: deals, error: dErr } = await supabase.from('deals').select('id, deal_code, title, scope').limit(10);
  if (dErr) console.error('Deals error:', dErr);
  console.log('--- DEALS COUNT ---', deals?.length);

  if (deals && deals.length > 0) {
    for (const d of deals) {
      const { data: delivs } = await supabase.from('deliverables').select('*').eq('deal_id', d.id);
      const { data: files } = await supabase.from('file_versions').select('id, deliverable_id, version, files, status').eq('deal_id', d.id);
      console.log('\n=== DEAL ID:', d.id, '| CODE:', d.deal_code, '| TITLE:', d.title, '===');
      console.log('  DEAL.SCOPE:', JSON.stringify(d.scope));
      console.log('  DELIVERABLES TABLE (count=' + (delivs?.length || 0) + '):', JSON.stringify(delivs, null, 2));
      console.log('  FILE_VERSIONS TABLE (count=' + (files?.length || 0) + '):', JSON.stringify(files, null, 2));
    }
  }
}

check();
