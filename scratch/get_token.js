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

async function getToken() {
  const { data: deal, error } = await admin
    .from('deals')
    .select('token, title')
    .eq('id', '9631b6c4-a024-4149-a6bc-6e1048249050')
    .single();

  if (error) {
    console.error('Error fetching deal:', error);
    return;
  }

  console.log(`Deal Title: ${deal.title}`);
  console.log(`Token: ${deal.token}`);
  console.log(`URL: http://localhost:3000/deal/${deal.token}`);
}

getToken();
