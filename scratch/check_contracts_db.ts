import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

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
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log('SUPABASE URL:', url ? 'FOUND' : 'MISSING');
console.log('SUPABASE KEY:', key ? 'FOUND' : 'MISSING');
console.log('DATABASE URL:', dbUrl ? 'FOUND' : 'MISSING');

async function run() {
  if (url && key) {
    const supabase = createClient(url, key);

    console.log('\n--- TESTING SUPABASE CLIENT FOR deal_contracts ---');
    const { data: dcData, error: dcErr, status: dcStatus } = await supabase.from('deal_contracts').select('*').limit(1);
    console.log('deal_contracts status:', dcStatus);
    console.log('deal_contracts error:', dcErr);

    console.log('\n--- TESTING SUPABASE CLIENT FOR contract_versions ---');
    const { data: cvData, error: cvErr, status: cvStatus } = await supabase.from('contract_versions').select('*').limit(1);
    console.log('contract_versions status:', cvStatus);
    console.log('contract_versions error:', cvErr);
  }

  if (dbUrl) {
    console.log('\n--- TESTING DIRECT PG DATABASE CONNECTION ---');
    const client = new pg.Client({ connectionString: dbUrl });
    try {
      await client.connect();
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      console.log('Tables in public schema:', res.rows.map(r => r.table_name));

      const targetCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('deal_contracts', 'contract_versions');
      `);
      console.log('Target tables check in PG:', targetCheck.rows);

    } catch (e) {
      console.error('PG error:', e);
    } finally {
      await client.end();
    }
  }
}

run();
