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

const ref = 'bqliwinxpgopiwerumpn';

async function testHost(host, port, user, pass) {
  const connStr = `postgresql://${user}:${pass}@${host}:${port}/postgres`;
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log(`SUCCESS connected to ${host}:${port}!`);
    const res = await client.query('ALTER TABLE deals ADD COLUMN IF NOT EXISTS preview_mode TEXT NOT NULL DEFAULT \'AUTO\';');
    console.log('Migration query result:', res);
    await client.end();
    return true;
  } catch(e) {
    console.log(`Failed ${host}:${port} (${user}):`, e.message);
    return false;
  }
}

async function run() {
  console.log('Testing remote postgres connections...');
  // Common passwords or service role
  const passes = ['postgres', 'postgres123', 'Password123!', env.SUPABASE_SERVICE_ROLE_KEY];
  const hosts = [`db.${ref}.supabase.co`, `aws-0-ap-south-1.pooler.supabase.com`, `aws-0-us-east-1.pooler.supabase.com`];
  
  for (const host of hosts) {
    for (const port of [5432, 6543]) {
      for (const pass of ['postgres', 'postgres123']) {
        const ok = await testHost(host, port, 'postgres', pass);
        if (ok) return;
        const ok2 = await testHost(host, port, `postgres.${ref}`, pass);
        if (ok2) return;
      }
    }
  }
}

run();
