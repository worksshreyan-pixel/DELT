const { Client } = require('pg');
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

async function test(connStr) {
  const client = new Client({ connectionString: connStr, ssl: connStr.includes('supabase') ? { rejectUnauthorized: false } : false });
  try {
    await client.connect();
    console.log('Connected successfully to:', connStr.split('@')[1] || connStr);
    const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log('Tables:', res.rows.map(r => r.table_name));
    await client.end();
    return true;
  } catch(e) {
    console.log('Failed connecting to:', connStr.split('@')[1] || connStr, 'Error:', e.message);
    return false;
  }
}

async function run() {
  await test('postgresql://postgres:postgres@127.0.0.1:5432/postgres');
  await test('postgresql://postgres:postgres@127.0.0.1:54322/postgres');
}

run();
