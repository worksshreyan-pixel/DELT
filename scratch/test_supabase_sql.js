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

async function testSqlApi(token) {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/db/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: 'ALTER TABLE deals ADD COLUMN IF NOT EXISTS preview_mode TEXT NOT NULL DEFAULT \'AUTO\';'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status, 'Response:', text);
  } catch(e) {
    console.log('Error:', e.message);
  }
}

async function run() {
  console.log('Testing Supabase SQL API with SUPABASE_SERVICE_ROLE_KEY...');
  await testSqlApi(env.SUPABASE_SERVICE_ROLE_KEY);
}

run();
